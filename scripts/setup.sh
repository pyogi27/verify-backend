#!/bin/bash

# Verify Backend Setup Script
# This script sets up the development environment with security best practices

set -e

echo "🔐 Verify Backend Setup Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    print_success "npm $(npm --version) is installed"
}

# Check if PostgreSQL is installed
check_postgres() {
    print_status "Checking PostgreSQL installation..."
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL is not installed. Please install PostgreSQL."
        print_warning "You can install it from: https://www.postgresql.org/download/"
        read -p "Do you want to continue without PostgreSQL? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "PostgreSQL is installed"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing npm dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    if [ -f ".env" ]; then
        print_warning ".env file already exists. Backing up to .env.backup"
        cp .env .env.backup
    fi
    
    # Generate secure encryption key
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    JWT_SECRET=$(openssl rand -hex 64)
    
    cat > .env << EOF
# Application Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
RATE_LIMIT_WHITELIST=127.0.0.1,::1

# Security
BCRYPT_ROUNDS=12
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=1h
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=verify_db
DB_RETRY_ATTEMPTS=3
DB_RETRY_DELAY=3000
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# Logging
LOG_LEVEL=info
LOG_MAX_FILES=14d
LOG_MAX_SIZE=20m
EOF

    print_success "Environment file created with secure keys"
    print_warning "Please update the database password in .env file"
}

# Create logs directory
create_logs_directory() {
    print_status "Creating logs directory..."
    mkdir -p logs
    print_success "Logs directory created"
}

# Set up database
setup_database() {
    print_status "Setting up database..."
    
    if command -v psql &> /dev/null; then
        print_status "Creating database..."
        psql -U postgres -c "CREATE DATABASE verify_db;" 2>/dev/null || print_warning "Database might already exist or connection failed"
        print_success "Database setup completed"
    else
        print_warning "PostgreSQL not available. Please set up the database manually."
    fi
}

# Security audit
security_audit() {
    print_status "Running security audit..."
    npm audit
    
    if [ $? -eq 0 ]; then
        print_success "Security audit completed"
    else
        print_warning "Security vulnerabilities found. Run 'npm audit fix' to fix them."
    fi
}

# Create git hooks
setup_git_hooks() {
    print_status "Setting up Git hooks..."
    
    if [ -d ".git" ]; then
        mkdir -p .git/hooks
        
        # Pre-commit hook
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."

# Run linting
npm run lint
if [ $? -ne 0 ]; then
    echo "Linting failed. Please fix the issues before committing."
    exit 1
fi

# Run tests
npm run test:unit
if [ $? -ne 0 ]; then
    echo "Tests failed. Please fix the issues before committing."
    exit 1
fi

echo "Pre-commit checks passed!"
EOF

        chmod +x .git/hooks/pre-commit
        print_success "Git hooks configured"
    else
        print_warning "Not a Git repository. Skipping Git hooks setup."
    fi
}

# Main setup function
main() {
    echo "Starting setup process..."
    echo
    
    check_node
    check_npm
    check_postgres
    install_dependencies
    create_env_file
    create_logs_directory
    setup_database
    security_audit
    setup_git_hooks
    
    echo
    echo "🎉 Setup completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Update the database password in .env file"
    echo "2. Start the development server: npm run start:dev"
    echo "3. Access the API documentation: http://localhost:3000/api-docs"
    echo "4. Review SECURITY.md for security best practices"
    echo
    echo "For production deployment, please review:"
    echo "- Environment variables configuration"
    echo "- Database security settings"
    echo "- SSL/TLS configuration"
    echo "- Firewall rules"
    echo "- Monitoring and logging setup"
}

# Run main function
main "$@" 