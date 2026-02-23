#!/bin/bash
# =============================================================================
# Deploy Script for Jenkins
# =============================================================================
# Usage: ./jenkins/scripts/deploy.sh <environment> [version]
#
# Arguments:
#   environment - staging | production
#   version     - Docker image tag (default: latest)
#
# Environment variables:
#   DEPLOY_HOST     - Target server hostname
#   DEPLOY_USER     - SSH username (default: deploy)
#   DEPLOY_PATH     - Application path on server (default: /opt/app)
#   DOCKER_REGISTRY - Docker registry URL (optional)
# =============================================================================

set -e

ENVIRONMENT=${1:?Environment required (staging|production)}
VERSION=${2:-latest}

APP_NAME="typescript-bun-backend"
DEPLOY_USER=${DEPLOY_USER:-deploy}
DEPLOY_PATH=${DEPLOY_PATH:-/opt/app}

# Validate environment
case $ENVIRONMENT in
    staging)
        DEPLOY_HOST=${DEPLOY_HOST:-staging.example.com}
        ;;
    production)
        DEPLOY_HOST=${DEPLOY_HOST:-production.example.com}
        ;;
    *)
        echo "Error: Invalid environment. Use 'staging' or 'production'"
        exit 1
        ;;
esac

echo "=========================================="
echo "Deploying ${APP_NAME}:${VERSION}"
echo "Environment: ${ENVIRONMENT}"
echo "Host: ${DEPLOY_HOST}"
echo "=========================================="

# Build image name
if [ -n "$DOCKER_REGISTRY" ]; then
    IMAGE="${DOCKER_REGISTRY}/${APP_NAME}:${VERSION}"
else
    IMAGE="${APP_NAME}:${VERSION}"
fi

# Deploy via SSH
ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} << ENDSSH
    set -e

    echo "Connecting to ${DEPLOY_HOST}..."
    cd ${DEPLOY_PATH}

    # Export image tag for docker-compose
    export IMAGE_TAG=${VERSION}

    # Pull latest image
    echo "Pulling image ${IMAGE}..."
    docker-compose -f docker-compose.prod.yml pull

    # Backup database (production only)
    if [ "${ENVIRONMENT}" = "production" ]; then
        echo "Backing up database..."
        ./scripts/backup-db.sh || echo "Warning: Backup script not found"
    fi

    # Rolling restart
    echo "Restarting application..."
    docker-compose -f docker-compose.prod.yml up -d

    # Wait for health check
    echo "Waiting for health check..."
    sleep 10

    # Verify deployment
    echo "Verifying deployment..."
    for i in {1..5}; do
        if curl -sf http://localhost:8702/health > /dev/null; then
            echo "Health check passed!"
            break
        fi
        if [ \$i -eq 5 ]; then
            echo "Health check failed!"
            exit 1
        fi
        echo "Retry \$i/5..."
        sleep 5
    done

    # Show running containers
    docker-compose -f docker-compose.prod.yml ps

    echo "Deployment successful!"
ENDSSH

echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
