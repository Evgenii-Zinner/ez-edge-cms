import { describe, it, expect } from "bun:test";
import {
  AdminCard,
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
  it("AdminCard should render correctly", () => {
    const card = AdminCard({
      title: "Test Card",
      description: "Test Desc",
      children: "Content",
    });
    const html = card.toString();
    expect(html).toContain("Test Card");
    expect(html).toContain("Test Desc");
    expect(html).toContain("Content");
  });

  it("FormGrid and FormColumn should render correctly", () => {
    const grid = FormGrid({
      children: FormColumn({ children: "Column Content" }),
    });
    const html = grid.toString();
    expect(html).toContain("display:grid");
    expect(html).toContain("Column Content");
  });

  it("AdminRange should render correctly", () => {
    const range = AdminRange({
      label: "Range",
      name: "test",
      min: 0,
      max: 100,
      value: 50,
    });
    const html = range.toString();
    expect(html).toContain("Range");
    expect(html).toContain('value="50"');
    expect(html).toContain('id="inp-test"');
  });

  it("AdminColor should render correctly", () => {
    const color = AdminColor({
      label: "Color",
      name: "test",
      value: "#ff0000",
    });
    const html = color.toString();
    expect(html).toContain("Color");
    expect(html).toContain('value="#ff0000"');
  });

  it("DynamicTable and its helpers should render correctly", () => {
    const table = DynamicTable({
      id: "table",
      headers: ["H1"],
      items: ["item1"],
      addButtonLabel: "Add",
      template: "<td></td>",
      renderRow: (item) => (
        <tr>
          {SortButtons()}
          <td>{item}</td>
          {AdminDeleteButton()}
        </tr>
      ),
    });
    const html = table.toString();
    expect(html).toContain("H1");
    expect(html).toContain("item1");
    expect(html).toContain("Add");
    expect(html).toContain("▲"); // Sort button
    expect(html).toContain("DELETE"); // Delete button
  });

  it("AdminField should render text input", () => {
    const field = AdminField({ label: "Text", name: "text", value: "val" });
    const html = field.toString();
    expect(html).toContain("Text");
    expect(html).toContain('value="val"');
    expect(html).toContain('type="text"');
  });

  it("AdminField should render textarea", () => {
    const field = AdminField({
      label: "Area",
      name: "area",
      value: "content",
      type: "textarea",
    });
    const html = field.toString();
    expect(html).toContain("Area");
    expect(html).toContain("content");
    expect(html).toContain("<textarea");
  });
});
