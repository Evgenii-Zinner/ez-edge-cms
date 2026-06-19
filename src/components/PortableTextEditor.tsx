/** @jsxImportSource hono/jsx */
/**
 * @module PortableTextEditor
 * @description Native HTML5 contenteditable editor that produces PortableText JSON.
 */

import type { FC } from "hono/jsx";
import { html } from "hono/html";
import type { PortableTextBlock } from "@utils/portabletext-parser";

export interface PortableTextEditorProps {
  content?: PortableTextBlock[];
}

export const PortableTextEditor: FC<PortableTextEditorProps> = ({
  content,
}) => {
  const contentJson = JSON.stringify(content || []).replace(/</g, "\\u003c");

  return (
    <div class="portabletext-editor-wrapper relative">
      <input
        type="hidden"
        name="content"
        id="portabletext-content-input"
        value={contentJson}
      />

      <ez-portable-text
        id="portable-text-editor"
        class="admin-card p-4 min-h-[500px] bg-[rgba(0,0,0,0.3)] border-solid block"
      ></ez-portable-text>

      {/* Dynamic Cyberpunk Block Edit Modal */}
      <div
        id="block-edit-modal"
        class="fixed inset-0 bg-[rgba(0,0,0,0.85)] items-center justify-center hidden z-[4000] transition-all duration-300 backdrop-blur-md"
      >
        <div class="admin-card w-full max-w-lg p-6 bg-[var(--theme-surface)] border border-solid border-[var(--theme-accent)] shadow-[0_0_35px_var(--theme-accent-glow)] relative">
          <div class="flex justify-between items-center mb-6 border-b border-solid border-[var(--theme-accent-glow)] pb-3">
            <h3
              id="modal-block-title"
              class="text-1.2rem font-header text-[var(--theme-accent)] m-0 uppercase tracking-2px"
            >
              Edit Block
            </h3>
            <button
              type="button"
              id="close-block-modal"
              class="bg-transparent border-0 text-[var(--theme-text-dim)] hover:text-white cursor-pointer font-header text-1.2rem outline-none"
            >
              ✕
            </button>
          </div>

          <div
            id="modal-block-fields"
            class="space-y-4 max-h-[60vh] overflow-y-auto pr-2"
          >
            {/* Populated dynamically */}
          </div>

          <div class="flex justify-end gap-4 mt-6 border-t border-solid border-[var(--theme-accent-glow)] pt-4">
            <button type="button" id="cancel-block-edit" class="btn-secondary">
              CANCEL
            </button>
            <button type="button" id="save-block-edit" class="btn-primary">
              APPLY CHANGES
            </button>
          </div>
        </div>
      </div>

      {html`
        <script>
          (function () {
            const initPortableText = () => {
              const editor = document.getElementById("portable-text-editor");
              const input = document.getElementById(
                "portabletext-content-input",
              );

              if (!editor || !input) return;

              // Prevent double initialization
              if (window.currentPortableTextEditor) return;

              // Prevent any buttons inside the editor from submitting the parent form
              editor.addEventListener("click", (e) => {
                const button = e.target.closest("button");
                if (button) {
                  e.preventDefault();
                }
              });

              // Stop 'Enter' from submitting the parent form while editing blocks
              editor.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                }
              });

              // Set initial value
              try {
                if (input.value) {
                  editor.value = JSON.parse(input.value);
                }
              } catch (e) {
                console.error("Failed to parse initial PortableText", e);
              }

              // Register custom blocks
              editor.registerBlockType({
                name: "hero",
                title: "Hero",
                icon: "⚡",
                defaultValue: {
                  imageUrl: "",
                  title: "",
                  subtitle: "",
                },
              });

              let isInitialized = false;

              // Sync changes back to hidden input
              editor.addEventListener("change", (e) => {
                if (!isInitialized) return;
                input.value = JSON.stringify(e.detail.value);
                window.adminHasChanges = true;
              });

              setTimeout(() => {
                isInitialized = true;
              }, 100);

              // Modal components
              const modal = document.getElementById("block-edit-modal");
              const modalTitle = document.getElementById("modal-block-title");
              const modalFields = document.getElementById("modal-block-fields");
              const closeBtn = document.getElementById("close-block-modal");
              const cancelBtn = document.getElementById("cancel-block-edit");
              const saveBtn = document.getElementById("save-block-edit");

              let currentEditCallback = null;

              const closeModal = () => {
                modal.classList.add("hidden");
                modal.classList.remove("flex");
                currentEditCallback = null;
              };

              closeBtn.onclick = closeModal;
              cancelBtn.onclick = closeModal;

              // Image resizing helper
              const resizeImage = (file, maxWidth, quality = 0.8) => {
                return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                      const canvas = document.createElement("canvas");
                      let width = img.width;
                      let height = img.height;

                      if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                      }

                      canvas.width = width;
                      canvas.height = height;
                      const ctx = canvas.getContext("2d");
                      ctx.drawImage(img, 0, 0, width, height);
                      resolve(canvas.toDataURL("image/webp", quality));
                    };
                  };
                });
              };

              // Listen for block edits
              editor.addEventListener("edit-block", (e) => {
                const { value, update } = e.detail;
                const blockType = value._type;

                modalTitle.textContent = \`EDIT BLOCK: \${blockType.toUpperCase()}\`;
                modalFields.innerHTML = "";

                // Helper to create normal input fields
                const createField = (
                  label,
                  name,
                  currentValue,
                  type = "text",
                ) => {
                  const wrapper = document.createElement("div");
                  wrapper.className = "flex flex-col gap-2 mb-4";

                  const labelEl = document.createElement("label");
                  labelEl.className =
                    "text-0.8rem font-nav text-[var(--theme-text-dim)] uppercase tracking-1px";
                  labelEl.textContent = label;
                  wrapper.appendChild(labelEl);

                  if (type === "textarea") {
                    const textarea = document.createElement("textarea");
                    textarea.name = name;
                    textarea.value = currentValue || "";
                    textarea.rows = 6;
                    textarea.className =
                      "w-full admin-input font-mono bg-[rgba(0,0,0,0.4)] border border-solid border-[var(--theme-accent-glow)] p-3 text-white outline-none focus:border-[var(--theme-accent)] rounded-lg";
                    wrapper.appendChild(textarea);
                  } else {
                    const inputContainer = document.createElement("div");
                    inputContainer.className = "flex gap-2 w-full";

                    const input = document.createElement("input");
                    input.type = type;
                    input.name = name;
                    input.value = currentValue || "";
                    input.className =
                      "flex-grow admin-input bg-[rgba(0,0,0,0.4)] border border-solid border-[var(--theme-accent-glow)] p-3 text-white outline-none focus:border-[var(--theme-accent)] rounded-lg";
                    inputContainer.appendChild(input);

                    if (name === "url" || name === "imageUrl") {
                      const fileInput = document.createElement("input");
                      fileInput.type = "file";
                      fileInput.accept = "image/*";
                      fileInput.style.display = "none";

                      const uploadBtn = document.createElement("button");
                      uploadBtn.type = "button";
                      uploadBtn.textContent = "UPLOAD";
                      uploadBtn.className =
                        "btn-secondary text-0.8rem py-2 px-4 whitespace-nowrap";

                      uploadBtn.onclick = () => fileInput.click();
                      fileInput.onchange = async (evt) => {
                        const file = evt.target.files[0];
                        if (file) {
                          const base64 = await resizeImage(file, 1440, 0.85);
                          input.value = base64;
                        }
                      };

                      inputContainer.appendChild(fileInput);
                      inputContainer.appendChild(uploadBtn);
                    }
                    wrapper.appendChild(inputContainer);
                  }
                  modalFields.appendChild(wrapper);
                };

                if (blockType === "image") {
                  createField("Image URL / File", "url", value.url);
                  createField("Alt Text", "alt", value.alt);
                  createField("Caption", "caption", value.caption);
                } else if (blockType === "video") {
                  createField("Video URL", "url", value.url);
                  createField("Caption", "caption", value.caption);
                } else if (blockType === "codeBlock") {
                  createField(
                    "Language",
                    "language",
                    value.language || "javascript",
                  );
                  createField(
                    "Filename (optional)",
                    "filename",
                    value.filename,
                  );
                  createField("Code", "code", value.code, "textarea");
                } else if (blockType === "hero") {
                  createField(
                    "Background Image URL",
                    "imageUrl",
                    value.imageUrl,
                  );
                  createField("Hero Title", "title", value.title);
                  createField("Hero Subtitle", "subtitle", value.subtitle);
                } else if (blockType === "table") {
                  const tableWrapper = document.createElement("div");
                  tableWrapper.className = "flex flex-col gap-4";

                  const rows = value.rows || [];
                  let numRows = rows.length;
                  let numCols = rows[0]?.cells?.length || 0;

                  const gridContainer = document.createElement("div");
                  gridContainer.className =
                    "my-2 overflow-x-auto border border-solid border-[var(--theme-accent-glow)] rounded-lg bg-[rgba(0,0,0,0.2)]";

                  const renderGrid = () => {
                    gridContainer.innerHTML = "";
                    if (numRows === 0 || numCols === 0) {
                      gridContainer.innerHTML =
                        "<div class='text-center p-6 text-[var(--theme-text-dim)]'>Empty Table</div>";
                      return;
                    }

                    const tableEl = document.createElement("table");
                    tableEl.className = "w-full border-collapse";

                    for (let r = 0; r < numRows; r++) {
                      const tr = document.createElement("tr");
                      tr.className =
                        "border-b border-solid border-[var(--theme-accent-glow)] last:border-0";

                      for (let c = 0; c < numCols; c++) {
                        const td = document.createElement("td");
                        td.className =
                          "p-1 border-r border-solid border-[var(--theme-accent-glow)] last:border-r-0";

                        const cellInput = document.createElement("input");
                        cellInput.type = "text";
                        cellInput.dataset.row = r;
                        cellInput.dataset.col = c;

                        const cellValue = rows[r]?.cells?.[c] || "";
                        cellInput.value = cellValue;
                        cellInput.className =
                          "w-full bg-transparent border-0 text-white p-2 text-0.85rem outline-none focus:bg-[rgba(255,255,255,0.05)]";

                        td.appendChild(cellInput);
                        tr.appendChild(td);
                      }
                      tableEl.appendChild(tr);
                    }
                    gridContainer.appendChild(tableEl);
                  };

                  const controls = document.createElement("div");
                  controls.className = "flex gap-2 flex-wrap";

                  const createControlBtn = (text, onClick) => {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.textContent = text;
                    btn.className = "btn-secondary text-0.75rem py-1 px-3";
                    btn.onclick = onClick;
                    return btn;
                  };

                  controls.appendChild(
                    createControlBtn("+ ROW", () => {
                      numRows++;
                      renderGrid();
                    }),
                  );
                  controls.appendChild(
                    createControlBtn("- ROW", () => {
                      if (numRows > 1) {
                        numRows--;
                        renderGrid();
                      }
                    }),
                  );
                  controls.appendChild(
                    createControlBtn("+ COL", () => {
                      numCols++;
                      renderGrid();
                    }),
                  );
                  controls.appendChild(
                    createControlBtn("- COL", () => {
                      if (numCols > 1) {
                        numCols--;
                        renderGrid();
                      }
                    }),
                  );

                  tableWrapper.appendChild(controls);
                  tableWrapper.appendChild(gridContainer);
                  modalFields.appendChild(tableWrapper);

                  if (numRows === 0) numRows = 2;
                  if (numCols === 0) numCols = 3;
                  renderGrid();

                  currentEditCallback = () => {
                    const newRows = [];
                    for (let r = 0; r < numRows; r++) {
                      const cells = [];
                      for (let c = 0; c < numCols; c++) {
                        const inputEl = gridContainer.querySelector(
                          \`input[data-row="\${r}"][data-col="\${c}"]\`,
                        );
                        cells.push(inputEl ? inputEl.value : "");
                      }
                      newRows.push({
                        _key:
                          rows[r]?._key ||
                          Math.random().toString(36).substring(2, 12),
                        _type: "tableRow",
                        cells,
                      });
                    }
                    update({ rows: newRows });
                    closeModal();
                  };
                } else {
                  const keys = Object.keys(value).filter(
                    (k) => !k.startsWith("_"),
                  );
                  if (keys.length === 0) {
                    modalFields.innerHTML =
                      "<div class='text-center p-4 text-[var(--theme-text-dim)]'>No editable properties detected for this block.</div>";
                  } else {
                    keys.forEach((k) => {
                      createField(k, k, value[k]);
                    });
                  }
                }

                if (blockType !== "table") {
                  currentEditCallback = () => {
                    const updatedFields = {};
                    const inputs =
                      modalFields.querySelectorAll("input, textarea");
                    inputs.forEach((input) => {
                      if (input.name) {
                        updatedFields[input.name] = input.value;
                      }
                    });
                    update(updatedFields);
                    closeModal();
                  };
                }

                modal.classList.remove("hidden");
                modal.classList.add("flex");
              });

              saveBtn.onclick = () => {
                if (currentEditCallback) {
                  currentEditCallback();
                }
              };

              window.currentPortableTextEditor = editor;
            };

            if (window.customElements) {
              customElements
                .whenDefined("ez-portable-text")
                .then(initPortableText);
            } else {
              document.addEventListener("DOMContentLoaded", initPortableText);
            }
          })();
        </script>
      `}
    </div>
  );
};
