#!/usr/bin/env bash
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
ECR_REPO="${ECR_REPO_NAME:-presswall}"
VPS_IP="${VPS_IP:?Set VPS_IP to your server Elastic IP}"
KEY_PATH="${EC2_KEY_PATH:-$HOME/.ssh/presswall-debian.pem}"
# Never inherit tunnel URLs or incomplete scopes from a local .env.
PROD_URL="https://presswall.noxify.io"
SCOPES="write_app_proxy,read_themes"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:latest"

aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
docker build \
  --build-arg SHOPIFY_APP_URL="${PROD_URL}" \
  --build-arg SCOPES="${SCOPES}" \
  -t "$IMAGE_URI" .

docker push "$IMAGE_URI"

mkdir -p "$HOME/.ssh"
ssh-keyscan -H "$VPS_IP" >>"$HOME/.ssh/known_hosts" 2>/dev/null || true

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=accept-new "admin@${VPS_IP}" bash -s <<EOF
set -euo pipefail
REGION="${REGION}"
ACCOUNT_ID="${ACCOUNT_ID}"
IMAGE_URI="${IMAGE_URI}"
PROD_URL="${PROD_URL}"
SCOPES="${SCOPES}"

aws ecr get-login-password --region "\$REGION" | sudo docker login --username AWS --password-stdin "\${ACCOUNT_ID}.dkr.ecr.\${REGION}.amazonaws.com"

SHOPIFY_API_KEY="\$(aws secretsmanager get-secret-value --secret-id presswall/shopify-api-key --region "\$REGION" --query SecretString --output text)"
SHOPIFY_API_SECRET="\$(aws secretsmanager get-secret-value --secret-id presswall/shopify-api-secret --region "\$REGION" --query SecretString --output text)"
TURSO_AUTH_TOKEN="\$(aws secretsmanager get-secret-value --secret-id presswall/turso-auth-token --region "\$REGION" --query SecretString --output text)"
TURSO_DATABASE_URL="\$(aws secretsmanager get-secret-value --secret-id presswall/turso-database-url --region "\$REGION" --query SecretString --output text)"

sudo docker rm -f presswall >/dev/null 2>&1 || true
sudo docker pull "\$IMAGE_URI"
sudo docker run -d --name presswall --restart unless-stopped \\
  -p 127.0.0.1:3000:3000 \\
  -e NODE_ENV=production \\
  -e PORT=3000 \\
  -e SHOPIFY_APP_URL="\$PROD_URL" \\
  -e SCOPES="\$SCOPES" \\
  -e TURSO_DATABASE_URL="\$TURSO_DATABASE_URL" \\
  -e SHOPIFY_API_KEY="\$SHOPIFY_API_KEY" \\
  -e SHOPIFY_API_SECRET="\$SHOPIFY_API_SECRET" \\
  -e TURSO_AUTH_TOKEN="\$TURSO_AUTH_TOKEN" \\
  "\$IMAGE_URI"

sudo systemctl reload caddy
curl -sI http://127.0.0.1:3000/ | head -3
EOF