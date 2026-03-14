# Contributing to EZ EDGE CMS

First off, thank you for considering contributing to EZ EDGE CMS! It's people like you that make the edge a better place.

## 🛠️ Development Standards

We maintain a high bar for engineering excellence. All contributions must adhere to the following:

1.  **TypeScript Strictness**: The project runs in full `strict` mode. Avoid `any` at all costs. Use explicit return types for all exported functions.
2.  **JSDoc Mandate**: 100% documentation coverage for all exported entities. Include `@description`, `@param`, and `@returns`.
3.  **Schema First**: Any changes to data structures must begin with an update to `src/core/schema.ts`.
4.  **Edge-Native**: Avoid heavy external dependencies. Prefer Web APIs and Bun built-ins.
5.  **Formatting**: Always run `bunx prettier --write .` before submitting.

## 🚀 Getting Started

1.  **Fork the repository** and create your branch from `main`.
2.  **Install dependencies**: `bun install`.
3.  **Run tests**: Ensure everything is passing with `bun test:unit`.
4.  **Local Dev**: Use `bun run dev` to start the Wrangler environment.

## 🧪 Testing Policy

- Every bug fix must include a reproduction test case.
- Every new feature must have 100% unit test coverage.
- We aim for 100% meaningful coverage (no "coverage hacks").

## 📦 Pull Request Process

1.  Ensure your code passes linting and tests.
2.  Update the documentation if you're changing functionality.
3.  Use [Conventional Commits](https://www.conventionalcommits.org/) for your commit messages.
4.  Your PR will be reviewed and merged once it meets all standards.

## ⚖️ Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

_Thank you for building the future of the edge with us!_
