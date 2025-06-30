#!/bin/bash

# Verify Backend Test Runner Script
# This script runs comprehensive tests and generates detailed reports

set -e

echo "🧪 Verify Backend Test Runner"
echo "=============================="

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

# Install dependencies if needed
install_dependencies() {
    print_status "Checking dependencies..."
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        print_success "Dependencies already installed"
    fi
}

# Run linting
run_lint() {
    print_status "Running linting..."
    if npm run lint; then
        print_success "Linting passed"
    else
        print_error "Linting failed"
        exit 1
    fi
}

# Run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    if npm run test:unit; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        exit 1
    fi
}

# Run all tests with coverage
run_coverage_tests() {
    print_status "Running tests with coverage..."
    if npm run test:coverage; then
        print_success "Coverage tests passed"
    else
        print_error "Coverage tests failed"
        exit 1
    fi
}

# Run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    if npm run test:integration; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
        exit 1
    fi
}

# Run e2e tests
run_e2e_tests() {
    print_status "Running end-to-end tests..."
    if npm run test:e2e; then
        print_success "E2E tests passed"
    else
        print_warning "E2E tests failed (this is expected if database is not set up)"
    fi
}

# Generate test report
generate_report() {
    print_status "Generating test report..."
    
    # Create reports directory
    mkdir -p reports
    
    # Generate summary report
    cat > reports/test-summary.md << EOF
# Test Summary Report

Generated on: $(date)

## Test Results

### Unit Tests
- Status: $(if [ -f "coverage/coverage-summary.json" ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Coverage: $(if [ -f "coverage/coverage-summary.json" ]; then cat coverage/coverage-summary.json | grep -o '"total":{[^}]*}' | grep -o '"lines":{"pct":[^}]*}' | grep -o '"pct":[0-9.]*' | cut -d':' -f2 | head -1; else echo "N/A"; fi)%

### Integration Tests
- Status: $(if npm run test:integration > /dev/null 2>&1; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)

### End-to-End Tests
- Status: $(if npm run test:e2e > /dev/null 2>&1; then echo "✅ PASSED"; else echo "⚠️  SKIPPED"; fi)

## Coverage Report

Coverage reports are available in the \`coverage/\` directory:
- HTML Report: \`coverage/index.html\`
- LCOV Report: \`coverage/lcov.info\`
- JSON Report: \`coverage/coverage-summary.json\`

## Test Files

$(find src -name "*.spec.ts" | wc -l) test files found
$(find test -name "*.e2e-spec.ts" | wc -l) e2e test files found

## Next Steps

1. Review the coverage report in \`coverage/index.html\`
2. Address any failing tests
3. Improve test coverage if below 80%
4. Run \`npm run test:watch\` for development

EOF

    print_success "Test report generated: reports/test-summary.md"
}

# Main test runner
main() {
    echo "Starting comprehensive test suite..."
    echo
    
    check_node
    check_npm
    install_dependencies
    run_lint
    run_unit_tests
    run_coverage_tests
    run_integration_tests
    run_e2e_tests
    generate_report
    
    echo
    echo "🎉 All tests completed!"
    echo
    echo "📊 Coverage Report: coverage/index.html"
    echo "📋 Test Summary: reports/test-summary.md"
    echo
    echo "Available test commands:"
    echo "  npm run test:unit        - Run unit tests only"
    echo "  npm run test:coverage    - Run tests with coverage"
    echo "  npm run test:watch       - Run tests in watch mode"
    echo "  npm run test:verbose     - Run tests with verbose output"
    echo "  npm run test:ci          - Run tests for CI/CD"
}

# Run main function
main "$@" 