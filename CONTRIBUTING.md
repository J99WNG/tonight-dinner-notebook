# Contributing

## Branches

This repository uses a lightweight release workflow:

1. Start work from the latest `develop` branch.
2. Create a short-lived branch named `feature/<topic>`, `fix/<topic>`, or `chore/<topic>`.
3. Keep commits focused and use imperative messages, for example `Add booking table assignment`.
4. Open a pull request into `develop` and complete the pull request template.
5. Merge only after CI passes and review feedback is resolved.
6. Promote a tested release with a pull request from `develop` into `main`.
7. Deploy the Sites project only from a verified `main` commit.

Avoid committing directly to `main` or `develop`. Delete short-lived branches after merge.

## Local checks

Use Node.js 22.13 or newer.

```sh
npm ci
npm run typecheck
npm run lint
npm run build
```

Visual acceptance is completed separately by the product owner.

## Pull requests

- Explain the user-facing outcome and any trade-offs.
- Include manual testing notes and accessibility considerations.
- Keep generated build output and environment files out of commits.
- Do not include Sites credentials, tokens, personal data, or production customer data.
