#!/bin/bash

# CrowdEval Deployment Script
# This script automates the deployment of CrowdEval to a DigitalOcean droplet

set -e  # Exit on any error

echo "🚀 Starting CrowdEval deployment..."

# Check if we're on the droplet
if [ ! -d "/opt/crowdeval" ]; then
    echo "❌ This script must be run on the DigitalOcean droplet"
    echo "Please SSH into your droplet and run this script from the /opt/crowdeval directory"
    exit 1
fi

# Update system packages
echo "🔄 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt install -y docker.io docker-compose certbot

# Start and enable Docker
echo "🐳 Starting Docker service..."
systemctl start docker
systemctl enable docker

# Create directories
echo "📁 Creating required directories..."
mkdir -p certs
mkdir -p keycloak-themes

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please create one with your configuration."
    echo "You can copy .env.production to .env and modify it with your values."
    exit 1
fi

# Load environment variables
source .env

# Check if SSL certificates exist
if [ ! -f "certs/tls.crt" ] || [ ! -f "certs/tls.key" ]; then
    echo "⚠️  SSL certificates not found."
    echo "Please obtain SSL certificates using Let's Encrypt or place your certificates in the certs directory:"
    echo "  - certs/tls.crt (certificate)"
    echo "  - certs/tls.key (private key)"
    echo ""
    echo "For Let's Encrypt, run:"
    echo "  certbot certonly --standalone -d $KEYCLOAK_DOMAIN"
    echo "  cp /etc/letsencrypt/live/$KEYCLOAK_DOMAIN/fullchain.pem certs/tls.crt"
    echo "  cp /etc/letsencrypt/live/$KEYCLOAK_DOMAIN/privkey.pem certs/tls.key"
    exit 1
fi

# Build the Next.js application
echo "🏗️  Building Next.js application..."
npm run build

# Start services with Docker Compose
echo "サービ Starting services with Docker Compose..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Check service status: docker-compose -f docker-compose.prod.yml ps"
echo "2. View logs if needed: docker-compose -f docker-compose.prod.yml logs"
echo "3. Initialize Keycloak: docker-compose -f docker-compose.prod.yml exec keycloak-init node init-keycloak.js"
echo "4. Access your application at: https://$KEYCLOAK_DOMAIN"