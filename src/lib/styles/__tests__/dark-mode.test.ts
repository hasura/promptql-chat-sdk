/**
 * Test to verify dark mode CSS fix
 * This test ensures that the CSS media query conflict has been resolved
 */

import fs from "fs";
import path from "path";

describe("Dark Mode CSS Fix", () => {
  let cssContent: string;

  beforeAll(() => {
    // Read the actual CSS file
    const cssPath = path.join(__dirname, "../components.css");
    cssContent = fs.readFileSync(cssPath, "utf8");
  });

  it("should not have CSS media query for dark mode", () => {
    // Ensure there's no @media (prefers-color-scheme: dark) rule
    expect(cssContent).not.toContain("@media (prefers-color-scheme: dark)");
    expect(cssContent).not.toContain("prefers-color-scheme: dark");
  });

  it("should have light theme defaults in CSS", () => {
    // The CSS should have the light theme defaults
    expect(cssContent).toContain("--promptql-background: #ffffff");
    expect(cssContent).toContain("--promptql-text: #111827");
    expect(cssContent).toContain("--promptql-surface: #f9fafb");
    expect(cssContent).toContain("--promptql-text-secondary: #6b7280");
    expect(cssContent).toContain("--promptql-border: #e5e7eb");
  });

  it("should have comment explaining dark mode handling", () => {
    // Should have the comment explaining why media query was removed
    expect(cssContent).toContain("Dark mode is handled via JavaScript theme detection");
    expect(cssContent).toContain("applyThemeToElement()");
  });

  it("should still have CSS custom property references", () => {
    // CSS should still reference the custom properties that JavaScript will set
    expect(cssContent).toContain("var(--promptql-primary)");
    expect(cssContent).toContain("var(--promptql-border)");
    expect(cssContent).toContain("var(--promptql-text-secondary)");
    expect(cssContent).toContain("var(--promptql-error)");
    expect(cssContent).toContain("var(--promptql-success)");
  });

  it("should have base promptql-chat class with CSS custom properties", () => {
    // Should have the base class that defines the CSS custom properties
    expect(cssContent).toContain(".promptql-chat {");
    expect(cssContent).toContain("--promptql-primary:");
    expect(cssContent).toContain("--promptql-background:");
    expect(cssContent).toContain("--promptql-surface:");
    expect(cssContent).toContain("--promptql-text:");
  });
});
