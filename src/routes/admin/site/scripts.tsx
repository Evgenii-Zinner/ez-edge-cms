/** @jsxImportSource hono/jsx */
/**
 * @module SiteScripts
 * @description Client-side scripts for Site Settings interactivity.
 */

import { html } from "hono/html";

/**
 * Component: SiteScripts
 * Injects the client-side logic for Logo previews, OG image resizing,
 * social link management, and system backup/restore orchestration.
 */
export const SiteScripts = () => html`
  <script>
    (function () {
      // Logo Preview Logic
      const input = document.getElementById("logo-svg-input");
      const navPreview = document.getElementById("logo-preview-nav");
      const favPreview = document.getElementById("logo-preview-fav");

      if (input && navPreview && favPreview) {
        input.addEventListener("input", (e) => {
          const svg = e.target.value;
          const encoded = encodeURIComponent(svg);
          const dataUri = "data:image/svg+xml," + encoded;

          navPreview.innerHTML =
            '<img src="' +
            dataUri +
            '" style="width: 32px; height: 32px; object-fit: contain;" />';
          favPreview.innerHTML =
            '<img src="' +
            dataUri +
            '" style="width: 16px; height: 16px; object-fit: contain;" />';
        });
      }

      // OG Image & Facebook Preview Logic
      const ogUpload = document.getElementById("og-image-upload");
      const ogFilename = document.getElementById("og-image-filename");
      const ogBase64 = document.getElementById("inp-site-ogimage-base64");
      const fbImg = document.getElementById("fb-preview-image");
      const fbTitle = document.getElementById("fb-preview-title");
      const fbDesc = document.getElementById("fb-preview-desc");
      const fbUrl = document.getElementById("fb-preview-url");

      const siteTitleInp = document.getElementById("inp-site-title");
      const siteTaglineInp = document.getElementById("inp-site-tagline");
      const siteBaseUrlInp = document.getElementById("inp-site-baseurl");

      if (ogUpload) {
        ogUpload.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (file) {
            if (ogFilename) ogFilename.value = file.name;
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                // Target dimensions for Facebook OG
                const targetWidth = 1200;
                const targetHeight = 630;

                const canvas = document.createElement("canvas");
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext("2d");

                // Calculate "cover" positioning
                const imgRatio = img.width / img.height;
                const targetRatio = targetWidth / targetHeight;
                let drawWidth, drawHeight, drawX, drawY;

                if (imgRatio > targetRatio) {
                  drawHeight = targetHeight;
                  drawWidth = img.width * (targetHeight / img.height);
                  drawX = (targetWidth - drawWidth) / 2;
                  drawY = 0;
                } else {
                  drawWidth = targetWidth;
                  drawHeight = img.height * (targetWidth / img.width);
                  drawX = 0;
                  drawY = (targetHeight - drawHeight) / 2;
                }

                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, targetWidth, targetHeight);
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

                // Export as high-quality WebP or JPEG
                const resizedBase64 = canvas.toDataURL("image/webp", 0.85);
                ogBase64.value = resizedBase64;
                fbImg.innerHTML =
                  '<img src="' +
                  resizedBase64 +
                  '" style="width: 100%; height: 100%; object-fit: cover;" />';
              };
              img.src = event.target.result;
            };
            reader.readAsDataURL(file);
          }
        });
      }

      if (siteTitleInp) {
        siteTitleInp.addEventListener("input", (e) => {
          fbTitle.textContent = e.target.value || "Site Title";
        });
      }

      if (siteTaglineInp) {
        siteTaglineInp.addEventListener("input", (e) => {
          fbDesc.textContent =
            e.target.value || "Site description goes here...";
        });
      }

      if (siteBaseUrlInp) {
        siteBaseUrlInp.addEventListener("input", (e) => {
          try {
            const url = new URL(e.target.value);
            fbUrl.textContent = url.hostname.toUpperCase();
          } catch (err) {
            fbUrl.textContent =
              e.target.value.toUpperCase() || "YOURDOMAIN.COM";
          }
        });
      }
    })();

    /**
     * System Backup & Restore Orchestration
     */
    async function updateProgress(text, percent) {
      const container = document.getElementById("backup-progress-container");
      const textEl = document.getElementById("backup-progress-text");
      const barEl = document.getElementById("backup-progress-bar");

      if (!container || !textEl || !barEl) return;

      container.classList.remove("hidden");
      textEl.innerText = text;
      barEl.style.width = percent + "%";
    }

    async function handleBackup() {
      const btn = document.getElementById("btn-start-backup");
      btn.disabled = true;
      btn.innerText = "PROCESSING...";

      try {
        updateProgress("Generating backup...", 30);
        const res = await fetch("/admin/site/backup");
        if (!res.ok) throw new Error("Backup failed on server");

        updateProgress("Downloading file...", 80);
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        const date = new Date().toISOString().split("T")[0];

        a.href = url;
        a.download = \`ez-edge-backup-\${date}.json\`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        updateProgress("Backup Complete", 100);
        setTimeout(
          () =>
            document
              .getElementById("backup-progress-container")
              .classList.add("hidden"),
          3000,
        );
      } catch (err) {
        alert("Backup failed: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = "START BACKUP";
      }
    }

    async function handleRestore() {
      const fileInput = document.getElementById("restore-upload");
      const file = fileInput.files[0];

      if (!file) {
        alert("Please choose a backup file first.");
        return;
      }

      if (
        !confirm(
          "WARNING: This will overwrite ALL existing data and log you out. Are you sure?",
        )
      ) {
        return;
      }

      const btn = document.getElementById("btn-start-restore");
      btn.disabled = true;
      btn.innerText = "RESTORING...";

      try {
        updateProgress("Uploading and restoring...", 50);
        const formData = new FormData();
        formData.append("backup", file);

        const res = await fetch("/admin/site/restore", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.text();
          throw new Error(errData || "Restore failed");
        }

        updateProgress("Restore Complete. Redirecting...", 100);
        window.location.href = "/admin/login";
      } catch (err) {
        alert("Restore failed: " + err.message);
        btn.disabled = false;
        btn.innerText = "RESTORE NOW";
      }
    }
  </script>
`;
