import { defineConfig } from "unocss";
import presetWind4 from "@unocss/preset-wind4";
import presetAttributify from "@unocss/preset-attributify";
import presetIcons from "@unocss/preset-icons";

export default defineConfig({
  safelist: [
    // Editor.js Core & Structure
    "ce-block",
    "ce-block__content",
    "ce-toolbar__content",
    "ce-block--selected",
    "ce-header",
    "ce-paragraph",
    "cdx-list",
    "cdx-list__item",
    "cdx-quote",
    "cdx-quote__text",
    "cdx-quote__caption",
    "cdx-simple-image",

    // Editor.js UI Action classes
    "ce-toolbar__plus",
    "ce-toolbar__settings-btn",
    "ce-toolbar__actions",

    // Design System content elements (from shortcuts)
    "content-frame",
    "content-img",
    "image-stretched",
    "image-with-border",
    "image-with-background",
    "standard-heading",

    // Layout & Nav
    "main-header",
    "header-content",
    "logo",
    "main-nav",
    "nav-link",
    "menu-toggle",
    "main-footer",
    "footer-content",
    "footer-links",
    "footer-link",
    "footer-copyright",
    "footer-bottom",
    "branding-wrapper",
    "branding-link",
    "branding-text",
    "branding-badge",
    "branding-badge-item",
    "branding-badge-edge",
    "bento-grid",
    "bento-item",

    // Admin UI specific
    "admin-action-btn",
    "btn-primary",
    "nav-item",
    "nav-item-active",
    "nav-item-error",
    "nav-item-warning",
    "nav-item-success",
    "nav-item-info",
    "admin-card",
    "admin-input",
    "toast-notification",
    "btn-mini",
    "open",

    // Common dynamic utilities that might be used in content
    "text-left",
    "text-center",
    "text-right",
    "italic",
    "font-bold",
    "underline",
  ],
  presets: [
    presetWind4(),
    presetAttributify(),
    presetIcons({
      warn: true,
      cdn: "https://esm.sh/",
      extraProperties: {
        display: "inline-block",
        "vertical-align": "middle",
      },
    }),
  ],
  preflights: [
    {
      getCSS: () => `
                * {box-sizing:border-box}
                body{margin:0;padding:0;background-color:var(--theme-bg);color:var(--theme-text-main);font-family:var(--font-body);overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
                ::selection{background:var(--theme-accent);color:var(--theme-bg);text-shadow:none}
                p{font-family:var(--font-body);line-height:1.6;color:var(--theme-text-main);margin-bottom:1.2rem}
                
                #main-content ul, #main-content ol {
                    list-style: none !important;
                    padding-left: 1.5rem !important;
                    position: relative;
                    margin: 1rem 0;
                }
                
                #main-content ul::before, #main-content ol::before {
                    content: "";
                    position: absolute;
                    left: 0.5rem; 
                    top: 0.8rem;
                    bottom: 0.8rem;
                    width: 1px;
                    background: var(--theme-accent-glow);
                    opacity: 0.4;
                }

                #main-content ul ul::before, #main-content ol ol::before, #main-content ul ol::before, #main-content ol ul::before {
                    display: none;
                }

                #main-content li {
                    position: relative;
                    margin-bottom: 0.5rem;
                    padding-left: 0.5rem;
                    color: var(--theme-text-main);
                    font-family: var(--font-body);
                    line-height: 1.6;
                }

                #main-content ul > li::after {
                    content: "";
                    position: absolute;
                    left: -1.35rem;
                    top: 0.5rem;
                    width: 12px;
                    height: 12px;
                    background: var(--theme-bg);
                    border: 2px solid var(--theme-accent);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--theme-accent-glow);
                    z-index: 2;
                }

                #main-content ul ul > li::after {
                    width: 8px;
                    height: 8px;
                    left: -1.25rem;
                    top: 0.65rem;
                    border-width: 1px;
                }

                #main-content ol { counter-reset: counter; }
                #main-content ol > li { counter-increment: counter; }
                #main-content ol > li::after {
                    content: counter(counter);
                    position: absolute;
                    left: -1.6rem;
                    top: 0.35rem;
                    font-family: var(--font-nav);
                    font-weight: bold;
                    font-size: 0.65rem;
                    color: var(--theme-accent);
                    text-shadow: 0 0 5px var(--theme-accent);
                    background: var(--theme-bg);
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--theme-accent-glow);
                    border-radius: 2px;
                    z-index: 2;
                }

                #main-content{position:relative;z-index:2;max-width:1200px;margin:clamp(1rem, 5vw, 2.5rem) auto;padding:0 clamp(1rem, 5vw, 2.5rem);flex:1 0 auto;width:100%;overflow-x:hidden;}
                #main-content a{color:var(--theme-accent);text-decoration:none;border-bottom:1px solid var(--theme-accent-glow);transition:all 0.3s}
                #main-content a:hover{text-shadow:0 0 10px var(--theme-accent);border-bottom-color:var(--theme-accent)}
                
                /* Semantic Headers with Fluid Typography */
                h1, h2, h3, h4, h5, h6 {
                    font-family: var(--font-header);
                    tracking-widest: 0.1em;
                    text-transform: uppercase;
                    margin: clamp(1rem, 4vw, 2rem) 0 clamp(0.5rem, 2vw, 1.2rem);
                    color: var(--theme-accent);
                    letter-spacing: 2px;
                    line-height: 1.2;
                }
                h1 { font-size: clamp(1.8rem, 6vw, 3rem); }
                h2 { font-size: clamp(1.5rem, 5vw, 2.4rem); }
                h3 { font-size: clamp(1.3rem, 4vw, 2rem); }
                h4 { font-size: clamp(1.1rem, 3vw, 1.6rem); }
                h5 { font-size: clamp(1rem, 2.5vw, 1.3rem); }
                h6 { font-size: clamp(0.9rem, 2vw, 1.1rem); }

                #main-content code{background:var(--theme-surface);border:1px solid var(--theme-accent-glow);border-radius:4px;color:var(--theme-text-main);padding:0.2rem 0.4rem;font-family:var(--font-mono);font-size:0.9rem}

                #main-content blockquote {                    background: var(--theme-surface); 
                    border: 1px solid var(--theme-accent-glow); 
                    border-left: 4px solid var(--theme-accent); 
                    padding: 1.5rem; 
                    margin: 2rem 0; 
                    font-style: italic; 
                    color: var(--theme-text-main); 
                }
                #main-content blockquote p { margin: 0; }
                
                #main-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 2rem 0;
                    font-family: var(--font-nav);
                    font-size: 0.9rem;
                }
                #main-content th, #main-content td {
                    border: 1px solid var(--theme-accent-glow);
                    padding: 0.8rem 1rem;
                    text-align: left;
                }
                #main-content th {
                    background: rgba(var(--theme-primary-hue), var(--theme-primary-sat), var(--theme-primary-light), 0.1);
                    color: var(--theme-accent);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                #main-content tr:nth-child(even) {
                    background: rgba(255, 255, 255, 0.02);
                }

                /* HTMX Indicators */
                .htmx-indicator{opacity:0}
                .htmx-request .htmx-indicator{opacity:1; transition: opacity 200ms ease-in;}
                .htmx-request.htmx-indicator{opacity:1; transition: opacity 200ms ease-in;}

                /* Editor.js Base & Plugin Styles */
                .ce-block__content, .ce-toolbar__content { 
                    max-width: calc(100% - 60px) !important; 
                    margin-left: 60px !important; 
                }
                .ce-header { 
                    padding: 0.6em 0 3px; margin: 0; 
                    line-height: 1.25em; outline: none; 
                    font-family: var(--font-header);
                    color: var(--theme-accent);
                }
                h1.ce-header { font-size: 2.2em; }
                h2.ce-header { font-size: 1.8em; }
                h3.ce-header { font-size: 1.5em; }
                .ce-paragraph { 
                    line-height: 1.6em; outline: none; 
                    font-family: var(--font-body);
                    color: var(--theme-text-main);
                }
                .cdx-list { margin: 0; padding: 6px; outline: none; display: grid; gap: 8px; }
                .cdx-quote { margin: 0; }
                .cdx-quote__text { min-height: 100px; margin-bottom: 10px; }
                .image-tool__image-picture { border: 1px solid var(--theme-accent-glow); }
                .cdx-simple-image__picture--with-background { background: rgba(0,0,0,0.3); padding: 20px; }
                .ce-toolbar__actions { color: var(--theme-accent) !important; }
                .ce-toolbar__plus, .ce-toolbar__settings-btn { 
                    color: var(--theme-accent) !important; 
                    background-color: var(--theme-accent-dim) !important;
                }
                .ce-toolbar__plus:hover, .ce-toolbar__settings-btn:hover {
                    background-color: var(--theme-accent-glow) !important;
                }
                .ce-toolbar__plus svg, .ce-toolbar__settings-btn svg {
                    fill: var(--theme-accent) !important;
                }

                /* Editor.js UI Component Styling (Popovers, Toolbars, Settings) */
                .ce-popover, .ce-inline-toolbar, .ce-popover__container, .ce-settings, .ce-toolbox {
                    --color-background: var(--theme-surface-solid) !important;
                    --color-border: var(--theme-accent-glow) !important;
                    --color-shadow: rgba(0,0,0,0.8) !important;
                    --border-radius: 0px !important;
                    background-color: var(--theme-surface-solid) !important;
                    background: var(--theme-surface-solid) !important;
                    border: 1px solid var(--theme-accent-glow) !important;
                    border-radius: 0px !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.9) !important;
                    color: var(--theme-text-main) !important;
                }
                .ce-popover * { color: var(--theme-text-main) !important; }
                .ce-popover-item, .ce-popover__item, .ce-toolbox__button, .ce-settings__button, .ce-inline-toolbar__button, .ce-inline-tool {
                    --border-radius: 0px !important;
                    color: var(--theme-text-main) !important;
                    background: transparent !important;
                    border-radius: 0px !important;
                }
                .ce-popover-item:hover, .ce-popover__item:hover, .ce-toolbox__button:hover, .ce-settings__button:hover, .ce-inline-toolbar__button:hover, .ce-inline-tool:hover, .ce-inline-tool--active, .ce-inline-tool--unlink {
                    background-color: var(--theme-accent-dim) !important;
                    color: var(--theme-accent) !important;
                }
                .ce-popover-item-html { padding: 4px 8px; }
                .cdx-list-start-with-field { 
                    background: transparent !important; 
                    border: none !important; 
                    border-radius: 0 !important; 
                }
                .cdx-list-start-with-field__input {
                    background: var(--theme-bg) !important;
                    border: 1px solid var(--theme-accent-glow) !important;
                    color: var(--theme-text-main) !important;
                    padding: 4px 8px !important;
                    font-family: var(--font-mono) !important;
                    font-size: 0.8rem !important;
                    outline: none !important;
                    border-radius: 0 !important;
                    width: 100% !important;
                }
                .ce-popover__search, .cdx-search-field, .ce-popover__search-form-container {
                    display: flex !important;
                    align-items: center !important;
                    background: rgba(0, 0, 0, 0.5) !important;
                    border-bottom: 1px solid var(--theme-accent-glow) !important;
                    padding: 0 !important;
                    margin-bottom: 4px !important;
                    border-radius: 0 !important;
                }
                .cdx-search-field__input, .ce-popover__search input, .ce-inline-tool-input, .ce-inline-toolbar input, .cdx-input {
                    flex-grow: 1 !important;
                    padding: 4px !important;
                    background: transparent !important;
                    border: none !important;
                    outline: none !important;
                    color: var(--theme-text-main) !important;
                    border-radius: 0 !important;
                    font-family: var(--font-body) !important;
                }

                /* Common Admin Body Styles */
                body.admin-body { 
                    color-scheme: dark; 
                    background-color: var(--theme-bg); 
                    color: var(--theme-text-main);
                }
                body.admin-body h3 {
                    font-family: var(--font-header);
                    font-size: 1.1rem;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: var(--theme-accent);
                    border-bottom: 1px solid var(--theme-accent-glow);
                    padding-bottom: 0.5rem;
                    margin-top: 1.5rem;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                body.admin-body h3::before {
                    content: "";
                    display: inline-block;
                    width: 4px;
                    height: 1.1rem;
                    background: var(--theme-accent);
                    box-shadow: 0 0 10px var(--theme-accent-glow);
                }

                /* Custom Selection & UI Elements */
                .modal-overlay.open{opacity:1;pointer-events:auto}
                .modal-overlay.open .modal-content{transform:translateY(0)}

                input[type="radio"] { appearance: none; width: 1.2rem; height: 1.2rem; border: 1px solid var(--theme-accent-glow); border-radius: 50%; outline: none; cursor: pointer; box-shadow: inset 0 0 5px rgba(0,0,0,0.5); transition: all 0.3s; position: relative; background: var(--theme-surface); margin: 0; vertical-align: middle; }
                input[type="radio"]:checked { border-color: var(--theme-accent); box-shadow: 0 0 10px var(--theme-accent-glow); }
                input[type="radio"]:checked::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 0.6rem; height: 0.6rem; border-radius: 50%; background: var(--theme-accent); box-shadow: 0 0 8px var(--theme-accent); }

                input[type="checkbox"] { appearance: none; width: 1.2rem; height: 1.2rem; border: 1px solid var(--theme-accent-glow); border-radius: 2px; outline: none; cursor: pointer; box-shadow: inset 0 0 5px rgba(0,0,0,0.5); transition: all 0.3s; position: relative; background: var(--theme-surface); margin: 0; vertical-align: middle; }
                input[type="checkbox"]:checked { border-color: var(--theme-accent); box-shadow: 0 0 10px var(--theme-accent-glow); }
                input[type="checkbox"]:checked::after { content: '✓'; position: absolute; top: 0; left: 0; color: var(--theme-bg); background: var(--theme-accent); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: bold; }

                input[type="range"] { -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; }
                input[type="range"]::-webkit-slider-runnable-track { background: rgba(0, 0, 0, 0.5); height: 4px; border-radius: 2px; border: 1px solid var(--theme-accent-glow); }
                input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; height: 16px; width: 16px; background: var(--theme-bg); border: 2px solid var(--theme-accent); border-radius: 50%; box-shadow: 0 0 10px var(--theme-accent-glow); margin-top: -7px; transition: transform 0.1s; }
                input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.2); background: var(--theme-accent); }

                ::-webkit-scrollbar{width:8px;height:8px}
                ::-webkit-scrollbar-track{background:var(--theme-bg)}
                ::-webkit-scrollbar-thumb{background:var(--theme-accent-glow);border-radius:4px;border:1px solid var(--theme-surface)}
                ::-webkit-scrollbar-thumb:hover{background:var(--theme-accent)}
                `,
    },
  ],

  shortcuts: {
    "font-header": "[font-family:var(--font-header)]",
    "font-nav": "[font-family:var(--font-nav)]",
    "font-body": "[font-family:var(--font-body)]",
    "font-mono": "[font-family:var(--font-mono)]",

    "ui-overlay": "fixed inset-0 pointer-events-none z-1",
    scanlines:
      "bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.07)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[size:100%_4px,3px_100%] opacity-50 z-10",
    dots: "bg-[radial-gradient(circle,var(--theme-accent)_1px,transparent_1px)] bg-[size:32px_32px] opacity-5 z-1",
    "dots-interactive":
      "opacity-30 z-2 bg-[radial-gradient(circle,var(--theme-accent)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(250px_circle_at_var(--mouse-x,0)_var(--mouse-y,0),black_0%,transparent_100%)] [-webkit-mask-image:radial-gradient(250px_circle_at_var(--mouse-x,0)_var(--mouse-y,0),black_0%,transparent_100%)]",

    "main-header":
      "sticky top-0 z-2000 border-b border-b-solid border-[var(--theme-accent-glow)] bg-[var(--theme-surface)] backdrop-blur-8px",
    "header-content":
      "max-w-1200px mx-auto flex justify-between items-center px-[clamp(1rem,5vw,2.5rem)] py-4",
    logo: "relative font-header text-[var(--theme-text-main)] no-underline text-[clamp(1.1rem,3vw,1.5rem)] tracking-2px z-2001",

    "main-nav":
      "flex gap-6 items-center max-lg:fixed max-lg:top-0 max-lg:right-0 max-lg:h-[100dvh] max-lg:w-280px max-lg:bg-[var(--theme-surface-solid)] max-lg:backdrop-blur-20px max-lg:flex-col max-lg:items-start max-lg:pt-100px max-lg:p-8 max-lg:gap-6 max-lg:border-l max-lg:border-l-solid max-lg:border-l-[var(--theme-accent-glow)] max-lg:translate-x-full max-lg:invisible max-lg:transition-all max-lg:duration-300 max-lg:ease-in-out max-lg:z-1000 max-lg:overflow-y-auto",
    open: "important-translate-x-0 important-visible",

    "nav-link":
      "font-nav text-[var(--theme-text-dim)] no-underline tracking-1px uppercase transition-all duration-300 border-b border-b-solid border-transparent hover:text-[var(--theme-accent)] hover:drop-shadow-[0_0_8px_var(--theme-accent-glow)] hover:border-b-[var(--theme-accent)] text-0.85rem py-0.2 max-lg:text-1.2rem max-lg:tracking-2px max-lg:w-full max-lg:text-right",
    "menu-toggle":
      "relative lg:hidden bg-transparent border border-solid border-[var(--theme-accent-glow)] text-[var(--theme-accent)] px-3 py-1.5 cursor-pointer z-2001 font-nav text-0.75rem tracking-1px hover:bg-[var(--theme-accent-glow)]",

    "main-footer":
      "relative z-100 border-t border-t-solid border-[var(--theme-accent-glow)] px-[clamp(1rem,5vw,2.5rem)] py-[clamp(2rem,8vw,4rem)] mt-[clamp(4rem,10vw,8rem)] bg-[var(--theme-surface)] backdrop-blur-8px flex-shrink-0",
    "footer-content":
      "max-w-1200px mx-auto flex flex-col gap-[clamp(2rem,5vw,3rem)] max-lg:items-center max-lg:text-center",
    "footer-links":
      "flex flex-wrap gap-[clamp(1.5rem,4vw,2.5rem)] max-lg:justify-center",
    "footer-link":
      "font-nav text-[var(--theme-text-dim)] no-underline tracking-1px uppercase transition-all duration-300 border-b border-b-1px border-b-solid border-transparent hover:text-[var(--theme-accent)] hover:drop-shadow-[0_0_8px_var(--theme-accent-glow)] hover:border-b-[var(--theme-accent)] text-0.8rem",
    "footer-copyright":
      "font-nav text-0.75rem text-[var(--theme-text-dim)] opacity-70 max-lg:mx-auto",
    "footer-bottom":
      "flex flex-wrap items-center justify-between gap-8 border-t border-t-solid border-[rgba(255,255,255,0.03)] pt-8 max-lg:flex-col max-lg:gap-4",

    "branding-wrapper":
      "flex opacity-70 hover:opacity-100 transition-opacity duration-300 max-lg:mx-auto",
    "branding-link":
      "flex items-center gap-0 border-solid border-[var(--theme-accent-glow)] bg-[rgba(0,0,0,0.3)] px-1.5 py-0.5 no-underline transition-all duration-300 max-lg:mx-auto max-lg:w-fit",
    "branding-text":
      "font-header text-0.55rem tracking-1px color-[var(--theme-text-dim)] group-hover:color-[var(--theme-text-main)]",

    "bento-grid":
      "grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] auto-rows-min gap-[clamp(1rem,3vw,1.5rem)] my-8 lg:auto-rows-200px",
    "bento-item":
      "relative bg-[var(--theme-surface)] border border-solid border-[var(--theme-accent-glow)] p-[clamp(1rem,4vw,2rem)] flex flex-col justify-between no-underline transition-all duration-400 overflow-hidden hover:translate-y-[calc(-1*var(--ui-elevation))] hover:border-[var(--theme-accent)] hover:shadow-[0_var(--ui-elevation)_30px_rgba(0,0,0,0.5),0_0_20px_var(--theme-accent-glow)]",

    "admin-card":
      "bg-[var(--theme-surface)] border border-solid border-[var(--theme-accent-glow)] p-6 mb-4",
    "btn-primary":
      "bg-transparent text-[var(--theme-accent)] border border-solid border-[var(--theme-accent)] px-4 py-2 font-header cursor-pointer transition-all duration-300 hover:bg-[var(--theme-accent)] hover:text-[var(--theme-bg)] hover:shadow-[0_0_15px_var(--theme-accent)]",

    "admin-input":
      "w-full p-2 bg-[rgba(255,255,255,0.02)] border border-solid border-[rgba(255,255,255,0.05)] text-[var(--theme-text-main)] font-body focus:outline-none focus:bg-[rgba(255,255,255,0.05)] focus:border-transparent transition-all duration-300 [background-image:linear-gradient(to_bottom,var(--theme-accent-dim)_2px,transparent_2px),linear-gradient(to_right,var(--theme-accent-dim)_2px,transparent_2px),linear-gradient(to_bottom,var(--theme-accent-dim)_2px,transparent_2px),linear-gradient(to_left,var(--theme-accent-dim)_2px,transparent_2px),linear-gradient(to_top,var(--theme-accent-dim)_2px,transparent_2px),linear-gradient(to_right,var(--theme-accent-dim)_2px,transparent_2px),linear-gradient(to_top,var(--theme-accent-dim)_2px,transparent_2px),linear-gradient(to_left,var(--theme-accent-dim)_2px,transparent_2px)] [background-position:0_0,0_0,100%_0,100%_0,0_100%,0_100%,100%_100%,100%_100%] [background-size:15px_15px] [background-repeat:no-repeat] focus:[background-image:linear-gradient(to_bottom,var(--theme-accent)_2px,transparent_2px),linear-gradient(to_right,var(--theme-accent)_2px,transparent_2px),linear-gradient(to_bottom,var(--theme-accent)_2px,transparent_2px),linear-gradient(to_left,var(--theme-accent)_2px,transparent_2px),linear-gradient(to_top,var(--theme-accent)_2px,transparent_2px),linear-gradient(to_right,var(--theme-accent)_2px,transparent_2px),linear-gradient(to_top,var(--theme-accent)_2px,transparent_2px),linear-gradient(to_left,var(--theme-accent)_2px,transparent_2px)] focus:shadow-[0_0_15px_var(--theme-accent-dim)]",

    "admin-helper-text":
      "text-0.7rem text-[var(--theme-text-dim)] mt-2 mb-0 font-body",
    "toast-notification":
      "bg-[var(--theme-surface-solid)] border border-solid border-[var(--theme-accent-glow)] text-[var(--theme-text-main)] px-8 py-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] font-nav animate-slide-in-up-fade-out animate-fill-forwards pointer-events-none",

    "admin-action-btn":
      "w-full p-4 bg-transparent border-none text-[var(--theme-accent)] font-header cursor-pointer flex items-center justify-center gap-2 transition-colors duration-300 hover:bg-[var(--theme-accent)] hover:text-[var(--theme-bg)]",
    "admin-label":
      "block mb-2 font-nav text-sm tracking-widest text-[var(--theme-accent)] uppercase",
    "nav-item":
      "text-[var(--theme-text-dim)] no-underline font-nav text-sm p-2 border border-solid border-transparent transition-all duration-300 hover:text-[var(--theme-accent)] hover:border-[var(--theme-accent-glow)] hover:bg-[rgba(0,255,255,0.05)]",
    "nav-item-error":
      "text-[var(--color-error)] no-underline font-nav text-sm p-2 border border-solid border-transparent transition-all duration-300 hover:text-[var(--theme-text-main)] hover:border-[var(--color-error)] hover:bg-[rgba(255,68,68,0.1)]",
    "nav-item-success":
      "text-[var(--color-success)] no-underline font-nav text-sm p-2 border border-solid border-transparent transition-all duration-300 hover:text-[var(--theme-text-main)] hover:border-[var(--color-success)] hover:bg-[rgba(0,255,0,0.1)]",
    "nav-item-warning":
      "text-[var(--color-warning)] no-underline font-nav text-sm p-2 border border-solid border-transparent transition-all duration-300 hover:text-[var(--theme-text-main)] hover:border-[var(--color-warning)] hover:bg-[rgba(255,204,0,0.1)]",
    "nav-item-info":
      "text-[var(--color-info)] no-underline font-nav text-sm p-2 border border-solid border-transparent transition-all duration-300 hover:text-[var(--theme-text-main)] hover:border-[var(--color-info)] hover:bg-[rgba(0,204,255,0.1)]",
    "nav-item-active":
      "text-[var(--theme-accent)] border border-solid border-[var(--theme-accent-glow)] bg-[rgba(0,255,255,0.05)]",
    "btn-mini":
      "flex items-center justify-center min-w-100px h-32px px-3 text-0.7rem font-nav border border-solid transition-all duration-300 cursor-pointer bg-transparent uppercase tracking-1px",
    "standard-heading":
      "font-header tracking-widest uppercase m-0 text-[var(--theme-accent)]",

    // Content Elements
    "content-frame":
      "my-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-solid border-[var(--theme-accent-glow)] bg-[var(--theme-surface)] p-2 transition-all duration-300 ease",
    "content-img": "max-w-full h-auto block mx-auto",

    "image-stretched":
      "important-w-[calc(100%+4rem)] important-ml--8 important-mr--8 important-max-w-none important-border-l-none important-border-r-none important-rounded-0",
    "image-with-border":
      "important-border-2 important-border-solid important-border-[var(--theme-accent)]",
    "image-with-background":
      "bg-[rgba(0,0,0,0.5)] important-p-12 flex flex-col justify-center items-center",

    "admin-shell":
      "grid grid-cols-[250px_1fr] h-screen overflow-hidden bg-[var(--theme-bg)] text-[var(--theme-text-main)]",
    "admin-sidebar":
      "bg-[rgba(10,20,20,0.9)] border-r border-r-solid border-[var(--theme-accent-glow)] p-8 flex flex-col gap-4 h-full",
    "admin-content": "p-12 overflow-y-auto h-full",

    "modal-overlay":
      "fixed inset-0 bg-[rgba(0,0,0,0.85)] backdrop-blur-10px flex items-center justify-center z-[4000] opacity-0 pointer-events-none transition-opacity duration-300",
    "modal-content":
      "bg-[var(--theme-surface)] border border-solid border-[var(--theme-accent)] shadow-[0_0_30px_var(--theme-accent-glow)] w-full max-w-500px p-8 relative -translate-y-5 transition-transform duration-300",
    "modal-close":
      "absolute top-4 right-4 bg-transparent border-none text-[var(--theme-text-dim)] hover:text-[var(--theme-accent)] cursor-pointer font-header text-1.2rem transition-colors duration-300",
  },
  theme: {
    fontFamily: {
      header: "var(--font-header)",
      nav: "var(--font-nav)",
      body: "var(--font-body)",
      mono: "var(--font-mono)",
    },
    animation: {
      keyframes: {
        hologram:
          "{0%,100%{opacity:0.8;transform:scale(1) translateY(0)}50%{opacity:1;transform:scale(1.02) translateY(-2px);filter:brightness(1.2) drop-shadow(0 0 10px var(--theme-accent))}}",
        "slide-in-up-fade-out":
          "{0%{transform:translateY(100%);opacity:0}10%{transform:translateY(0);opacity:1}80%{transform:translateY(0);opacity:1}100%{transform:translateY(-20px);opacity:0;pointer-events:none}}",
      },
      durations: {
        hologram: "var(--ui-boot-speed)",
        "slide-in-up-fade-out": "3s",
      },
      timingFns: {
        hologram: "ease-in-out",
        "slide-in-up-fade-out": "ease",
      },
      counts: {
        hologram: "infinite",
        "slide-in-up-fade-out": "1",
      },
    },
  },
});
