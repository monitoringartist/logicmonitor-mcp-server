# Release Process

This document describes the release process for the LogicMonitor MCP Server.

## Overview

The project uses semantic versioning (semver) and automated release workflows via GitHub Actions.

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features, backwards compatible
- **PATCH** (0.0.X): Bug fixes, backwards compatible

## Release Types

### 1. Automated Release (Recommended)

The easiest way to create a release is using the GitHub Actions workflow:

#### Step 1: Version Bump

1. Go to **Actions** tab in GitHub
2. Select **"Version Bump"** workflow
3. Click **"Run workflow"**
4. Select version bump type:
   - `patch` - Bug fixes (0.0.X)
   - `minor` - New features (0.X.0)
   - `major` - Breaking changes (X.0.0)
   - `prepatch/preminor/premajor` - Pre-release versions
5. Click **"Run workflow"**

This will:
- Run all tests
- Update `package.json` version
- Create a git tag
- Push changes to repository
- Trigger the release workflow automatically

#### Step 2: Automatic Release Workflow

When a tag is pushed (e.g., `v1.2.3`), the release workflow automatically:

1. **Runs Tests**: Ensures code quality
2. **Creates GitHub Release**:
   - Generates changelog from commits
   - Creates release artifacts (.tar.gz, .zip)
   - Publishes GitHub release
3. **Publishes to NPM**: (for stable releases)
4. **Builds and Pushes Docker Images**:
   - Multi-architecture (amd64, arm64)
   - Tags: version, major.minor, major, latest
   - Pushes to GitHub Container Registry (ghcr.io)

### 2. Manual Release

If you prefer manual control:

#### Prerequisites

- Write access to the repository
- NPM account with publish rights (for NPM releases)
- Docker Hub account (optional, for Docker Hub)

#### Steps

1. **Update Version**
   ```bash
   npm version patch  # or minor, major
   ```

2. **Update CHANGELOG.md**
   ```markdown
   ## [X.Y.Z] - YYYY-MM-DD
   ### Added
   - New feature description
   ### Changed
   - Changed feature description
   ### Fixed
   - Bug fix description
   ```

3. **Commit and Tag**
   ```bash
   git add CHANGELOG.md
   git commit -m "chore: update changelog for vX.Y.Z"
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   ```

4. **Push Changes**
   ```bash
   git push origin main
   git push origin vX.Y.Z
   ```

The push of the tag will trigger the automated release workflow.

## Pre-Release Versions

For alpha, beta, or release candidate versions:

```bash
npm version prerelease --preid=alpha  # v1.2.3-alpha.0
npm version prerelease --preid=beta   # v1.2.3-beta.0
npm version prerelease --preid=rc     # v1.2.3-rc.0
```

Pre-releases:
- Are marked as "pre-release" on GitHub
- Are NOT published to NPM
- Are NOT tagged as "latest" in Docker

## Release Checklist

Before releasing:

- [ ] All tests pass locally (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] CHANGELOG.md is updated
- [ ] README.md reflects new features (if applicable)
- [ ] Breaking changes are documented
- [ ] Migration guide provided (for major versions)

## Post-Release Tasks

After a release:

1. **Verify Release**:
   - Check GitHub release page
   - Verify NPM package (if published)
   - Test Docker image pull

2. **Announce Release**:
   - Update project README if needed
   - Notify users of breaking changes
   - Update documentation

3. **Monitor**:
   - Watch for issues
   - Check CI/CD status
   - Review download metrics

## Hotfix Process

For urgent bug fixes:

1. Create hotfix branch from tag:
   ```bash
   git checkout -b hotfix/v1.2.4 v1.2.3
   ```

2. Make fixes and test thoroughly

3. Update version:
   ```bash
   npm version patch
   ```

4. Merge to main:
   ```bash
   git checkout main
   git merge hotfix/v1.2.4
   git push origin main
   git push --tags
   ```

## Rollback

If a release has issues:

1. **GitHub Release**: Mark as pre-release or delete
2. **NPM**: Deprecate version
   ```bash
   npm deprecate logicmonitor-mcp-server@X.Y.Z "Version X.Y.Z has issues, please use X.Y.W"
   ```
3. **Docker**: Remove tags (if needed)
4. **Communicate**: Notify users immediately

## GitHub Secrets Required

For automated releases, configure these secrets in GitHub:

- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- `NPM_TOKEN` - NPM publish token (optional, for NPM publishing)
- `DOCKERHUB_USERNAME` - Docker Hub username (optional, for Docker Hub)
- `DOCKERHUB_TOKEN` - Docker Hub access token (optional, for Docker Hub)

### Setting up NPM_TOKEN

1. Login to npmjs.com
2. Go to Access Tokens
3. Generate New Token → Automation
4. Copy token
5. Add to GitHub Secrets as `NPM_TOKEN`

### Setting up Docker Hub (Optional)

1. Login to hub.docker.com
2. Account Settings → Security → New Access Token
3. Copy token
4. Add to GitHub Secrets:
   - `DOCKERHUB_USERNAME` - Your Docker Hub username
   - `DOCKERHUB_TOKEN` - The access token

## CI/CD Pipeline

### Continuous Integration (CI)

Runs on every push and PR:
- Linting
- Tests on Node.js 18, 20, 22
- Build verification
- Docker build test
- Code coverage upload

### Release Pipeline

Triggered by version tags (vX.Y.Z):
- Test suite
- GitHub release creation
- NPM publishing (stable versions only)
- Docker multi-arch build and push

## Versioning Strategy

- **Patch releases** (0.0.X): Weekly or as needed for bug fixes
- **Minor releases** (0.X.0): Monthly or when significant features are ready
- **Major releases** (X.0.0): When breaking changes are necessary
