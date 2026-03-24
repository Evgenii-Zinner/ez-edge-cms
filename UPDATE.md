# ⚡ Updating EZ EDGE CMS

To ensure you have the latest features, security patches, and performance improvements, it is important to keep your EZ EDGE CMS installation up to date.

Depending on how you deployed the CMS, follow the appropriate guide below.

---

## 🍴 Method 1: GitHub Fork (Recommended)

If you followed the recommended "Fork & Sync" deployment method, updating is easy and preserves your content.

1.  **Sync your Fork:**
    - Navigate to your forked repository on GitHub.
    - Click **Sync fork** (usually near the "Code" button).
    - Click **Update branch**.
2.  **Automatic Deployment:**
    - If you connected your GitHub repository to Cloudflare Pages/Workers, the update will automatically trigger a new deployment.
    - Wait a few minutes for the build to complete.
3.  **Verify:**
    - Log into your Admin Dashboard.
    - Check the **System Status** to confirm the version has updated.

---

## 💻 Method 2: CLI / Local Setup

If you cloned the repository locally and deploy via Wrangler:

1.  **Fetch Latest Changes:**
    ```bash
    git pull upstream main
    # Or if you didn't set an upstream:
    git pull https://github.com/Evgenii-Zinner/ez-edge-cms.git main
    ```
2.  **Update Dependencies:**
    ```bash
    bun install
    ```
3.  **Deploy:**
    ```bash
    bun run deploy
    ```

---

## 🚀 Method 3: Manual Update

If you used the "Deploy to Cloudflare" button without forking:

1.  The easiest way to update is to **Fork** the repository now and switch your Cloudflare deployment to point to your new fork. This ensures future updates are just a "Sync fork" click away.
2.  Alternatively, you can manually re-deploy using the "Deploy to Cloudflare" button, but note that this might overwrite some environment configurations (though your KV data should remain safe if you use the same namespace).

---

## ⚠️ Important Considerations

- **Custom Code:** If you have made manual changes to the core `src/` directory (outside of configurations), a sync might cause merge conflicts. You will need to resolve these manually.
- **KV Data:** Updating the CMS logic **does not** delete your KV data (pages, themes, etc.). Your content remains safe during the update process.
- **Breaking Changes:** Always check the [Releases](https://github.com/Evgenii-Zinner/ez-edge-cms/releases) page for any noted breaking changes or manual migration steps.
