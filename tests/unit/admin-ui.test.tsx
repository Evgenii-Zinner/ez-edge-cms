import { describe, it, expect, beforeAll, spyOn } from "bun:test";
import {
  AdminCard,
  AdminHeader,
  FormGrid,
  FormColumn,
  AdminRange,
  AdminColor,
  DynamicTable,
  SortButtons,
  AdminDeleteButton,
  AdminField,
} from "@components/AdminUI";

describe("AdminUI Components", () => {
  // Silence console during tests to keep output clean
  beforeAll(() => {
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
    spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("AdminCard", () => {
    it("should render with title, description and children", () => {
      const card = AdminCard({
        title: "Test Card",
        description: "Test Desc",
        children: <span>Content</span>,
      });
      const html = card.toString();
      expect(html).toContain("Test Card");
      expect(html).toContain("Test Desc");
      expect(html).toContain("<span>Content</span>");
      expect(html).toContain("m-0"); // Default margin
    });

    it("should apply custom marginTop", () => {
      const card = AdminCard({
        title: "Title",
        marginTop: "mt-10",
        children: "Content",
      });
      expect(card.toString()).toContain("mt-10");
    });
  });

  describe("AdminHeader", () => {
    it("should render title and action children", () => {
      const header = AdminHeader({
        title: "Test Header",
        children: <button>ACTION</button>,
      });
      const html = header.toString();
      expect(html).toContain("Test Header");
      expect(html).toContain("<button>ACTION</button>");
    });

    it("should render optional description", () => {
      const header = AdminHeader({
        title: "Title",
        description: "Subtext",
      });
      expect(header.toString()).toContain("Subtext");
    });
  });

  describe("Layout Components", () => {
    it("FormGrid and FormColumn should render with correct classes", () => {
      const grid = FormGrid({
        children: FormColumn({ children: "Column Content" }),
        style: { color: "red" },
      });
      const html = grid.toString();
      expect(html).toContain("grid grid-cols-1 md:grid-cols-2 gap-8");
      expect(html).toContain("flex flex-col gap-6");
      expect(html).toContain("Column Content");
      expect(html).toContain('style="color:red"');
    });
  });

  describe("AdminRange", () => {
    it("should render with label, name and value", () => {
      const range = AdminRange({
        label: "Range",
        name: "test_range",
        min: 0,
        max: 100,
        value: 50,
        unit: "%",
      });
      const html = range.toString();
      expect(html).toContain("Range");
      expect(html).toContain('<span id="val-test_range">50</span>%');
      expect(html).toContain('value="50"');
      expect(html).toContain('id="inp-test_range"');
      // Hono JSX escapes single quotes to &#39;
      expect(html).toContain("oninput=\"document.getElementById(&#39;val-test_range&#39;).innerText = this.value\"");
    });

    it("should respect custom id and step", () => {
      const range = AdminRange({
        label: "L",
        name: "n",
        min: 0,
        max: 1,
        step: 0.1,
        value: 0.5,
        id: "custom-id",
      });
      const html = range.toString();
      expect(html).toContain('id="custom-id"');
      expect(html).toContain('step="0.1"');
    });
  });

  describe("AdminColor", () => {
    it("should render color picker and hex readout", () => {
      const color = AdminColor({
        label: "Color",
        name: "test_color",
        value: "#ff0000",
      });
      const html = color.toString();
      expect(html).toContain("Color");
      expect(html).toContain('value="#ff0000"');
      expect(html).toContain('<code class="text-0.7rem color-[var(--theme-text-dim)]">#ff0000</code>');
      expect(html).toContain('id="inp-test_color"');
    });
  });

  describe("DynamicTable", () => {
    it("should render table structure with items", () => {
      const table = DynamicTable({
        id: "test-table",
        headers: ["Column A"],
        items: ["Item 1"],
        addButtonLabel: "Add New Row",
        template: "<td>New</td>",
        renderRow: (item) => (
          <tr>
            {SortButtons()}
            <td>{item}</td>
            {AdminDeleteButton()}
          </tr>
        ),
      });
      const html = table.toString();
      expect(html).toContain("Column A");
      expect(html).toContain("Item 1");
      expect(html).toContain("Add New Row");
      expect(html).toContain('id="test-table-container"');
      expect(html).toContain("window.addDynamicRow");
      expect(html).toContain("window.moveDynamicRow");
      expect(html).toContain("▲"); // SortButtons
      expect(html).toContain("DELETE"); // AdminDeleteButton
    });
  });

  describe("AdminField", () => {
    it("should render text input by default", () => {
      const field = AdminField({ label: "Text", name: "text_field", value: "val" });
      const html = field.toString();
      expect(html).toContain("Text");
      expect(html).toContain('value="val"');
      expect(html).toContain('type="text"');
      expect(html).toContain('id="inp-text_field"');
    });

    it("should handle dot notation in names for IDs", () => {
      const field = AdminField({ label: "Nested", name: "seo.title", value: "T" });
      expect(field.toString()).toContain('id="inp-seo-title"');
    });

    it("should render textarea", () => {
      const field = AdminField({
        label: "Area",
        name: "area",
        value: "content",
        type: "textarea",
        rows: 10,
      });
      const html = field.toString();
      expect(html).toContain("Area");
      expect(html).toContain("content");
      expect(html).toContain("<textarea");
      expect(html).toContain('rows="10"');
    });

    it("should support email, password, and number types", () => {
      const email = AdminField({ label: "E", name: "e", type: "email" });
      expect(email.toString()).toContain('type="email"');

      const pass = AdminField({ label: "P", name: "p", type: "password" });
      expect(pass.toString()).toContain('type="password"');

      const num = AdminField({ label: "N", name: "n", type: "number" });
      expect(num.toString()).toContain('type="number"');
    });

    it("should render optional helper text", () => {
      const field = AdminField({
        label: "L",
        name: "n",
        helper: "Helper information",
      });
      expect(field.toString()).toContain("Helper information");
    });

    it("should respect attributes like required, placeholder, readonly, and autofocus", () => {
      const field = AdminField({
        label: "L",
        name: "n",
        required: true,
        placeholder: "Enter here",
        readonly: true,
        autofocus: true,
        minlength: 5,
        autocomplete: "off",
      });
      const html = field.toString();
      expect(html).toContain("required");
      expect(html).toContain('placeholder="Enter here"');
      expect(html).toContain("readonly");
      expect(html).toContain("autofocus");
      expect(html).toContain('minlength="5"');
      expect(html).toContain('autocomplete="off"');
    });
  });
});
