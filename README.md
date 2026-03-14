# ⚡ EZ EDGE CMS

**EZ EDGE CMS** is a high-performance, edge-native Content Management System and Design System built specifically for the Cloudflare global network. It leverages Cloudflare Workers and KV storage to deliver sub-50ms response times with zero cold starts and truly zero build steps.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Evgenii-Zinner/ez-edge-cms)

---

## 🌟 Key Philosophy

Most modern CMS platforms force a trade-off between the security risks of traditional servers or the slow build pipelines of static site generators. EZ EDGE CMS is built on a different philosophy: **The Edge is the Database.**

- **Truly Zero Build**: Content updates are pushed to the global edge instantly. No 2-minute CI/CD pipelines for a typo fix.
- **Isolate-Level Speed**: Optimized with in-memory caching and native Web APIs to ensure peak performance on every request.
- **Zero-Config Branding**: A programmatic HSL-based design system that allows complete visual identity shifts by changing a single hue value.

---

## 🛠️ Technology Stack

EZ EDGE CMS is built using a curated stack of lightweight, platform-native tools:

- **[Hono](https://hono.dev/)**: The ultra-fast web framework for the edge.
- **[Cloudflare KV](https://www.cloudflare.com/products/workers-kv/)**: Global key-value storage for content and configuration.
- **[UnoCSS](https://unocss.dev/)**: Reactive, on-demand atomic CSS engine with isolate-level caching.
- **[HTMX](https://htmx.org/)**: Powering a snappy, SPA-like Administrative HUD without the JavaScript bloat.
- **[Editor.js](https://editorjs.io/)**: A clean, block-based writing experience for semantic content.
- **[Bun](https://bun.sh/)**: Modern tooling for development and orchestration.

---

## ✨ Features

- **Blazing Performance**: SSR (Server-Side Rendering) at the edge.
- **Secure by Design**: Native WebCrypto salt-based hashing and session management. No external auth providers required.
- **Strict Validation**: Every data point is validated via **Zod** before reaching persistent storage.
- **Global Data Portability**: Built-in JSON backup and restore system for entire site configurations and content.
- **Bento-Grid Layouts**: Modern, responsive UI components designed for a futuristic aesthetic.
- **Text File Manager**: Native support for managing root-level files like `robots.txt`, `ads.txt`, and `llms.txt`.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Evgenii-Zinner/ez-edge-cms.git
cd ez-edge-cms
bun install
```

### 2. Local Development

Start the local development server (uses Wrangler to simulate the Cloudflare environment):

```bash
bun run dev
```

### 3. Deploy

Push your CMS to the Cloudflare global network:

```bash
bun run deploy
```

---

## 🤝 Community

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a pull request.

---

## ⚖️ License

Licensed under the **MIT License**. Feel free to use it for personal or commercial projects.

_Created with 🔥 by [Evgenii Zinner](https://ezinner.com)._
