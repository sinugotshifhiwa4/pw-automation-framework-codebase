# Playwright (PW) Automation Framework Codebase

## Overview

The **Playwright Automation Framework** is a **TypeScript-based**, production-ready testing solution designed to support scalable UI, API, and end-to-end automation across applications.

It provides a clean and maintainable structure using the **Page Object Model**, along with reusable utilities, custom fixtures, and CI/CD integration. The framework ensures reliable execution, streamlined test development, and long-term extensibility for enterprise-grade automation needs.

---

## Setup & Getting Started

Ensure **Node.js** is installed, then install dependencies:

```bash
npm install
```

---

## Configurations

### Environment Variables

The framework uses environment-specific configurations stored under `envs/`. These files are **excluded from version control** for security.

**Setup Steps:**

1. Open `.env.template`.
2. Copy it to create an environment-specific file:

   ```bash
   cp .env.template .env.<env>
   ```

   Example: `.env.qa`, `.env.dev`, `.env.uat`, `.env.preprod`

3. Fill in credentials and URLs specific to the environment.

**Example `.env.qa`:**

```env
PORTAL_BASE_URL=portal.url
PORTAL_USERNAME=portal.username
PORTAL_PASSWORD=portal.password
```

> Supported environments: `dev`, `qa`, `uat`, `preprod`

---

### Encryption of Sensitive Credentials

The framework uses **AES-GCM encryption** with **Argon2** key derivation to secure sensitive credentials.

**Important:** Before running encryption, ensure you have created the appropriate `.env.<env>` file from the template.

**Encrypt Credentials for a Specific Environment:**

```bash
npx cross-env SKIP_BROWSER_INIT=true PLAYWRIGHT_GREP=@encryption-flow ENV=<env> npm run test:encryption
```

- Replace `<env>` with your target environment: `dev`, `qa`, `uat`, `preprod`.
- This will encrypt credentials in the chosen environment file, making them safe for use in tests.

**Example:**

```bash
npx cross-env SKIP_BROWSER_INIT=true PLAYWRIGHT_GREP=@encryption-flow ENV=qa npm run test:encryption
```

> After encryption, the environment file is ready for secure test execution.

---
