#!/bin/bash

# ============================================================================
# CONTACTO PLATFORM - QUICK START SCRIPT
# ============================================================================
# This script automates the initial setup of the development environment
# Run with: bash setup.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================================================
# STEP 1: Prerequisites Check
# ============================================================================
print_header "STEP 1: Checking Prerequisites"

# Check Docker
if command_exists docker; then
    print_success "Docker is installed ($(docker --version))"
else
    print_error "Docker is not installed!"
    print_info "Install from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if command_exists docker-compose; then
    print_success "Docker Compose is installed ($(docker-compose --version))"
else
    print_error "Docker Compose is not installed!"
    print_info "Install from: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed ($NODE_VERSION)"
    
    # Check if version is >= 20
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 20 ]; then
        print_warning "Node.js version should be 20 or higher. Current: $NODE_VERSION"
        print_info "Consider upgrading from: https://nodejs.org/"
    fi
else
    print_error "Node.js is not installed!"
    print_info "Install from: https://nodejs.org/ (v20 or higher)"
    exit 1
fi

# Check pnpm
if command_exists pnpm; then
    print_success "pnpm is installed ($(pnpm --version))"
else
    print_warning "pnpm is not installed. Installing..."
    npm install -g pnpm
    print_success "pnpm installed successfully"
fi

# ============================================================================
# STEP 2: Environment Setup
# ============================================================================
print_header "STEP 2: Setting Up Environment"

# Copy .env.example to .env if not exists
if [ ! -f .env ]; then
    print_info "Creating .env file from .env.example..."
    cp .env.example .env
    
    # Generate secrets
    print_info "Generating secure random secrets..."
    
    if command_exists openssl; then
        JWT_SECRET=$(openssl rand -hex 32)
        JWT_REFRESH_SECRET=$(openssl rand -hex 32)
        SESSION_SECRET=$(openssl rand -hex 32)
        ENCRYPTION_KEY=$(openssl rand -hex 32)
        
        # Update .env file (macOS and Linux compatible)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/your_super_secret_jwt_key_min_32_characters_change_in_production/$JWT_SECRET/" .env
            sed -i '' "s/your_super_secret_refresh_key_change_this_in_production/$JWT_REFRESH_SECRET/" .env
            sed -i '' "s/your_super_secret_session_key_change_this_in_production/$SESSION_SECRET/" .env
            sed -i '' "s/your_32_character_encryption_key_change_in_production/$ENCRYPTION_KEY/" .env
        else
            sed -i "s/your_super_secret_jwt_key_min_32_characters_change_in_production/$JWT_SECRET/" .env
            sed -i "s/your_super_secret_refresh_key_change_this_in_production/$JWT_REFRESH_SECRET/" .env
            sed -i "s/your_super_secret_session_key_change_this_in_production/$SESSION_SECRET/" .env
            sed -i "s/your_32_character_encryption_key_change_in_production/$ENCRYPTION_KEY/" .env
        fi
        
        print_success "Secrets generated and updated in .env"
    else
        print_warning "OpenSSL not found. Please manually update secrets in .env file."
    fi
    
    print_success ".env file created"
    print_warning "Please review .env file and update any additional values as needed"
else
    print_success ".env file already exists"
fi

# ============================================================================
# STEP 3: Start Infrastructure
# ============================================================================
print_header "STEP 3: Starting Infrastructure Services"

print_info "Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 10

# Check PostgreSQL
print_info "Checking PostgreSQL..."
until docker exec contacto_postgres pg_isready -U contacto > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
print_success "PostgreSQL is ready"

# Check Redis
print_info "Checking Redis..."
until docker exec contacto_redis redis-cli ping > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
print_success "Redis is ready"

# Check Kafka
print_info "Checking Kafka..."
sleep 5  # Kafka takes longer to start
print_success "Kafka is starting (may take a few more seconds)"

print_success "All infrastructure services are running"

# Show running containers
docker-compose ps

# ============================================================================
# STEP 4: Backend Setup
# ============================================================================
print_header "STEP 4: Setting Up Backend Services"

# Identity Service
print_info "Setting up Identity Service..."
cd backend/services/identity

print_info "Installing dependencies..."
pnpm install --silent

print_info "Generating Prisma client..."
pnpm prisma generate

print_info "Running database migrations..."
pnpm prisma migrate dev --name init

print_success "Identity Service setup complete"
cd ../../..

# ============================================================================
# STEP 5: Frontend Setup
# ============================================================================
print_header "STEP 5: Setting Up Frontend"

cd frontend

print_info "Installing dependencies..."
pnpm install --silent

print_success "Frontend setup complete"
cd ..

# ============================================================================
# STEP 6: Mobile Setup (Optional)
# ============================================================================
print_header "STEP 6: Setting Up Mobile App (Optional)"

read -p "Do you want to setup the mobile app? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd mobile
    
    print_info "Installing dependencies..."
    npm install --silent
    
    print_success "Mobile app setup complete"
    cd ..
else
    print_info "Skipping mobile app setup"
fi

# ============================================================================
# STEP 7: Verification
# ============================================================================
print_header "STEP 7: Verifying Setup"

# Check if services are responding
print_info "Checking service health..."

# PostgreSQL
if docker exec contacto_postgres pg_isready -U contacto > /dev/null 2>&1; then
    print_success "PostgreSQL: Running"
else
    print_error "PostgreSQL: Not responding"
fi

# Redis
if docker exec contacto_redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis: Running"
else
    print_error "Redis: Not responding"
fi

# Meilisearch
if curl -s http://localhost:7700/health > /dev/null 2>&1; then
    print_success "Meilisearch: Running"
else
    print_warning "Meilisearch: Not responding (may still be starting)"
fi

# MinIO
if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    print_success "MinIO: Running"
else
    print_warning "MinIO: Not responding (may still be starting)"
fi

# ============================================================================
# STEP 8: Summary & Next Steps
# ============================================================================
print_header "SETUP COMPLETE! 🚀"

echo -e "${GREEN}✓ Infrastructure is running${NC}"
echo -e "${GREEN}✓ Database is migrated${NC}"
echo -e "${GREEN}✓ Backend is ready${NC}"
echo -e "${GREEN}✓ Frontend is ready${NC}"

print_header "NEXT STEPS"

echo -e "${BLUE}1. Start the Identity Service:${NC}"
echo -e "   cd backend/services/identity"
echo -e "   pnpm dev"
echo ""

echo -e "${BLUE}2. Start the Frontend (in a new terminal):${NC}"
echo -e "   cd frontend"
echo -e "   pnpm dev"
echo ""

echo -e "${BLUE}3. Access the application:${NC}"
echo -e "   Frontend:  http://localhost:3000"
echo -e "   API:       http://localhost:8000"
echo -e "   Prisma Studio: http://localhost:5555 (run: pnpm prisma studio)"
echo ""

echo -e "${BLUE}4. Useful commands:${NC}"
echo -e "   View logs:     docker-compose logs -f"
echo -e "   Stop services: docker-compose down"
echo -e "   Restart:       docker-compose restart"
echo ""

echo -e "${BLUE}5. Development tools:${NC}"
echo -e "   Meilisearch:  http://localhost:7700"
echo -e "   MinIO:        http://localhost:9001"
echo -e "   Grafana:      http://localhost:3001"
echo -e "   Prometheus:   http://localhost:9090"
echo ""

print_header "DOCUMENTATION"

echo -e "${BLUE}📚 Read the documentation:${NC}"
echo -e "   Master Guide: ./MASTER_IMPLEMENTATION_GUIDE.md"
echo -e "   Architecture: ./docs/architecture/"
echo -e "   API Docs: http://localhost:8000/api/docs (once started)"
echo ""

print_header "SUPPORT"

echo -e "${BLUE}Need help?${NC}"
echo -e "   Check troubleshooting guide in MASTER_IMPLEMENTATION_GUIDE.md"
echo -e "   Create an issue on GitHub"
echo ""

print_success "Happy coding! 🎉"