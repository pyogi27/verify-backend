# Testing Guide

This document provides comprehensive information about testing the Verify Backend application.

## Overview

The Verify Backend uses Jest as the testing framework with TypeScript support. The test suite includes:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows
- **Coverage Reports**: Detailed code coverage analysis

## Test Structure

```
src/
├── **/*.spec.ts          # Unit tests for each component
├── controllers/
│   ├── *.controller.ts
│   └── *.controller.spec.ts
├── services/
│   ├── *.service.ts
│   └── *.service.spec.ts
├── guards/
│   ├── *.guard.ts
│   └── *.guard.spec.ts
└── utils/
    ├── *.util.ts
    └── *.util.spec.ts

test/
├── setup.ts              # Test environment setup
├── test-config.env       # Test environment variables
├── **/*.e2e-spec.ts      # End-to-end tests
└── jest-e2e.json         # E2E test configuration

coverage/                 # Generated coverage reports
├── index.html           # HTML coverage report
├── lcov.info           # LCOV coverage report
└── coverage-summary.json # JSON coverage summary

reports/                 # Generated test reports
└── test-summary.md      # Test execution summary
```

## Running Tests

### Quick Start

Run all tests with coverage:
```bash
npm run test:coverage
```

### Available Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:verbose` | Run tests with verbose output |
| `npm run test:ci` | Run tests for CI/CD environment |
| `npm run test:integration` | Run integration tests |
| `npm run test:e2e` | Run end-to-end tests |

### Using the Test Runner Script

For comprehensive testing with detailed reports:
```bash
./scripts/run-tests.sh
```

This script will:
1. Check environment requirements
2. Install dependencies if needed
3. Run linting
4. Execute all test types
5. Generate coverage reports
6. Create a test summary

## Test Coverage

### Coverage Thresholds

The project enforces minimum coverage thresholds:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Coverage Reports

After running tests with coverage, you can view reports in:

1. **HTML Report**: `coverage/index.html`
   - Interactive coverage visualization
   - File-by-file breakdown
   - Line-by-line coverage details

2. **LCOV Report**: `coverage/lcov.info`
   - Machine-readable format
   - Compatible with CI/CD tools

3. **JSON Report**: `coverage/coverage-summary.json`
   - Programmatic access to coverage data

### Coverage Exclusions

The following files are excluded from coverage:
- Module files (`*.module.ts`)
- Index files (`index.ts`, `main.ts`)
- DTOs (`*.dto.ts`)
- Entities (`*.entity.ts`)
- Enums (`*.enum.ts`)
- Decorators (`*.decorator.ts`)
- Filters (`*.filter.ts`)
- Guards (`*.guard.ts`)
- Interceptors (`*.interceptor.ts`)
- Middleware (`*.middleware.ts`)
- Utilities (`*.util.ts`)

## Writing Tests

### Unit Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YourService],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = service.methodName(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Testing Guidelines

1. **Arrange-Act-Assert Pattern**: Structure tests with clear sections
2. **Descriptive Test Names**: Use clear, descriptive test names
3. **Mock Dependencies**: Mock external dependencies and database calls
4. **Test Edge Cases**: Include tests for error conditions and edge cases
5. **Isolation**: Each test should be independent and not rely on other tests

### Mocking Examples

#### Repository Mocking
```typescript
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

const module: TestingModule = await Test.createTestingModule({
  providers: [
    YourService,
    {
      provide: getRepositoryToken(YourEntity),
      useValue: mockRepository,
    },
  ],
}).compile();
```

#### Service Mocking
```typescript
const mockService = {
  methodName: jest.fn(),
};

const module: TestingModule = await Test.createTestingModule({
  providers: [
    YourService,
    {
      provide: DependencyService,
      useValue: mockService,
    },
  ],
}).compile();
```

## Test Environment

### Environment Variables

Test-specific environment variables are defined in `test/test-config.env`:
- Separate test database
- Test-specific encryption keys
- Reduced logging verbosity
- Test-specific rate limiting

### Test Setup

The test setup (`test/setup.ts`) configures:
- Test environment variables
- Console mocking for reduced noise
- Increased timeout for integration tests
- Crypto mocking for consistent results

## Continuous Integration

### CI/CD Configuration

For CI/CD environments, use:
```bash
npm run test:ci
```

This command:
- Runs tests in CI mode
- Generates coverage reports
- Exits with error code on test failure
- Optimized for automated environments

### Coverage Badges

You can add coverage badges to your README:
```markdown
![Test Coverage](https://img.shields.io/badge/coverage-85%25-green)
```

## Troubleshooting

### Common Issues

1. **Test Timeout**: Increase timeout in `jest.config.js`
2. **Database Connection**: Ensure test database is available
3. **Environment Variables**: Check `test/test-config.env` is loaded
4. **Mock Issues**: Verify mocks are properly configured

### Debugging Tests

For debugging specific tests:
```bash
npm run test:debug
```

This runs tests with Node.js debugger enabled.

### Verbose Output

For detailed test output:
```bash
npm run test:verbose
```

## Best Practices

1. **Test Coverage**: Aim for 80%+ coverage on business logic
2. **Test Isolation**: Each test should be independent
3. **Meaningful Assertions**: Test behavior, not implementation
4. **Fast Tests**: Keep tests fast for quick feedback
5. **Clear Test Names**: Use descriptive test names
6. **Mock External Dependencies**: Don't test external services
7. **Test Error Cases**: Include tests for error conditions

## Performance Testing

For performance testing, consider:
- Load testing with tools like Artillery or k6
- Memory leak detection
- Database query performance
- API response time testing

## Security Testing

Security testing should include:
- Input validation testing
- Authentication testing
- Authorization testing
- SQL injection testing
- XSS testing

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [TypeScript Testing](https://www.typescriptlang.org/docs/handbook/testing.html) 