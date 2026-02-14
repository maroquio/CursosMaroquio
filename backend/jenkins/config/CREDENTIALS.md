# Jenkins Credentials Configuration

Este documento descreve como configurar as credenciais necessárias no Jenkins para o pipeline CI/CD.

## Credenciais Necessárias

### 1. docker-registry (Username with Password)

**ID:** `docker-registry`
**Tipo:** Username with password
**Uso:** Autenticação no Docker Registry

**Como configurar:**
1. Acesse Jenkins → Manage Jenkins → Credentials
2. Selecione o domínio (Global ou específico)
3. Clique em "Add Credentials"
4. Selecione "Username with password"
5. Preencha:
   - **Username:** Seu usuário do Docker Registry
   - **Password:** Sua senha ou token de acesso
   - **ID:** `docker-registry`
   - **Description:** Docker Registry credentials

**Registries suportados:**
- Docker Hub: Deixe o registry URL vazio
- AWS ECR: Use `aws ecr get-login-password` para obter token
- Google GCR: Use service account JSON key
- Harbor/Nexus: Use credenciais do usuário

---

### 2. docker-registry-url (Secret Text)

**ID:** `docker-registry-url`
**Tipo:** Secret text
**Uso:** URL do Docker Registry

**Como configurar:**
1. Acesse Jenkins → Manage Jenkins → Credentials
2. Clique em "Add Credentials"
3. Selecione "Secret text"
4. Preencha:
   - **Secret:** URL do seu registry (ex: `registry.example.com`)
   - **ID:** `docker-registry-url`
   - **Description:** Docker Registry URL

**Exemplos de URLs:**
- Docker Hub: `docker.io`
- AWS ECR: `123456789.dkr.ecr.us-east-1.amazonaws.com`
- Google GCR: `gcr.io/project-id`
- Harbor: `harbor.example.com`

---

### 3. vps-staging-ssh (SSH Username with Private Key)

**ID:** `vps-staging-ssh`
**Tipo:** SSH Username with private key
**Uso:** Acesso SSH ao servidor de staging

**Como configurar:**
1. Acesse Jenkins → Manage Jenkins → Credentials
2. Clique em "Add Credentials"
3. Selecione "SSH Username with private key"
4. Preencha:
   - **Username:** Usuário SSH (ex: `deploy`)
   - **Private Key:** Cole sua chave privada SSH
   - **Passphrase:** Senha da chave (se houver)
   - **ID:** `vps-staging-ssh`
   - **Description:** SSH key for staging server

**Preparação do servidor:**
```bash
# No servidor de staging
# 1. Criar usuário de deploy
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# 2. Adicionar chave pública
sudo mkdir -p /home/deploy/.ssh
sudo nano /home/deploy/.ssh/authorized_keys
# Cole a chave pública correspondente

# 3. Ajustar permissões
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh

# 4. Criar diretório da aplicação
sudo mkdir -p /opt/app
sudo chown deploy:deploy /opt/app
```

---

### 4. vps-production-ssh (SSH Username with Private Key)

**ID:** `vps-production-ssh`
**Tipo:** SSH Username with private key
**Uso:** Acesso SSH ao servidor de produção

**Como configurar:**
Siga os mesmos passos do `vps-staging-ssh`, mas:
- Use uma chave SSH diferente (melhor prática)
- **ID:** `vps-production-ssh`
- **Description:** SSH key for production server

**Recomendações de segurança para produção:**
- Use chaves SSH ED25519 (mais seguras)
- Configure `PermitRootLogin no` no sshd
- Use fail2ban para proteção contra brute force
- Considere usar bastion host

---

## Configuração Opcional

### Slack Notification

**ID:** `slack-webhook`
**Tipo:** Secret text
**Uso:** Notificações no Slack

**Como configurar:**
1. Crie um Incoming Webhook no Slack
2. No Jenkins, adicione como "Secret text"
3. **ID:** `slack-webhook`

**No Jenkinsfile, descomente as linhas de Slack notification.**

---

## Verificação das Credenciais

### Script de teste
```groovy
// Execute no Jenkins Script Console
// Manage Jenkins → Script Console

def creds = [
    'docker-registry',
    'docker-registry-url',
    'vps-staging-ssh',
    'vps-production-ssh'
]

creds.each { credId ->
    def found = com.cloudbees.plugins.credentials.CredentialsProvider.lookupCredentials(
        com.cloudbees.plugins.credentials.common.StandardCredentials.class,
        Jenkins.instance,
        null,
        null
    ).find { it.id == credId }

    println "${credId}: ${found ? 'OK' : 'NOT FOUND'}"
}
```

---

## Estrutura de Diretórios no Servidor

```
/opt/app/
├── docker-compose.prod.yml    # Copiado durante primeiro deploy
├── .env                       # Variáveis de ambiente (criar manualmente)
├── data/                      # Dados persistentes (SQLite, uploads)
│   └── production.db
├── scripts/
│   └── backup-db.sh          # Script de backup (criar manualmente)
└── backups/                   # Backups do banco de dados
```

### Arquivo .env no servidor
```bash
# /opt/app/.env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-key-here-change-me
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=https://your-frontend.com
```

### Script de backup
```bash
#!/bin/bash
# /opt/app/scripts/backup-db.sh

BACKUP_DIR="/opt/app/backups"
DB_PATH="/opt/app/data/production.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH "$BACKUP_DIR/production_$DATE.db"

# Manter apenas últimos 7 backups
ls -t $BACKUP_DIR/production_*.db | tail -n +8 | xargs -r rm
```

---

## Troubleshooting

### Erro: "Permission denied" no SSH
```bash
# Verificar permissões
ls -la /home/deploy/.ssh/
# authorized_keys deve ser 600
# .ssh deve ser 700

# Verificar logs do SSH
sudo tail -f /var/log/auth.log
```

### Erro: "Docker login failed"
```bash
# Verificar se Docker está rodando
sudo systemctl status docker

# Testar login manualmente
docker login registry.example.com
```

### Erro: "Health check failed"
```bash
# Verificar logs do container
docker-compose -f docker-compose.prod.yml logs -f

# Verificar se a porta está acessível
curl -v http://localhost:3000/health
```
