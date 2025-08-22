# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated testing and CI/CD.

## Workflows

### 1. `test.yml` - Basic Test Workflow
- **Purpose**: Run tests on every commit and pull request
- **Triggers**: Push to main/develop, Pull requests
- **Features**:
  - Multi-Python version testing (3.9, 3.10, 3.11)
  - Dependency caching for faster builds
  - Setup script validation
  - Verbose test output

### 2. `ci.yml` - Comprehensive CI/CD Pipeline
- **Purpose**: Full CI/CD pipeline with linting and security checks
- **Triggers**: Push to main/develop, Pull requests
- **Features**:
  - **Linting**: flake8, black, isort code formatting checks
  - **Testing**: Multi-Python version testing
  - **Security**: bandit and safety vulnerability scanning
  - **Job Dependencies**: Sequential execution (lint → test → security)

## Workflow Structure

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Lint     │───▶│    Test     │───▶│  Security   │
│             │    │             │    │             │
│ • flake8    │    │ • Python    │    │ • bandit    │
│ • black     │    │ • 3.9,3.10, │    │ • safety    │
│ • isort     │    │ • 3.11      │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Usage

### For Contributors
1. Push your changes to a feature branch
2. Create a pull request
3. GitHub Actions will automatically run all checks
4. Ensure all checks pass before merging

### For Maintainers
- Monitor workflow runs in the Actions tab
- Review security scan results
- Ensure code quality standards are met

## Configuration

### Python Versions
- Tested against: Python 3.9, 3.10, 3.11
- Linting uses: Python 3.11
- Security uses: Python 3.11

### Caching
- pip dependencies are cached for faster builds
- Cache key includes Python version and requirements.txt hash

### Dependencies
- All dependencies installed from `server/requirements.txt`
- Additional tools installed as needed (flake8, black, etc.)

## Status Badge

The README includes a status badge that shows the current build status:
```markdown
[![Tests](https://github.com/nee1k/prompt-engineering-test-harness/workflows/Run%20Tests/badge.svg)](https://github.com/nee1k/prompt-engineering-test-harness/actions)
```

## Troubleshooting

### Common Issues
1. **Dependency conflicts**: Check requirements.txt for version conflicts
2. **Linting failures**: Run `black .` and `isort .` locally to fix formatting
3. **Security warnings**: Review bandit and safety output for vulnerabilities

### Local Testing
```bash
# Test the same environment locally
cd server
source venv/bin/activate
pip install flake8 black isort bandit safety
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
black --check .
isort --check-only .
bandit -r . -f json -o bandit-report.json
safety check
```
