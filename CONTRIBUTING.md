# Contributing to PCAP Analysis System

Thank you for your interest in contributing! This guide covers everything you need to know to contribute effectively to the project.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Coding Standards](#coding-standards)
- [License Agreement](#license-agreement)

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/pcap_analysis_system.git
   cd pcap_analysis_system
   ```
3. Add the upstream remote so you can pull future updates:
   ```bash
   git remote add upstream https://github.com/MohitPal0212/pcap_analysis_system.git
   ```

---

## Development Setup

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # macOS/Linux
# or: venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Docker (full stack)
```bash
docker compose build
docker compose up
```

---

## Branching Strategy

| Branch type | Naming convention | Example |
|---|---|---|
| Bug fix | `fix/<short-description>` | `fix/arp-spoof-false-positive` |
| New feature | `feat/<short-description>` | `feat/tls-ja4-fingerprinting` |
| Documentation | `docs/<short-description>` | `docs/contributing-guide` |
| Refactor | `refactor/<short-description>` | `refactor/forensic-scorer` |
| Hotfix | `hotfix/<short-description>` | `hotfix/upload-crash` |

Always branch off `main`:
```bash
git checkout main
git pull upstream main
git checkout -b feat/your-feature-name
```

---

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) spec:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(forensic-scorer): add JA4 fingerprint signal weight
fix(upload): resolve chunked upload timeout on large files
docs(readme): update hardware requirements section
```

- Keep the summary line under **72 characters**.
- Use the **imperative mood** ("add", not "added" or "adds").
- Reference GitHub issues in the footer: `Closes #42`

---

## Pull Request Process

1. Ensure your branch is up to date with `main` before opening a PR:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. Open a Pull Request against the `main` branch.
3. Fill in the PR template completely — incomplete PRs may be closed without review.
4. Ensure the following before requesting review:
   - [ ] Code follows existing style conventions
   - [ ] No debug `print()` statements or commented-out code left in
   - [ ] All new backend endpoints are documented in the README API Reference
   - [ ] Frontend components are placed in `frontend/src/components/` with correct license headers
   - [ ] License header is present on every new source file (see existing files for the format)
5. At least **one maintainer approval** is required before merging.
6. Squash commits where appropriate before merge.

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/MohitPal0212/pcap_analysis_system/issues/new) using the **Bug Report** template and include:

- **Title:** A clear, concise description of the bug.
- **Environment:** OS, Python version, Node version, Docker version.
- **Steps to reproduce:** Numbered, minimal steps.
- **Expected behavior:** What should happen.
- **Actual behavior:** What actually happens (include stack traces/logs).
- **PCAP sample:** If applicable and safe to share (anonymize sensitive data).

> **Security vulnerabilities must NOT be reported via public issues.** See [SECURITY.md](SECURITY.md).

---

## Suggesting Features

Open a [GitHub Issue](https://github.com/MohitPal0212/pcap_analysis_system/issues/new) using the **Feature Request** template with the `enhancement` label:

- **Problem statement:** What problem does this solve?
- **Proposed solution:** Your preferred approach.
- **Alternatives considered:** Other approaches you evaluated.
- **Scope:** Backend, Frontend, IDS, Forensic Scoring, Reporting, Other.

---

## Coding Standards

### Python (Backend)
- Follow [PEP 8](https://peps.python.org/pep-0008/).
- Use type hints on all public function signatures.
- Docstrings on all modules, classes, and public functions.
- Keep individual functions focused and under ~60 lines where possible.
- Place new analysis modules in `backend/core/`.

### JavaScript (Frontend)
- Functional components with React Hooks only — no class components.
- One component per file; filename matches the component name (e.g., `ForensicScoreCard.js`).
- Use `const` over `let`; avoid `var`.
- Keep prop drilling minimal — lift state to the nearest common ancestor.

### General
- **No hardcoded secrets or API keys** — always use `.env` files (excluded from git).
- All new source files must carry the project license header (see existing files).
- Run `tshark`/`scapy` operations only within dedicated core modules, never directly in `main.py` endpoints.

---

## License Agreement

By submitting a contribution, you agree that your work will be licensed under the **Apache License 2.0** that covers this project. You confirm that you have the right to submit the contribution under that license.

See [LICENSE](LICENSE) for full terms.

---

For any questions about contributing, reach out at **mp65742@gmail.com**.
