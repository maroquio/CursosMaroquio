pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'cursos-maroquio'
        ENV_SOURCE = '/opt/secrets/cursos-maroquio/.env'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    echo "Deploying commit: ${env.GIT_COMMIT_SHORT} (build #${env.BUILD_NUMBER})"
                }
            }
        }

        stage('Setup Environment') {
            steps {
                sh '''
                    if [ ! -f "$ENV_SOURCE" ]; then
                        echo "ERROR: .env not found at $ENV_SOURCE"
                        echo "Create it with: cp .env.production /opt/secrets/cursos-maroquio/.env"
                        exit 1
                    fi
                    cp "$ENV_SOURCE" .env
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh 'docker compose build --no-cache'
            }
        }

        stage('Start Database') {
            steps {
                sh '''
                    docker compose up -d postgres

                    echo "Waiting for PostgreSQL..."
                    for i in $(seq 1 12); do
                        if docker compose exec -T postgres pg_isready -U cursos_maroquio 2>/dev/null; then
                            echo "PostgreSQL is ready!"
                            exit 0
                        fi
                        echo "  attempt $i/12..."
                        sleep 5
                    done

                    echo "ERROR: PostgreSQL failed to start"
                    exit 1
                '''
            }
        }

        stage('Reset Database') {
            steps {
                sh '''
                    echo "Stopping app containers to release DB connections..."
                    docker compose stop backend frontend || true

                    echo "Dropping and recreating database (fresh deploy, no user data)..."
                    docker compose exec -T postgres dropdb -U cursos_maroquio --if-exists cursos_maroquio
                    docker compose exec -T postgres createdb -U cursos_maroquio -O cursos_maroquio cursos_maroquio
                '''
            }
        }

        stage('Run Migrations') {
            steps {
                sh '''
                    docker compose run --rm --no-deps \
                      -v "$(pwd)/backend/drizzle.config.ts:/app/drizzle.config.ts:ro" \
                      -v "$(pwd)/backend/src/infrastructure/database/migrations:/app/src/infrastructure/database/migrations:ro" \
                      backend bunx drizzle-kit migrate
                '''
            }
        }

        stage('Seed Courses') {
            steps {
                sh '''
                    docker compose run --rm --no-deps \
                      -v "$(pwd)/backend/src:/app/src:ro" \
                      -v "$(pwd)/backend/scripts:/app/scripts:ro" \
                      -v "$(pwd)/backend/tsconfig.json:/app/tsconfig.json:ro" \
                      -v "$(pwd)/content:/content:ro" \
                      backend bun scripts/import-course-content.ts
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose up -d --force-recreate backend frontend'
            }
        }

        stage('Verify') {
            steps {
                sh '''
                    echo "Waiting for services to stabilize..."
                    sleep 15

                    docker compose ps

                    curl -sf http://localhost:8117/health || {
                        echo "ERROR: Health check failed"
                        docker compose logs --tail=30
                        exit 1
                    }

                    echo "Deploy OK: http://cursos.maroquio.com:8117"
                '''
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f || true'
            sh 'rm -f .env || true'
        }
        failure {
            sh 'docker compose logs --tail=50 || true'
        }
    }
}
