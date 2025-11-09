# Contributing to LogicMonitor MCP Server

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

We expect all contributors to:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js >= 18
- Git
- A LogicMonitor account for testing (optional but recommended)

### Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/logicmonitor-mcp-server.git
   cd logicmonitor-mcp-server
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/monitoringartist/logicmonitor-mcp-server.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Build the project**:
   ```bash
   npm run build
   ```

6. **Run tests**:
   ```bash
   npm test
   ```

## Development Workflow

### Branch Strategy

- `main` - Stable release branch
- `develop` - Development branch (if used)
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Urgent fixes for production

### Creating a Feature Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Development Cycle

1. **Make changes** in your feature branch
2. **Write/update tests** for your changes
3. **Run tests** to ensure everything works:
   ```bash
   npm test
   npm run lint
   npm run build
   ```
4. **Commit your changes** with clear messages:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

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
- `ci`: CI/CD changes

**Examples:**
```
feat(tools): add support for dashboard management
fix(auth): resolve OAuth token refresh issue
docs(readme): update installation instructions
test(e2e): add authentication scenario tests
```

## Coding Standards

### TypeScript Style

- Use **strict TypeScript** with explicit types
- Follow existing code patterns
- Use **2-space indentation**
- Use **single quotes** for strings
- Include **semicolons**
- **PascalCase** for classes and types
- **camelCase** for functions and variables
- **UPPER_CASE** for constants

### Code Organization

- Keep files focused and single-purpose
- Group related functionality
- Use meaningful names
- Comment complex logic
- Export only what's necessary

### Documentation

- Add JSDoc comments for public APIs
- Update README for user-facing changes
- Include inline comments for complex logic
- Provide examples where helpful

## Testing

### Test Types

1. **Unit Tests**: Test individual functions/classes
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete workflows

### Writing Tests

- **Location**: Co-locate tests with source files (`.test.ts` suffix)
- **Naming**: Use descriptive test names
- **Structure**: Use `describe` and `it` blocks
- **Coverage**: Aim for >80% code coverage

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/file.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="pattern"
```

### Test Guidelines

- Test behavior, not implementation
- Use meaningful assertions
- Keep tests isolated and independent
- Mock external dependencies
- Clean up resources in `afterEach`/`afterAll`

## Submitting Changes

### Pull Request Process

1. **Update your branch** with latest upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request** on GitHub:
   - Use the PR template
   - Provide clear description
   - Link related issues
   - Add screenshots if applicable

4. **Address review feedback**:
   - Make requested changes
   - Push additional commits
   - Respond to comments

5. **Squash commits** if requested:
   ```bash
   git rebase -i HEAD~N  # N = number of commits
   git push --force-with-lease
   ```

### PR Requirements

- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG.md updated (for significant changes)
- [ ] No unrelated changes included
- [ ] Commits follow conventional commit format

## Release Process

See [RELEASING.md](RELEASING.md) for detailed release instructions.

### For Maintainers

1. Use GitHub Actions "Version Bump" workflow
2. Review and approve PRs
3. Ensure CI passes before merging
4. Monitor releases for issues

## Issue Guidelines

### Reporting Bugs

Use the bug report template and include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Relevant logs/screenshots

### Requesting Features

Use the feature request template and include:
- Problem you're trying to solve
- Proposed solution
- Use cases
- Alternative solutions considered

## Getting Help

- **Questions**: Open a GitHub issue with the `question` label
- **Discussions**: Use GitHub Discussions for general topics
- **Issues**: Check existing issues before creating new ones

## Recognition

Contributors will be:
- Listed in release notes
- Mentioned in CHANGELOG
- Credited in commits

Thank you for contributing to LogicMonitor MCP Server! 🎉

