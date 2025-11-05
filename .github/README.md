# GitHub Configuration

This directory contains GitHub-specific configuration files for the LogicMonitor MCP Server project.

## Structure

```
.github/
├── workflows/              # GitHub Actions workflows
│   ├── ci.yml             # Continuous Integration
│   ├── release.yml        # Release automation
│   ├── version-bump.yml   # Version bumping workflow
│   ├── docker.yml         # Docker build and push
│   ├── codeql.yml         # Security scanning
│   └── dependabot-auto-merge.yml  # Auto-merge dependencies
├── ISSUE_TEMPLATE/        # Issue templates
│   ├── bug_report.md      # Bug report template
│   └── feature_request.md # Feature request template
├── PULL_REQUEST_TEMPLATE.md  # PR template
├── dependabot.yml         # Dependabot configuration
└── README.md             # This file
```

## Workflows

### CI (ci.yml)
**Triggers**: Push to main/develop, PRs
**Purpose**: Continuous integration testing
**Actions**:
- Linting
- Tests on Node.js 18, 20, 22
- Build verification
- Docker build test
- Code coverage upload

### Release (release.yml)
**Triggers**: Version tags (v*.*.*)
**Purpose**: Automated releases
**Actions**:
- Run full test suite
- Create GitHub release with changelog
- Generate release archives (.tar.gz, .zip)
- Publish to NPM (stable releases only)

### Version Bump (version-bump.yml)
**Triggers**: Manual workflow dispatch
**Purpose**: Simplified version bumping
**Actions**:
- Run tests
- Bump package.json version
- Create and push git tag
- Trigger release workflow

### Docker (docker.yml)
**Triggers**: Push to main, tags, PRs
**Purpose**: Docker image building and publishing
**Actions**:
- Build multi-arch images (amd64, arm64)
- Push to GitHub Container Registry
- Tag with version, major.minor, major, latest

### CodeQL (codeql.yml)
**Triggers**: Push, PRs, weekly schedule
**Purpose**: Security scanning
**Actions**:
- Static code analysis
- Security vulnerability detection
- Quality checks

### Dependabot Auto-merge (dependabot-auto-merge.yml)
**Triggers**: Dependabot PRs
**Purpose**: Automatic dependency updates
**Actions**:
- Auto-merge patch and minor updates
- Requires tests to pass

## Issue Templates

### Bug Report
Template for reporting bugs with structured format including:
- Description
- Reproduction steps
- Expected vs actual behavior
- Environment details
- Logs

### Feature Request
Template for requesting new features including:
- Feature description
- Problem statement
- Proposed solution
- Use cases
- Priority

## Pull Request Template

Standardized PR template including:
- Description
- Type of change
- Testing details
- Checklist
- Related issues

## Dependabot

Automatic dependency updates:
- **NPM packages**: Weekly on Mondays
- **GitHub Actions**: Weekly on Mondays
- **Major updates**: Ignored (manual review)
- **Auto-merge**: Enabled for patch/minor updates

## Required Secrets

Configure in **Settings → Secrets and variables → Actions**:

| Secret | Required | Purpose |
|--------|----------|---------|
| `GITHUB_TOKEN` | ✅ Auto-provided | GitHub operations |
| `NPM_TOKEN` | ⚠️ Optional | NPM publishing |
| `DOCKERHUB_USERNAME` | ℹ️ Optional | Docker Hub |
| `DOCKERHUB_TOKEN` | ℹ️ Optional | Docker Hub |

## Permissions

Workflows require these permissions:
- `contents: write` - For creating releases and tags
- `packages: write` - For publishing Docker images
- `pull-requests: write` - For auto-merging PRs
- `security-events: write` - For CodeQL scanning

## Usage

### Creating a Release
1. Go to **Actions → Version Bump**
2. Click **Run workflow**
3. Select version type (patch/minor/major)
4. Workflow handles the rest automatically

### Monitoring
- Check **Actions** tab for workflow status
- Review **Security** tab for CodeQL results
- Monitor **Pull requests** for Dependabot updates

## Maintenance

### Updating Workflows
1. Edit workflow files
2. Test in feature branch
3. Create PR to main
4. Review workflow runs

### Adding New Workflows
1. Create `.yml` file in `workflows/`
2. Define triggers and jobs
3. Test thoroughly
4. Document in this README

## Documentation

- [RELEASING.md](../RELEASING.md) - Release process
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [RELEASE-PROCESS-SUMMARY.md](../RELEASE-PROCESS-SUMMARY.md) - Quick reference

## Questions?

Open an issue or check existing documentation.

