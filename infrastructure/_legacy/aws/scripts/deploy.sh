#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID}"
PROJECT_NAME="${PROJECT_NAME:-ef-platform}"

SERVICES=("api-gateway" "auth-service" "users-service")

echo "==> Login ECR"
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

for SERVICE in "${SERVICES[@]}"; do
  REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-${SERVICE}"
  IMAGE_TAG="${REPO}:latest"

  echo "==> Building ${SERVICE}"
  docker build \
    -f "infrastructure/docker/Dockerfile.${SERVICE}" \
    -t "$IMAGE_TAG" \
    apps/backend

  echo "==> Pushing ${SERVICE}"
  docker push "$IMAGE_TAG"
done

echo "==> Deploying to EKS"
export AWS_ACCOUNT_ID AWS_REGION
envsubst < infrastructure/kubernetes/services/api-gateway.yaml | kubectl apply -f -
envsubst < infrastructure/kubernetes/services/auth-service.yaml | kubectl apply -f -
envsubst < infrastructure/kubernetes/services/users-service.yaml | kubectl apply -f -

echo "==> Deployment complete"
