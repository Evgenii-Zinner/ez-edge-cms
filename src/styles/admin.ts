/**
 * @module AdminCSS
 * @description Standalone stylesheet for the EZ EDGE CMS Administrative HUD.
 * Completely isolates Admin UI styling from public site theme connectors and UnoCSS compilation.
 */

export const ADMIN_CSS = `
/* Admin Body & Reset */
body.admin-body {
  margin: 0;
  padding: 0;
  color-scheme: dark;
  background-color: var(--theme-bg, #050a0a);
  color: var(--theme-text-main, #e0f2f2);
  font-family: var(--font-body, "Roboto", sans-serif);
  overflow-x: hidden;
  min-height: 100vh;
}

body.admin-body h3 {
  font-family: var(--font-header, "Orbitron", sans-serif);
  font-size: 1.1rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--theme-accent, #00ffff);
  border-bottom: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
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
  background: var(--theme-accent, #00ffff);
  box-shadow: 0 0 10px var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
}

/* Background Visual Overlays */
.ui-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.scanlines {
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.07) 50%),
    linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02));
  background-size: 100% 4px, 3px 100%;
  opacity: 0.5;
  z-index: 10;
}

.dots {
  background-image: radial-gradient(circle, var(--theme-accent, #00ffff) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.05;
  z-index: 1;
}

.dots-interactive {
  opacity: 0.3;
  z-index: 2;
  background-image: radial-gradient(circle, var(--theme-accent, #00ffff) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(250px circle at var(--mouse-x, 0) var(--mouse-y, 0), black 0%, transparent 100%);
  -webkit-mask-image: radial-gradient(250px circle at var(--mouse-x, 0) var(--mouse-y, 0), black 0%, transparent 100%);
}

/* Admin Shell & Layout */
.admin-shell {
  display: grid;
  grid-template-columns: 250px 1fr;
  height: 100vh;
  overflow: hidden;
  background-color: var(--theme-bg, #050a0a);
  color: var(--theme-text-main, #e0f2f2);
  position: relative;
  z-index: 5;
}

.admin-auth-shell {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  background-color: var(--theme-bg, #050a0a);
  color: var(--theme-text-main, #e0f2f2);
  position: relative;
  z-index: 5;
  padding: 2rem;
  box-sizing: border-box;
}

.admin-sidebar {
  background: rgba(10, 20, 20, 0.9);
  border-right: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  box-sizing: border-box;
}

.admin-sidebar .logo {
  font-family: var(--font-header, "Orbitron", sans-serif);
  font-size: 1.4rem;
  letter-spacing: 2px;
  color: var(--theme-accent, #00ffff);
  margin-bottom: 2rem;
  padding-left: 0.5rem;
}

.admin-content {
  padding: 3rem;
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
}

.admin-header-actions {
  display: flex;
  gap: 1rem;
}

.admin-title {
  font-size: 1.8rem;
  font-family: var(--font-header, "Orbitron", sans-serif);
  letter-spacing: 2px;
  margin: 0;
  color: var(--theme-accent, #00ffff);
}

/* Admin Cards */
.admin-card {
  background: var(--theme-surface, rgba(10, 26, 26, 0.7));
  border: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
  border-radius: 0px !important;
  padding: 1.5rem;
  margin-bottom: 1rem;
  backdrop-filter: blur(8px);
  box-sizing: border-box;
  position: relative;
}

.admin-card:focus-within {
  z-index: 100;
}

.admin-card-header {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.15));
}

.admin-card-title {
  font-family: var(--font-header, "Orbitron", sans-serif);
  font-size: 1rem;
  letter-spacing: 1px;
  margin: 0 0 0.25rem 0;
  color: var(--theme-accent, #00ffff);
  text-transform: uppercase;
}

.admin-card-desc {
  font-size: 0.8rem;
  color: var(--theme-text-dim, #a0baba);
  margin: 0;
}

.admin-card-content {
  margin-top: 1rem;
  color: var(--theme-text-main, #e0f2f2);
}

/* Admin Table Resets & Alignment */
.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table tr,
tr.admin-table-row {
  border-bottom: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.1));
  transition: background-color 0.2s ease;
}

.admin-table tr:hover,
tr.admin-table-row:hover {
  background: rgba(0, 255, 255, 0.03);
}

.admin-table td,
.admin-table th,
tr > td {
  vertical-align: middle !important;
  padding: 1rem;
  box-sizing: border-box;
}

.admin-actions-td {
  text-align: right;
  vertical-align: middle !important;
  padding: 1rem;
  box-sizing: border-box;
}

.admin-actions-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  vertical-align: middle;
}

/* Custom Select Dropdown Z-Index Stacking */
.custom-select-container {
  position: relative;
  z-index: 1;
}

.custom-select-container:focus-within {
  z-index: 1000 !important;
}

.custom-select-menu {
  position: absolute;
  left: 0;
  top: 100%;
  margin-top: 0.25rem;
  width: 100%;
  background: var(--theme-surface-solid, #0a1a1a);
  border: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.3));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8);
  z-index: 1000 !important;
  max-height: 300px;
  overflow-y: auto;
}

/* Admin Form Controls & Inputs */
.admin-label {
  display: block;
  margin-bottom: 0.5rem;
  font-family: var(--font-nav, "Chakra Petch", sans-serif);
  font-size: 0.875rem;
  letter-spacing: 1px;
  color: var(--theme-accent, #00ffff);
  text-transform: uppercase;
}

.admin-input {
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--theme-text-main, #e0f2f2);
  font-family: var(--font-body, "Roboto", sans-serif);
  transition: all 0.3s ease;
  outline: none;
}

.admin-input:focus {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--theme-accent, #00ffff);
  box-shadow: 0 0 10px var(--theme-accent-dim, rgba(0, 255, 255, 0.1));
}

.admin-helper-text {
  font-size: 0.7rem;
  color: var(--theme-text-dim, #a0baba);
  margin-top: 0.5rem;
  margin-bottom: 0;
}

/* Action Buttons */
.btn-primary {
  background: transparent;
  color: var(--theme-accent, #00ffff);
  border: 1px solid var(--theme-accent, #00ffff);
  padding: 0.5rem 1rem;
  font-family: var(--font-header, "Orbitron", sans-serif);
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:hover {
  background: var(--theme-accent, #00ffff);
  color: var(--theme-bg, #050a0a);
  box-shadow: 0 0 15px var(--theme-accent, #00ffff);
}

.btn-mini {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 32px;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  font-family: var(--font-nav, "Chakra Petch", sans-serif);
  border: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.3));
  color: var(--theme-accent, #00ffff);
  background: transparent;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  text-decoration: none;
  box-sizing: border-box;
}

.btn-mini:hover {
  background: var(--theme-accent-glow, rgba(0, 255, 255, 0.15));
  border-color: var(--theme-accent, #00ffff);
}

.btn-mini.nav-item-info {
  border: 1px solid rgba(0, 204, 255, 0.4);
  color: var(--color-info, #00ccff);
  background: rgba(0, 204, 255, 0.05);
}
.btn-mini.nav-item-info:hover {
  border-color: var(--color-info, #00ccff);
  background: rgba(0, 204, 255, 0.15);
  box-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
}

.btn-mini.nav-item-warning {
  border: 1px solid rgba(255, 204, 0, 0.4);
  color: var(--color-warning, #ffcc00);
  background: rgba(255, 204, 0, 0.05);
}
.btn-mini.nav-item-warning:hover {
  border-color: var(--color-warning, #ffcc00);
  background: rgba(255, 204, 0, 0.15);
  box-shadow: 0 0 10px rgba(255, 204, 0, 0.3);
}

.btn-mini.nav-item-error {
  border: 1px solid rgba(255, 68, 68, 0.4);
  color: var(--color-error, #ff4444);
  background: rgba(255, 68, 68, 0.05);
}
.btn-mini.nav-item-error:hover {
  border-color: var(--color-error, #ff4444);
  background: rgba(255, 68, 68, 0.15);
  box-shadow: 0 0 10px rgba(255, 68, 68, 0.3);
}

.btn-mini.nav-item-success {
  border: 1px solid rgba(0, 255, 0, 0.4);
  color: var(--color-success, #00ff00);
  background: rgba(0, 255, 0, 0.05);
}
.btn-mini.nav-item-success:hover {
  border-color: var(--color-success, #00ff00);
  background: rgba(0, 255, 0, 0.15);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
}

.admin-action-btn {
  width: 100%;
  padding: 1rem;
  background: transparent;
  border: none;
  color: var(--theme-accent, #00ffff);
  font-family: var(--font-header, "Orbitron", sans-serif);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: colors 0.3s ease;
}

.admin-action-btn:hover {
  background: var(--theme-accent, #00ffff);
  color: var(--theme-bg, #050a0a);
}

/* Sidebar Navigation Items */
.nav-item {
  color: var(--theme-text-dim, #a0baba);
  text-decoration: none;
  font-family: var(--font-nav, "Chakra Petch", sans-serif);
  font-size: 0.875rem;
  padding: 0.5rem;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  display: block;
}

.nav-item:hover {
  color: var(--theme-accent, #00ffff);
  border-color: var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
  background: rgba(0, 255, 255, 0.05);
}

.nav-item-active {
  color: var(--theme-accent, #00ffff);
  border: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.3));
  background: rgba(0, 255, 255, 0.05);
}

.nav-item-error {
  color: var(--color-error, #ff4444);
  text-decoration: none;
  font-family: var(--font-nav, "Chakra Petch", sans-serif);
  padding: 0.5rem;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.nav-item-error:hover {
  color: var(--theme-text-main, #e0f2f2);
  border-color: var(--color-error, #ff4444);
  background: rgba(255, 68, 68, 0.1);
}

.nav-item-success {
  color: var(--color-success, #00ff00);
  text-decoration: none;
  font-family: var(--font-nav, "Chakra Petch", sans-serif);
  padding: 0.5rem;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.nav-item-success:hover {
  color: var(--theme-text-main, #e0f2f2);
  border-color: var(--color-success, #00ff00);
  background: rgba(0, 255, 0, 0.1);
}

.nav-item-warning {
  color: var(--color-warning, #ffcc00);
  text-decoration: none;
  font-family: var(--font-nav, "Chakra Petch", sans-serif);
  padding: 0.5rem;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.nav-item-warning:hover {
  color: var(--theme-text-main, #e0f2f2);
  border-color: var(--color-warning, #ffcc00);
  background: rgba(255, 204, 0, 0.1);
}

.nav-item-info {
  color: var(--color-info, #00ccff);
  text-decoration: none;
  font-family: var(--font-nav, "Chakra Petch", sans-serif);
  padding: 0.5rem;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.nav-item-info:hover {
  color: var(--theme-text-main, #e0f2f2);
  border-color: var(--color-info, #00ccff);
  background: rgba(0, 204, 255, 0.1);
}

/* Modals & Toast Notifications */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.modal-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.modal-content {
  background: var(--theme-surface, rgba(10, 26, 26, 0.7));
  border: 1px solid var(--theme-accent, #00ffff);
  box-shadow: 0 0 30px var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
  width: 100%;
  max-width: 500px;
  padding: 2rem;
  position: relative;
  transform: translateY(-20px);
  transition: transform 0.3s ease;
}

.modal-overlay.open .modal-content {
  transform: translateY(0);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--theme-text-dim, #a0baba);
  cursor: pointer;
  font-family: var(--font-header, "Orbitron", sans-serif);
  font-size: 1.2rem;
  transition: color 0.3s ease;
}

.modal-close:hover {
  color: var(--theme-accent, #00ffff);
}

.toast-notification {
  background: var(--theme-surface-solid, #0a1a1a);
  border: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
  color: var(--theme-text-main, #e0f2f2);
  padding: 1rem 2rem;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
  font-family: var(--font-nav, "Chakra Petch", sans-serif);
  pointer-events: none;
}

/* Custom Radio & Checkbox Inputs */
input[type="radio"] {
  appearance: none;
  width: 1.2rem;
  height: 1.2rem;
  border: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
  border-radius: 50%;
  outline: none;
  cursor: pointer;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
  transition: all 0.3s;
  position: relative;
  background: var(--theme-surface, rgba(10, 26, 26, 0.7));
  margin: 0;
  vertical-align: middle;
}

input[type="radio"]:checked {
  border-color: var(--theme-accent, #00ffff);
  box-shadow: 0 0 10px var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
}

input[type="radio"]:checked::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--theme-accent, #00ffff);
  box-shadow: 0 0 8px var(--theme-accent, #00ffff);
}

input[type="checkbox"] {
  appearance: none;
  width: 1.2rem;
  height: 1.2rem;
  border: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
  transition: all 0.3s;
  position: relative;
  background: var(--theme-surface, rgba(10, 26, 26, 0.7));
  margin: 0;
  vertical-align: middle;
}

input[type="checkbox"]:checked {
  border-color: var(--theme-accent, #00ffff);
  box-shadow: 0 0 10px var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
}

input[type="checkbox"]:checked::after {
  content: "✓";
  position: absolute;
  top: 0;
  left: 0;
  color: var(--theme-bg, #050a0a);
  background: var(--theme-accent, #00ffff);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: bold;
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-runnable-track {
  background: rgba(0, 0, 0, 0.5);
  height: 4px;
  border-radius: 2px;
  border: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  height: 16px;
  width: 16px;
  background: var(--theme-bg, #050a0a);
  border: 2px solid var(--theme-accent, #00ffff);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
  margin-top: -7px;
  transition: transform 0.1s;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background: var(--theme-accent, #00ffff);
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--theme-bg, #050a0a);
}

::-webkit-scrollbar-thumb {
  background: var(--theme-accent-glow, rgba(0, 255, 255, 0.2));
  border-radius: 4px;
  border: 1px solid var(--theme-surface, rgba(10, 26, 26, 0.7));
}

::-webkit-scrollbar-thumb:hover {
  background: var(--theme-accent, #00ffff);
}

/* Futuristic Cyberpunk Select & Option Styling */
select.admin-input,
.admin-card select,
#modal-block-fields select {
  appearance: none;
  -webkit-appearance: none;
  background-color: #090d16;
  color: var(--theme-text-main, #f8fafc);
  border: 1px solid var(--theme-accent-glow, rgba(0, 255, 255, 0.3));
  border-radius: 0px;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  font-family: var(--font-mono, monospace);
  font-size: 0.9rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2300ffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
  cursor: pointer;
}

select.admin-input:focus,
.admin-card select:focus,
#modal-block-fields select:focus {
  border-color: var(--theme-accent, #00ffff);
  box-shadow: 0 0 12px var(--theme-accent-glow, rgba(0, 255, 255, 0.4));
  outline: none;
}

select.admin-input option,
.admin-card select option,
#modal-block-fields select option {
  background-color: #090d16;
  color: #f8fafc;
  padding: 0.75rem 1rem;
  font-family: var(--font-mono, monospace);
}

select.admin-input option:hover,
select.admin-input option:focus,
select.admin-input option:checked,
.admin-card select option:checked {
  background-color: var(--theme-accent, #00ffff) !important;
  color: #050a0a !important;
}
`;
