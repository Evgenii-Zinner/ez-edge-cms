/** @jsxImportSource hono/jsx */
/**
 * @module BlockEditor
 * @description A bridge component between Hono (Server-side) and Editor.js (Client-side).
 * Orchestrates the initialization of the block-based editor and ensures that
 * changes are synchronized with a hidden input field for compatibility with
 * standard form submissions and HTMX.
 */

import { html } from "hono/html";
import { EditorJsData } from "@utils/editorjs-parser";

/**
 * Props for the BlockEditor component.
 */
export interface BlockEditorProps {
  /** The initial JSON data structure for the editor. */
  content: EditorJsData;
}

/**
 * Component: BlockEditor
 * Renders a container for Editor.js and handles safe serialization of initial data.
 * Includes client-side logic for tool resolution, auto-saving to a hidden input,
 * and visual styling overrides for the editor blocks.
 */
export const BlockEditor = ({ content }: BlockEditorProps) => {
  // Safe serialization: Escape '<' to prevent XSS and premature script termination
  const contentJson = JSON.stringify(content || { blocks: [] }).replace(
    /</g,
    "\\u003c",
  );

  return (
    <>
      {/* Hidden input used to capture Editor.js state for form submission */}
      <input
        type="hidden"
        name="content"
        id="editorjs-content-input"
        value={contentJson}
      />

      {/* Editor.js mount point */}
      <div
        id="editorjs-container"
        class="admin-card p-4 min-h-400px bg-[rgba(0,0,0,0.3)] border-solid"
      ></div>

      {/* Editor.js Initialization Script */}
      {html`
        <script>
          (function () {
            const initEditor = () => {
              const container = document.getElementById("editorjs-container");
              const input = document.getElementById("editorjs-content-input");
              if (!container || !input) return;

              // Prevent double initialization
              if (window.currentEditor) return;

              /**
               * Resizes an image to specified dimensions and quality.
               */
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

              /**
               * Custom Tool: Hero Block
               * An H1 title and subtext overlaid on a background image.
               */
              class Hero {
                static get toolbox() {
                  return {
                    title: "Hero",
                    icon: '<svg width="20" height="20" viewBox="0 0 20 20"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" fill="none" stroke-width="2"/><path d="M4 10h12" stroke="currentColor" stroke-width="2"/></svg>',
                  };
                }

                constructor({ data, api }) {
                  this.data = {
                    url: data.url || "",
                    title: data.title || "",
                    subtitle: data.subtitle || "",
                  };
                  this.api = api;
                  this.nodes = {
                    wrapper: null,
                    image: null,
                    title: null,
                    subtitle: null,
                  };
                }

                render() {
                  this.nodes.wrapper = document.createElement("div");
                  this.nodes.wrapper.classList.add("hero-editor-wrapper");
                  this.nodes.wrapper.style.cssText =
                    "position:relative; min-h:300px; background:#111; border:1px solid #333; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:40px;";

                  this.nodes.image = document.createElement("div");
                  this.nodes.image.style.cssText =
                    "position:absolute; top:0; left:0; width:100%; height:100%; z-index:0; background-size:cover; background-position:center; opacity:0.5;";
                  if (this.data.url) {
                    this.nodes.image.style.backgroundImage = \`url(\${this.data.url})\`;
                  }

                  const uploadBtn = document.createElement("button");
                  uploadBtn.innerHTML = "SET BACKGROUND";
                  uploadBtn.style.cssText =
                    "position:absolute; top:10px; right:10px; z-index:10; background:rgba(0,255,255,0.2); border:1px solid cyan; color:cyan; padding:5px 10px; cursor:pointer; font-size:10px;";
                  uploadBtn.onclick = () => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const base64 = await resizeImage(file, 1920, 0.85);
                        this.data.url = base64;
                        this.nodes.image.style.backgroundImage = \`url(\${base64})\`;
                      }
                    };
                    input.click();
                  };

                  this.nodes.title = document.createElement("h1");
                  this.nodes.title.contentEditable = true;
                  this.nodes.title.dataset.placeholder = "HERO TITLE";
                  this.nodes.title.innerHTML = this.data.title;
                  this.nodes.title.style.cssText =
                    "position:relative; z-index:1; color:white; margin:0; font-size:2.5rem; text-transform:uppercase; outline:none;";

                  this.nodes.subtitle = document.createElement("p");
                  this.nodes.subtitle.contentEditable = true;
                  this.nodes.subtitle.dataset.placeholder =
                    "Sub-text description...";
                  this.nodes.subtitle.innerHTML = this.data.subtitle;
                  this.nodes.subtitle.style.cssText =
                    "position:relative; z-index:1; color:#aaa; margin-top:10px; outline:none;";

                  this.nodes.wrapper.appendChild(this.nodes.image);
                  this.nodes.wrapper.appendChild(uploadBtn);
                  this.nodes.wrapper.appendChild(this.nodes.title);
                  this.nodes.wrapper.appendChild(this.nodes.subtitle);

                  return this.nodes.wrapper;
                }

                save(blockContent) {
                  return {
                    url: this.data.url,
                    title: this.nodes.title.innerHTML,
                    subtitle: this.nodes.subtitle.innerHTML,
                  };
                }
              }

              // Stop 'Enter' from submitting the parent form while editing blocks
              container.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                }
              });

              let initialData = { blocks: [] };
              try {
                if (input.value) {
                  initialData = JSON.parse(input.value);

                  // CRITICAL: Every block MUST have a unique ID for drag-and-drop
                  // and internal state management to work correctly without duplication.
                  if (initialData.blocks) {
                    initialData.blocks = initialData.blocks.map((block) => ({
                      ...block,
                      id:
                        block.id || Math.random().toString(36).substring(2, 12),
                    }));
                  }
                }
              } catch (e) {
                console.error("Failed to parse initial Editor.js data", e);
              }

              /**
               * Helper to resolve Editor.js plugins from global scope.
               * Supports various naming conventions used by standard plugins.
               */
              const getTool = (name) => {
                if (name === "Image")
                  return window.ImageTool || window.SimpleImage;
                return (
                  window[name] ||
                  window[name + "Tool"] ||
                  window["Editorjs" + name] ||
                  window["cdx" + name]
                );
              };

              const tools = {
                hero: Hero,
              };

              // Helper to safely add tools only if they exist
              const addTool = (name, toolName, config = {}) => {
                const toolClass = getTool(toolName);
                if (toolClass) {
                  tools[name] = {
                    class: toolClass,
                    ...config,
                  };
                } else {
                  console.warn(
                    \`Editor.js tool "\${toolName}" (for "\${name}") not found in global scope.\`,
                  );
                }
              };

              // Core tools
              addTool("header", "Header", {
                inlineToolbar: ["link"],
                config: {
                  placeholder: "Enter a heading",
                  levels: [1, 2, 3, 4],
                  defaultLevel: 2,
                },
              });

              addTool("list", "List", { inlineToolbar: true });

              addTool("image", "Image", {
                inlineToolbar: true,
                config: {
                  uploader: {
                    uploadByFile: async (file) => {
                      const base64 = await resizeImage(file, 1440, 0.85);
                      return { success: 1, file: { url: base64 } };
                    },
                    uploadByUrl: (url) => {
                      return { success: 1, file: { url: url } };
                    },
                  },
                },
              });

              addTool("quote", "Quote", {
                inlineToolbar: true,
                shortcut: "CMD+SHIFT+O",
                config: {
                  quotePlaceholder: "Enter a quote",
                  captionPlaceholder: "Quote's author",
                },
              });

              // New tools
              addTool("table", "Table", {
                inlineToolbar: true,
                config: { rows: 2, cols: 3 },
              });

              addTool("embed", "Embed", {
                config: {
                  services: {
                    youtube: true,
                    twitter: true,
                    vimeo: true,
                    instagram: true,
                    facebook: true,
                    codepen: true,
                    pinterest: true,
                  },
                },
              });

              addTool("code", "Code", {
                config: { placeholder: "Enter your code here..." },
              });

              addTool("delimiter", "Delimiter");

              const editor = new EditorJS({
                holder: "editorjs-container",
                data: initialData,
                tools: tools,
                /**
                 * OnReady Hook:
                 * Ensures all blocks have unique IDs for stable internal state.
                 */
                onReady: () => {
                  const DragDropPlugin =
                    window.DragDrop ||
                    window.EditorjsDragDrop ||
                    window.EditorJSDragDrop;
                  if (DragDropPlugin) {
                    new DragDropPlugin(editor);
                  } else {
                    console.warn(
                      "Editor.js DragDrop plugin not found in global scope.",
                    );
                  }
                },
                /**
                 * Synchronization Hook:
                 * Whenever content changes, serialize the editor state back to
                 * the hidden input and mark the admin HUD as having unsaved changes.
                 */
                onChange: async (api) => {
                  const outputData = await api.saver.save();
                  input.value = JSON.stringify(outputData);
                  window.adminHasChanges = true;
                },
              });

              window.currentEditor = editor;
            };

            // Wait for deferred EditorJS scripts to load
            if (window.EditorJS) {
              initEditor();
            } else {
              document.addEventListener("DOMContentLoaded", initEditor);
            }
          })();
        </script>
      `}
    </>
  );
};
