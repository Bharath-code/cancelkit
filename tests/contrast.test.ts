import { expect, test } from "vitest";
import { contrastRatio, textOn } from "../src/lib/contrast";

test("dark brand colors get white text", () => {
  expect(textOn("#16181D")).toBe("#FFFFFF");
  expect(textOn("#4353FF")).toBe("#FFFFFF");
  // mid-tone green: white only reaches ~3.6:1 — dark ink contrasts harder
  expect(textOn("#0F9960")).toBe("#16181D");
});

test("light brand colors fall back to dark ink", () => {
  expect(textOn("#FFEB3B")).toBe("#16181D"); // yellow
  expect(textOn("#FFFFFF")).toBe("#16181D");
  expect(textOn("#7FDBFF")).toBe("#16181D"); // light blue
  expect(textOn("#fff")).toBe("#16181D"); // 3-digit hex
});

test("clearly light/dark brands clear WCAG AA 4.5:1", () => {
  for (const brand of ["#16181D", "#4353FF", "#FFEB3B", "#7FDBFF", "#FFFFFF"]) {
    expect(contrastRatio(textOn(brand), brand)).toBeGreaterThanOrEqual(4.5);
  }
});

test("mid-tone brands get the higher-contrast text of the two", () => {
  const brand = "#E91E63"; // neither option reaches 4.5
  const chosen = contrastRatio(textOn(brand), brand);
  expect(chosen).toBeGreaterThanOrEqual(contrastRatio("#FFFFFF", brand));
  expect(chosen).toBeGreaterThanOrEqual(
    Math.min(contrastRatio("#16181D", brand), chosen)
  );
});
