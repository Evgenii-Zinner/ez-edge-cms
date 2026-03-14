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
            const container = document.getElementById("editorjs-container");
            const input = document.getElementById("editorjs-content-input");
            if (!container || !input) return;

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
                    id: block.id || Math.random().toString(36).substring(2, 12),
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
                window["Editorjs" + name] ||
                window["cdx" + name]
              );
            };

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

            const editor = new EditorJS({
              holder: "editorjs-container",
              data: initialData,
              tools: {
                header: {
                  class: getTool("Header"),
                  inlineToolbar: ["link"],
                  config: {
                    placeholder: "Enter a heading",
                    levels: [1, 2, 3, 4],
                    defaultLevel: 2,
                  },
                },
                list: {
                  class: getTool("List"),
                  inlineToolbar: true,
                },
                image: {
                  class: getTool("Image"),
                  inlineToolbar: true,
                  config: {
                    uploader: {
                      uploadByFile: async (file) => {
                        const base64 = await resizeImage(file, 1440, 0.85);

                        return {
                          success: 1,
                          file: {
                            url: base64,
                          },
                        };
                      },
                      uploadByUrl: (url) => {
                        return {
                          success: 1,
                          file: {
                            url: url,
                          },
                        };
                      },
                    },
                  },
                },
                quote: {
                  class: getTool("Quote"),
                  inlineToolbar: true,
                  shortcut: "CMD+SHIFT+O",
                  config: {
                    quotePlaceholder: "Enter a quote",
                    captionPlaceholder: "Quote's author",
                  },
                },
              },
              /**
               * OnReady Hook:
               * Ensures all blocks have unique IDs for stable internal state.
               */
              onReady: () => {
                const DragDropPlugin =
                  window.DragDrop || window.EditorjsDragDrop;
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
          })();
        </script>
      `}
    </>
  );
};
