# Contributing to LogicMonitor MCP Server

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- Git
- LogicMonitor account (for testing)

### First Time Setup

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/logicmonitor-mcp-server.git
   cd logicmonitor-mcp-server
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/logicmonitor/logicmonitor-mcp-server.git
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Create .env file:**
   ```bash
   cp env.example .env
   # Edit .env with your LogicMonitor credentials
   ```

6. **Build the project:**
   ```bash
   npm run build
   ```

7. **Run tests:**
   ```bash
   npm test
   ```

## Development Setup

### Environment Configuration

Required environment variables (see `env.example` for complete list):

```bash
# LogicMonitor API
LM_COMPANY=your-company
LM_BEARER_TOKEN=your-token

# MCP Configuration
MCP_READ_ONLY=true
MCP_LOG_FORMAT=human
MCP_LOG_LEVEL=info
```

### Development Commands

```bash
# Build TypeScript
npm run build

# Watch mode (auto-rebuild on changes)
npm run dev

# Run linter
npm run lint

# Run tests
npm test

# Start STDIO server
npm start

# Start HTTP server with OAuth
npm run start:http

# Start multi-transport server
npm run start:multi

# MCP Inspector (for testing)
npm run inspect
```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical fixes for production
- `docs/*` - Documentation updates

### Creating a Feature Branch

```bash
# Sync with upstream
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/my-new-feature

# Make your changes
# ...

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to your fork
git push origin feature/my-new-feature
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```bash
feat(oauth): add Google OAuth provider support
fix(tools): correct device filtering logic
docs(readme): update installation instructions
refactor(handlers): simplify error handling
test(client): add unit tests for rate limiter
chore(deps): update dependencies
```

## Coding Standards

### TypeScript Style

- **Type Safety**: Use strict TypeScript types, avoid `any` when possible
- **Naming Conventions:**
  - PascalCase for classes and types
  - camelCase for functions and variables
  - UPPER_CASE for constants
  - Prefix interfaces with `I` only when needed for clarity

- **File Naming:**
  - Lowercase with hyphens: `rate-limiter.ts`
  - Test files: `rate-limiter.test.ts`

- **Imports:**
  - Use ES modules
  - Include `.js` extension
  - Group imports: external, internal, relative

### Code Organization

```
src/
├── api/              # API client and handlers
│   ├── client.ts     # LogicMonitor API client
│   ├── handlers.ts   # MCP tool handlers
│   └── tools.ts      # MCP tool definitions
├── servers/          # Server implementations
│   ├── stdio-server.ts
│   ├── http-server.ts
│   └── multi-transport-server.ts
└── utils/
    ├── core/         # Core utilities
    │   ├── cli-config.ts
    │   ├── oauth-strategy.ts
    │   ├── rate-limiter.ts
    │   └── token-refresh.ts
    └── helpers/      # Helper utilities
        ├── batch-processor.ts
        └── filters.ts
```

### Documentation

- **JSDoc comments** for all public APIs
- **Inline comments** for complex logic
- **README updates** for new features
- **Type definitions** should be self-documenting

Example:
```typescript
/**
 * Fetches device data from LogicMonitor API
 * 
 * @param deviceId - The LogicMonitor device ID
 * @param fields - Optional fields to include in response
 * @returns Device data object
 * @throws {LogicMonitorApiError} If API request fails
 */
async function getDevice(deviceId: number, fields?: string[]): Promise<Device> {
  // Implementation
}
```

## Testing

### Test Structure

- Tests should be co-located with source files: `file.test.ts`
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

### Writing Tests

```typescript
import { describe, it, expect } from '@jest/globals';

describe('RateLimiter', () => {
  it('should delay requests when rate limit is hit', async () => {
    // Arrange
    const limiter = new RateLimiter({ requestsPerSecond: 2 });
    
    // Act
    const start = Date.now();
    await limiter.schedule(() => Promise.resolve());
    await limiter.schedule(() => Promise.resolve());
    await limiter.schedule(() => Promise.resolve());
    const duration = Date.now() - start;
    
    // Assert
    expect(duration).toBeGreaterThan(500);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx jest path/to/file.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage

- Aim for 80% code coverage
- Critical paths should have 100% coverage
- Edge cases should be tested

## Submitting Changes

### Before Submitting

1. **Ensure tests pass:**
   ```bash
   npm test
   ```

2. **Run linter:**
   ```bash
   npm run lint
   ```

3. **Build successfully:**
   ```bash
   npm run build
   ```

4. **Update documentation** if needed

5. **Add/update tests** for new features

### Pull Request Process

1. **Create Pull Request** from your fork to `main`

2. **Fill out PR template** completely

3. **Link related issues** using keywords (Fixes #123)

4. **Request review** from maintainers

5. **Address review comments**

6. **Wait for CI checks** to pass

7. **Squash and merge** once approved

### PR Review Criteria

- [ ] Code follows project style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or clearly documented)
- [ ] CI checks pass
- [ ] Code is reviewed by at least one maintainer

## Release Process

Releases are automated through GitHub Actions:

1. **Version Bump:**
   ```bash
   npm version patch|minor|major
   ```

2. **Push Tag:**
   ```bash
   git push origin main --tags
   ```

3. **GitHub Actions:**
   - Runs CI checks
   - Builds artifacts
   - Creates GitHub release
   - Publishes to npm (if configured)

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **GitHub Discussions**: Ask questions and share ideas
- **Documentation**: Check README.md and code comments
- **Email**: Contact project maintainers

## Recognition

Contributors are recognized in:
- GitHub Contributors page
- Release notes
- Project README (for significant contributions)

Thank you for contributing! 🎉

