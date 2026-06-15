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

      <div class="flex border-b border-solid border-[var(--theme-accent-glow)] mb-0 w-max relative top-[1px] z-10">
        <button
          type="button"
          id="tab-btn-visual"
          class="admin-btn py-2 px-4 rounded-b-none border-b-0 bg-[var(--theme-bg)] text-[var(--theme-text-main)] !opacity-100"
          onclick="switchTab('visual')"
        >
          Visual Editor
        </button>
        <button
          type="button"
          id="tab-btn-json"
          class="admin-btn py-2 px-4 rounded-b-none border-b-0 bg-transparent text-[var(--theme-text-dim)] !opacity-60 hover:!opacity-100"
          onclick="switchTab('json')"
        >
          Clean JSON
        </button>
      </div>

      <div class="admin-card border-solid p-0 flex flex-col min-h-[500px] bg-[rgba(0,0,0,0.3)] rounded-tl-none relative overflow-hidden">
        {/* Toolbar */}
        <div
          id="visual-toolbar"
          class="bg-[var(--theme-bg)] border-b border-solid border-[var(--theme-accent-glow)] p-3 flex flex-wrap gap-2 items-center sticky top-0 z-[100]"
        >
          <select
            class="admin-input py-1 px-2 text-0.85rem w-auto cursor-pointer"
            onchange="runFormatCommand('formatBlock', this.value); this.value = 'p';"
          >
            <option value="p">Paragraph</option>
            <option value="H1">Heading 1</option>
            <option value="H2">Heading 2</option>
            <option value="H3">Heading 3</option>
            <option value="BLOCKQUOTE">Blockquote</option>
          </select>

          <div class="w-[1px] h-6 bg-[var(--theme-accent-glow)] mx-1 opacity-50"></div>

          <button
            type="button"
            class="admin-btn py-1 px-3 text-0.85rem"
            onmousedown="event.preventDefault();"
            onclick="runFormatCommand('bold')"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            class="admin-btn py-1 px-3 text-0.85rem"
            onmousedown="event.preventDefault();"
            onclick="runFormatCommand('italic')"
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            class="admin-btn py-1 px-3 text-0.85rem"
            onmousedown="event.preventDefault();"
            onclick="runFormatCommand('insertUnorderedList')"
            title="Bullet List"
          >
            • List
          </button>
          <button
            type="button"
            class="admin-btn py-1 px-3 text-0.85rem"
            onmousedown="event.preventDefault();"
            onclick="insertLink()"
            title="Link"
          >
            🔗 Link
          </button>

          <div class="w-[1px] h-6 bg-[var(--theme-accent-glow)] mx-1 opacity-50"></div>

          <button
            type="button"
            class="admin-btn py-1 px-3 text-0.85rem text-[var(--theme-accent-mint)]"
            onmousedown="event.preventDefault();"
            onclick="openHeroModal()"
            title="Insert Hero"
          >
            + Hero
          </button>
          <button
            type="button"
            class="admin-btn py-1 px-3 text-0.85rem text-[var(--theme-accent-mint)]"
            onmousedown="event.preventDefault();"
            onclick="openTableModal()"
            title="Insert Table"
          >
            + Table
          </button>
          <button
            type="button"
            class="admin-btn py-1 px-3 text-0.85rem text-[var(--theme-accent-mint)]"
            onmousedown="event.preventDefault();"
            onclick="openCodeModal()"
            title="Insert Code"
          >
            + Code
          </button>
        </div>

        {/* Visual Canvas */}
        <div
          id="visual-editor"
          class="flex-grow p-6 outline-none text-[1.1rem] leading-relaxed relative z-10"
          contenteditable={true}
        ></div>

        {/* JSON Canvas */}
        <div
          id="json-editor"
          class="hidden flex-col flex-grow absolute inset-0 z-20 bg-[rgba(0,0,0,0.5)] h-full"
        >
          <textarea
            id="json-textarea"
            class="admin-input flex-grow p-6 font-mono text-0.9rem resize-none outline-none border-none bg-transparent h-full w-full whitespace-pre"
            oninput="document.getElementById('portabletext-content-input').value = this.value; window.adminHasChanges = true;"
          ></textarea>
        </div>
      </div>

      {/* Modals */}
      {html`
        <!-- Styles for Editor Custom Blocks -->
        <style>
          .custom-hero-block,
          .custom-code-block,
          .editor-table {
            margin: 1.5rem 0;
            border: 1px solid var(--theme-accent-glow);
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 4px;
            position: relative;
          }
          .hero-block-header,
          .code-block-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
            font-size: 0.85rem;
            color: var(--theme-accent);
          }
          .hero-block-del-btn {
            background: var(--theme-accent-rose);
            color: white;
            border: none;
            padding: 2px 8px;
            border-radius: 4px;
            cursor: pointer;
          }
          .editor-table {
            width: 100%;
            border-collapse: collapse;
          }
          .editor-table th,
          .editor-table td {
            border: 1px solid var(--theme-accent-glow);
            padding: 0.5rem;
          }
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 4000;
            display: none;
            align-items: center;
            justify-content: center;
          }
          .modal-overlay.active {
            display: flex;
          }
          .modal-card {
            background: var(--theme-bg);
            border: 1px solid var(--theme-accent-glow);
            padding: 2rem;
            border-radius: 8px;
            width: 400px;
            max-width: 90%;
          }
        </style>

        <div
          class="modal-overlay"
          id="hero-modal"
          onclick="closeModalOnOuterClick(event)"
        >
          <div class="modal-card">
            <h3
              class="font-header text-1.5rem mb-4 color-[var(--theme-accent)]"
            >
              ✨ Insert Hero
            </h3>
            <div class="mb-3">
              <label
                class="block text-0.85rem color-[var(--theme-text-dim)] mb-1"
                >Title</label
              >
              <input
                type="text"
                id="modal-hero-title"
                class="admin-input w-full"
                placeholder="Title"
              />
            </div>
            <div class="mb-3">
              <label
                class="block text-0.85rem color-[var(--theme-text-dim)] mb-1"
                >Subtitle</label
              >
              <input
                type="text"
                id="modal-hero-subtitle"
                class="admin-input w-full"
                placeholder="Subtitle"
              />
            </div>
            <div class="mb-4">
              <label
                class="block text-0.85rem color-[var(--theme-text-dim)] mb-1"
                >Background Image URL</label
              >
              <input
                type="text"
                id="modal-hero-image"
                class="admin-input w-full"
              />
            </div>
            <div class="flex gap-2">
              <button
                class="admin-btn py-2 px-4 bg-[#222]"
                onclick="closeHeroModal()"
              >
                Cancel
              </button>
              <button
                class="admin-btn py-2 px-4 flex-grow bg-[var(--theme-accent-mint)] color-black"
                onclick="submitHeroBlock()"
              >
                Insert
              </button>
            </div>
          </div>
        </div>

        <div
          class="modal-overlay"
          id="table-modal"
          onclick="closeModalOnOuterClick(event)"
        >
          <div class="modal-card">
            <h3
              class="font-header text-1.5rem mb-4 color-[var(--theme-accent)]"
            >
              📊 Insert Table
            </h3>
            <div class="flex gap-4 mb-4">
              <div class="flex-1">
                <label
                  class="block text-0.85rem color-[var(--theme-text-dim)] mb-1"
                  >Rows</label
                >
                <input
                  type="number"
                  id="modal-table-rows"
                  class="admin-input w-full"
                  value="3"
                  min="1"
                  max="10"
                />
              </div>
              <div class="flex-1">
                <label
                  class="block text-0.85rem color-[var(--theme-text-dim)] mb-1"
                  >Columns</label
                >
                <input
                  type="number"
                  id="modal-table-cols"
                  class="admin-input w-full"
                  value="3"
                  min="1"
                  max="6"
                />
              </div>
            </div>
            <div class="flex gap-2">
              <button
                class="admin-btn py-2 px-4 bg-[#222]"
                onclick="closeTableModal()"
              >
                Cancel
              </button>
              <button
                class="admin-btn py-2 px-4 flex-grow bg-[var(--theme-accent-mint)] color-black"
                onclick="submitTableBlock()"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>

        <div
          class="modal-overlay"
          id="code-modal"
          onclick="closeModalOnOuterClick(event)"
        >
          <div class="modal-card">
            <h3
              class="font-header text-1.5rem mb-4 color-[var(--theme-accent)]"
            >
              💻 Insert Code
            </h3>
            <div class="mb-3">
              <label
                class="block text-0.85rem color-[var(--theme-text-dim)] mb-1"
                >Language</label
              >
              <select id="modal-code-lang" class="admin-input w-full">
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="python">Python</option>
                <option value="bash">Bash</option>
                <option value="plaintext">Plaintext</option>
              </select>
            </div>
            <div class="mb-4">
              <label
                class="block text-0.85rem color-[var(--theme-text-dim)] mb-1"
                >Code</label
              >
              <textarea
                id="modal-code-content"
                class="admin-input w-full min-h-[150px] font-mono"
              ></textarea>
            </div>
            <div class="flex gap-2">
              <button
                class="admin-btn py-2 px-4 bg-[#222]"
                onclick="closeCodeModal()"
              >
                Cancel
              </button>
              <button
                class="admin-btn py-2 px-4 flex-grow bg-[var(--theme-accent-mint)] color-black"
                onclick="submitCodeBlock()"
              >
                Insert Code
              </button>
            </div>
          </div>
        </div>

        <script>
          const editor = document.getElementById("visual-editor");
          const hiddenInput = document.getElementById(
            "portabletext-content-input",
          );

          // Initialize editor state
          document.addEventListener("DOMContentLoaded", () => {
            const initialData = JSON.parse(hiddenInput.value || "[]");
            if (initialData.length > 0) {
              renderPortableTextToHtml(initialData);
            } else {
              editor.innerHTML = "<p><br></p>";
            }
          });

          // Sync logic
          function syncInput() {
            if (
              !document
                .getElementById("json-editor")
                .classList.contains("hidden")
            )
              return;
            const data = convertEditorToPortableText();
            hiddenInput.value = JSON.stringify(data);
            window.adminHasChanges = true;
          }

          editor.addEventListener("input", syncInput);
          editor.addEventListener("keyup", syncInput);
          editor.addEventListener("click", syncInput);

          // Tabs
          function switchTab(tab) {
            const visualBtn = document.getElementById("tab-btn-visual");
            const jsonBtn = document.getElementById("tab-btn-json");
            const visualToolbar = document.getElementById("visual-toolbar");
            const visualEditor = document.getElementById("visual-editor");
            const jsonEditor = document.getElementById("json-editor");
            const jsonTextarea = document.getElementById("json-textarea");

            if (tab === "json") {
              const data = convertEditorToPortableText();
              jsonTextarea.value = JSON.stringify(data, null, 2);
              hiddenInput.value = JSON.stringify(data);

              visualBtn.className =
                "admin-btn py-2 px-4 rounded-b-none border-b-0 bg-transparent text-[var(--theme-text-dim)] !opacity-60 hover:!opacity-100";
              jsonBtn.className =
                "admin-btn py-2 px-4 rounded-b-none border-b-0 bg-[var(--theme-bg)] text-[var(--theme-text-main)] !opacity-100";
              visualToolbar.classList.add("hidden");
              visualEditor.classList.add("hidden");
              jsonEditor.classList.remove("hidden");
              jsonEditor.classList.add("flex");
            } else {
              try {
                const parsed = JSON.parse(jsonTextarea.value);
                if (!Array.isArray(parsed))
                  throw new Error("Root must be an array");
                renderPortableTextToHtml(parsed);
                hiddenInput.value = JSON.stringify(parsed);
                window.adminHasChanges = true;

                jsonBtn.className =
                  "admin-btn py-2 px-4 rounded-b-none border-b-0 bg-transparent text-[var(--theme-text-dim)] !opacity-60 hover:!opacity-100";
                visualBtn.className =
                  "admin-btn py-2 px-4 rounded-b-none border-b-0 bg-[var(--theme-bg)] text-[var(--theme-text-main)] !opacity-100";
                visualToolbar.classList.remove("hidden");
                visualEditor.classList.remove("hidden");
                jsonEditor.classList.add("hidden");
                jsonEditor.classList.remove("flex");
              } catch (e) {
                alert("Invalid JSON: " + e.message);
              }
            }
          }

          // Commands
          function runFormatCommand(cmd, value = null) {
            document.execCommand(cmd, false, value);
            editor.focus();
            syncInput();
          }

          function insertLink() {
            const url = prompt("Enter link URL:", "https://");
            if (!url) return;
            runFormatCommand("createLink", url);
          }

          // Modals
          function openHeroModal() {
            document.getElementById("hero-modal").classList.add("active");
          }
          function closeHeroModal() {
            document.getElementById("hero-modal").classList.remove("active");
          }
          function openTableModal() {
            document.getElementById("table-modal").classList.add("active");
          }
          function closeTableModal() {
            document.getElementById("table-modal").classList.remove("active");
          }
          function openCodeModal() {
            document.getElementById("code-modal").classList.add("active");
          }
          function closeCodeModal() {
            document.getElementById("code-modal").classList.remove("active");
          }
          function closeModalOnOuterClick(event) {
            if (event.target.classList.contains("modal-overlay"))
              event.target.classList.remove("active");
          }

          function escapeHtml(str) {
            return str
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;");
          }

          // Insert at Caret
          function insertHtmlAtCursor(html) {
            editor.focus();
            const sel = window.getSelection();
            if (!sel.rangeCount) return;
            const range = sel.getRangeAt(0);

            // Find root block
            let parentBlock = range.startContainer;
            while (
              parentBlock &&
              parentBlock !== editor &&
              parentBlock.nodeType !== Node.ELEMENT_NODE
            ) {
              parentBlock = parentBlock.parentNode;
            }
            let topBlock = parentBlock;
            while (topBlock && topBlock.parentNode !== editor)
              topBlock = topBlock.parentNode;

            if (!topBlock || topBlock === editor) {
              const temp = document.createElement("div");
              temp.innerHTML = html;
              editor.appendChild(temp.firstElementChild);
              const p = document.createElement("p");
              p.innerHTML = "<br>";
              editor.appendChild(p);
              return;
            }

            const splitRange = document.createRange();
            splitRange.setStart(range.startContainer, range.startOffset);
            splitRange.setEndAfter(topBlock.lastChild);
            const afterContent = splitRange.extractContents();

            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = html;
            const insertedNode = tempDiv.firstElementChild;
            topBlock.after(insertedNode);

            let nextFocusNode = insertedNode;
            if (
              afterContent.textContent.trim().length > 0 ||
              afterContent.querySelector("img, table, br")
            ) {
              const nextBlock = topBlock.cloneNode(false);
              nextBlock.appendChild(afterContent);
              insertedNode.after(nextBlock);
              nextFocusNode = nextBlock;
            } else {
              const p = document.createElement("p");
              p.innerHTML = "<br>";
              insertedNode.after(p);
              nextFocusNode = p;
            }

            if (
              topBlock.textContent.trim().length === 0 &&
              !topBlock.querySelector("img, table, br")
            ) {
              topBlock.remove();
            }

            const newRange = document.createRange();
            newRange.setStart(nextFocusNode, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }

          // Blocks Logic
          function submitHeroBlock() {
            const title =
              document.getElementById("modal-hero-title").value || "Hero Title";
            const subtitle =
              document.getElementById("modal-hero-subtitle").value ||
              "Subtitle";
            const url = document.getElementById("modal-hero-image").value || "";
            const h = \`
              <div class="custom-hero-block" data-title="\${escapeHtml(title)}" data-subtitle="\${escapeHtml(subtitle)}" data-url="\${escapeHtml(url)}" contenteditable="false">
                <div class="hero-block-header"><span>✨ Custom Hero Component</span><button class="hero-block-del-btn" onclick="this.closest('.custom-hero-block').remove(); syncInput();">Delete</button></div>
                <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem">\${escapeHtml(title)}</div>
                <div style="color: #aaa">\${escapeHtml(subtitle)}</div>
                <div style="margin-top: 1rem; color: var(--theme-accent); font-size: 0.8rem">Image URL: \${escapeHtml(url)}</div>
              </div>\`;
            insertHtmlAtCursor(h);
            closeHeroModal();
            syncInput();
          }

          function submitTableBlock() {
            const r =
              parseInt(document.getElementById("modal-table-rows").value) || 3;
            const c =
              parseInt(document.getElementById("modal-table-cols").value) || 3;
            let t = '<table class="editor-table"><thead><tr>';
            for (let i = 1; i <= c; i++) t += \`<th>Header \${i}</th>\`;
            t += "</tr></thead><tbody>";
            for (let i = 1; i < r; i++) {
              t += "<tr>";
              for (let j = 1; j <= c; j++) t += \`<td>Cell \${j}</td>\`;
              t += "</tr>";
            }
            t += "</tbody></table>";
            insertHtmlAtCursor(t);
            closeTableModal();
            syncInput();
          }

          function submitCodeBlock() {
            const lang = document.getElementById("modal-code-lang").value;
            const code = document.getElementById("modal-code-content").value;
            const h = \`
              <div class="custom-code-block" data-language="\${escapeHtml(lang)}" data-code="\${escapeHtml(code)}" contenteditable="false">
                <div class="code-block-header">
                  <span>💻 Code Block (\${escapeHtml(lang).toUpperCase()})</span>
                  <button class="hero-block-del-btn" onclick="this.closest('.custom-code-block').remove(); syncInput();">Delete</button>
                </div>
                <textarea class="admin-input w-full font-mono text-0.85rem min-h-[100px]" oninput="this.closest('.custom-code-block').setAttribute('data-code', this.value); syncInput();">\${escapeHtml(code)}</textarea>
              </div>\`;
            insertHtmlAtCursor(h);
            document.getElementById("modal-code-content").value = "";
            closeCodeModal();
            syncInput();
          }

          // Parser Logic (Visual DOM -> PortableText JSON)
          function flattenEditorDOM() {
            const blocks = editor.querySelectorAll(
              ".custom-hero-block, table, ul, ol, .custom-code-block",
            );
            blocks.forEach((block) => {
              if (block.parentNode === editor) return;
              if (block.nodeName === "UL" || block.nodeName === "OL") {
                let p = block.parentNode;
                let inLi = false;
                while (p && p !== editor) {
                  if (p.nodeName === "LI") {
                    inLi = true;
                    break;
                  }
                  p = p.parentNode;
                }
                if (inLi) return;
              }
              let anc = block;
              while (anc.parentNode && anc.parentNode !== editor)
                anc = anc.parentNode;
              if (!anc.parentNode) return;
              const range = document.createRange();
              range.setStartAfter(block);
              range.setEndAfter(anc.lastChild);
              const frag = range.extractContents();
              anc.after(block);
              if (frag.textContent.trim().length > 0) {
                const newAnc = anc.cloneNode(false);
                newAnc.appendChild(frag);
                block.after(newAnc);
              }
              if (
                anc.textContent.trim().length === 0 &&
                !anc.querySelector("img,table,br")
              )
                anc.remove();
            });
          }

          function parseInline(element, marks = [], markDefs = []) {
            const spans = [];
            element.childNodes.forEach((child) => {
              if (child.nodeType === Node.TEXT_NODE) {
                if (child.textContent.length > 0) {
                  spans.push({
                    _type: "span",
                    text: child.textContent,
                    marks: marks.length ? [...marks] : undefined,
                  });
                }
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const m = [...marks];
                const n = child.nodeName;
                if (["STRONG", "B"].includes(n)) m.push("strong");
                else if (["EM", "I"].includes(n)) m.push("em");
                else if (n === "U") m.push("underline");
                else if (["S", "STRIKE", "DEL"].includes(n))
                  m.push("strike-through");
                else if (n === "A") {
                  const key = Math.random().toString(36).substr(2, 9);
                  markDefs.push({
                    _key: key,
                    _type: "link",
                    href: child.getAttribute("href") || "",
                  });
                  m.push(key);
                } else if (n === "BR") {
                  spans.push({ _type: "span", text: "\\n" });
                  return;
                }
                spans.push(...parseInline(child, m, markDefs));
              }
            });
            return spans;
          }

          function convertEditorToPortableText() {
            flattenEditorDOM();
            const blocks = [];
            Array.from(editor.childNodes).forEach((node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.trim().length > 0) {
                  blocks.push({
                    _type: "block",
                    style: "normal",
                    children: [{ _type: "span", text: node.textContent }],
                  });
                }
                return;
              }
              if (node.nodeType === Node.ELEMENT_NODE) {
                const n = node.nodeName;
                if (node.classList.contains("custom-hero-block")) {
                  blocks.push({
                    _type: "hero",
                    title: node.getAttribute("data-title"),
                    subtitle: node.getAttribute("data-subtitle"),
                    url: node.getAttribute("data-url"),
                  });
                  return;
                }
                if (node.classList.contains("custom-code-block")) {
                  blocks.push({
                    _type: "code",
                    language: node.getAttribute("data-language"),
                    code: node.getAttribute("data-code"),
                  });
                  return;
                }
                if (n === "TABLE") {
                  const rows = Array.from(node.querySelectorAll("tr")).map(
                    (tr) =>
                      Array.from(tr.querySelectorAll("td,th")).map(
                        (c) => c.textContent,
                      ),
                  );
                  blocks.push({
                    _type: "table",
                    withHeadings: !!node.querySelector("th"),
                    content: rows,
                  });
                  return;
                }
                if (n === "UL" || n === "OL") {
                  Array.from(node.querySelectorAll("li")).forEach((li) => {
                    const md = [];
                    const ch = parseInline(li, [], md);
                    blocks.push({
                      _type: "block",
                      style: "normal",
                      listItem: n === "UL" ? "bullet" : "number",
                      children: ch,
                      markDefs: md.length ? md : undefined,
                    });
                  });
                  return;
                }
                if (["H1", "H2", "H3", "H4", "H5", "H6"].includes(n)) {
                  const md = [];
                  const ch = parseInline(node, [], md);
                  blocks.push({
                    _type: "block",
                    style: n.toLowerCase(),
                    children: ch,
                    markDefs: md.length ? md : undefined,
                  });
                  return;
                }
                if (n === "BLOCKQUOTE") {
                  const md = [];
                  const ch = parseInline(node, [], md);
                  blocks.push({
                    _type: "block",
                    style: "blockquote",
                    children: ch,
                    markDefs: md.length ? md : undefined,
                  });
                  return;
                }
                if (n === "P" || n === "DIV") {
                  const md = [];
                  const ch = parseInline(node, [], md);
                  if (ch.length)
                    blocks.push({
                      _type: "block",
                      style: "normal",
                      children: ch,
                      markDefs: md.length ? md : undefined,
                    });
                  return;
                }
                const md = [];
                const ch = parseInline(node, [], md);
                if (ch.length)
                  blocks.push({
                    _type: "block",
                    style: "normal",
                    children: ch,
                    markDefs: md.length ? md : undefined,
                  });
              }
            });
            return blocks;
          }

          function renderSpansToHtml(ch, md = []) {
            let h = "";
            ch.forEach((s) => {
              let sh = escapeHtml(s.text || "").replace(/\\n/g, "<br>");
              if (s.marks)
                s.marks.forEach((m) => {
                  if (m === "strong") sh = \`<strong>\${sh}</strong>\`;
                  else if (m === "em") sh = \`<em>\${sh}</em>\`;
                  else if (m === "underline") sh = \`<u>\${sh}</u>\`;
                  else if (m === "strike-through") sh = \`<s>\${sh}</s>\`;
                  else {
                    const d = md.find((x) => x._key === m);
                    if (d) sh = \`<a href="\${escapeHtml(d.href)}">\${sh}</a>\`;
                  }
                });
              h += sh;
            });
            return h;
          }

          function renderPortableTextToHtml(blocks) {
            let h = "";
            let list = null;
            blocks.forEach((b) => {
              if (list && b.listItem !== list) {
                h += list === "bullet" ? "</ul>" : "</ol>";
                list = null;
              }
              if (b.listItem) {
                if (!list) {
                  list = b.listItem;
                  h += list === "bullet" ? "<ul>" : "<ol>";
                }
                h += \`<li>\${renderSpansToHtml(b.children || [], b.markDefs || [])}</li>\`;
              } else {
                if (b._type === "hero") {
                  h += \`
                  <div class="custom-hero-block" data-title="\${escapeHtml(b.title || "")}" data-subtitle="\${escapeHtml(b.subtitle || "")}" data-url="\${escapeHtml(b.url || "")}" contenteditable="false">
                    <div class="hero-block-header"><span>✨ Custom Hero Component</span><button class="hero-block-del-btn" onclick="this.closest('.custom-hero-block').remove(); syncInput();">Delete</button></div>
                    <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem">\${escapeHtml(b.title || "")}</div>
                    <div style="color: #aaa">\${escapeHtml(b.subtitle || "")}</div>
                    <div style="margin-top: 1rem; color: var(--theme-accent); font-size: 0.8rem">Image URL: \${escapeHtml(b.url || "")}</div>
                  </div>\`;
                } else if (b._type === "code") {
                  h += \`
                  <div class="custom-code-block" data-language="\${escapeHtml(b.language || "")}" data-code="\${escapeHtml(b.code || "")}" contenteditable="false">
                    <div class="code-block-header"><span>💻 Code Block (\${escapeHtml(b.language || "").toUpperCase()})</span><button class="hero-block-del-btn" onclick="this.closest('.custom-code-block').remove(); syncInput();">Delete</button></div>
                    <textarea class="admin-input w-full font-mono text-0.85rem min-h-[100px]" oninput="this.closest('.custom-code-block').setAttribute('data-code', this.value); syncInput();">\${escapeHtml(b.code || "")}</textarea>
                  </div>\`;
                } else if (b._type === "table") {
                  h += '<table class="editor-table">';
                  if (b.withHeadings) {
                    h += "<thead><tr>";
                    (b.content[0] || []).forEach(
                      (c) => (h += \`<th>\${escapeHtml(c)}</th>\`),
                    );
                    h += "</tr></thead><tbody>";
                    for (let i = 1; i < b.content.length; i++) {
                      h += "<tr>";
                      (b.content[i] || []).forEach(
                        (c) => (h += \`<td>\${escapeHtml(c)}</td>\`),
                      );
                      h += "</tr>";
                    }
                    h += "</tbody>";
                  } else {
                    h += "<tbody>";
                    (b.content || []).forEach((r) => {
                      h += "<tr>";
                      r.forEach((c) => (h += \`<td>\${escapeHtml(c)}</td>\`));
                      h += "</tr>";
                    });
                    h += "</tbody>";
                  }
                  h += "</table>";
                } else if (b._type === "block") {
                  const t = [
                    "h1",
                    "h2",
                    "h3",
                    "h4",
                    "h5",
                    "h6",
                    "blockquote",
                  ].includes(b.style)
                    ? b.style.toUpperCase()
                    : "P";
                  h += \`<\${t}>\${renderSpansToHtml(b.children || [], b.markDefs || [])}</\${t}>\`;
                }
              }
            });
            if (list) h += list === "bullet" ? "</ul>" : "</ol>";
            editor.innerHTML = h;
          }
        </script>
      `}
    </div>
  );
};
