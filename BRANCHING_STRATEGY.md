# ClinicEase AI - Branching Strategy

This document outlines the branching strategy for the ClinicEase AI project to ensure smooth collaboration among team members.

## Branching Model

We follow a simplified Git branching model based on the Gitflow workflow:

### Main Branches

1. **main** - Production-ready code
   - Always stable and deployable
   - Direct commits are restricted
   - Only accepts merges from `develop` or hotfix branches

2. **develop** - Integration branch for features
   - Contains completed features that are pending release
   - All feature branches merge into this branch
   - Automated tests run on every push

### Supporting Branches

3. **feature/*` - Feature development branches
   - Branch from: `develop`
   - Merge back to: `develop`
   - Naming convention: `feature/short-description` (e.g., `feature/patient-portal`)

4. **release/*` - Release preparation branches
   - Branch from: `develop`
   - Merge back to: `main` and `develop`
   - Naming convention: `release/v1.2.0`

5. **hotfix/*` - Production bug fixes
   - Branch from: `main`
   - Merge back to: `main` and `develop`
   - Naming convention: `hotfix/critical-bug-fix`

## Workflow

### Feature Development

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Work on your feature:
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   git push origin feature/your-feature-name
   ```

3. Create a Pull Request to merge into `develop`
4. After code review and approval, merge the feature branch
5. Delete the feature branch after merging

### Release Process

1. Create a release branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.2.0
   ```

2. Perform final testing and bug fixes
3. Update version numbers in package.json
4. Create a Pull Request to merge into `main`
5. After approval, merge into both `main` and `develop`
6. Create a tag on `main`:
   ```bash
   git tag -a v1.2.0 -m "Release version 1.2.0"
   git push origin v1.2.0
   ```
7. Delete the release branch

### Hotfix Process

1. Create a hotfix branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-bug-fix
   ```

2. Implement the fix
3. Create a Pull Request to merge into `main`
4. After approval, merge into both `main` and `develop`
5. Create a new tag for the hotfix
6. Delete the hotfix branch

## Commit Message Guidelines

Follow conventional commit format:

```
type(scope): brief description

Detailed explanation (optional)

Fixes #123 (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
- `feat(patient): add medical history section`
- `fix(auth): resolve login redirect issue`
- `docs(readme): update deployment instructions`

## Code Review Process

1. All code changes must go through a Pull Request
2. At least one team member must review and approve
3. Automated tests must pass
4. Code style guidelines must be followed
5. Security considerations must be addressed

## Best Practices

1. Keep branches small and focused
2. Commit frequently with descriptive messages
3. Pull latest changes from target branch before merging
4. Delete branches after merging
5. Use meaningful branch names
6. Keep `main` and `develop` branches protected
7. Never commit sensitive information (passwords, keys, etc.)

## Tools and Automation

- GitHub Actions for CI/CD
- Automated testing on each push
- Code quality checks
- Security scanning
- Automated deployment to staging environment

This branching strategy ensures a clean, organized codebase that supports parallel development while maintaining code quality and stability.