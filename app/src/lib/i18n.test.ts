import { describe, it, expect } from "vitest";
import { t } from "./i18n";

const pt = t("pt");
const en = t("en");

type Bag = Record<string, unknown>;

// Walks both dictionaries in parallel and collects every leaf path plus its
// kind, so a key that exists in one language but not the other — or a function
// that takes two args in PT and one in EN — fails loudly instead of rendering
// "undefined" to whichever person happens to switch languages.
function describeShape(bag: Bag, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(bag)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "function") {
      out.set(path, `function/${value.length}`);
    } else if (Array.isArray(value)) {
      out.set(path, `array/${value.length}`);
    } else if (value && typeof value === "object") {
      for (const [p, k] of describeShape(value as Bag, path)) out.set(p, k);
    } else {
      out.set(path, typeof value);
    }
  }
  return out;
}

describe("i18n dictionaries stay in sync", () => {
  const ptShape = describeShape(pt as unknown as Bag);
  const enShape = describeShape(en as unknown as Bag);

  it("has the same set of keys in both languages", () => {
    const missingInEn = [...ptShape.keys()].filter((k) => !enShape.has(k));
    const missingInPt = [...enShape.keys()].filter((k) => !ptShape.has(k));
    expect(missingInEn, "keys present in pt but missing from en").toEqual([]);
    expect(missingInPt, "keys present in en but missing from pt").toEqual([]);
  });

  it("has the same kind and arity for every key", () => {
    const mismatched = [...ptShape.entries()]
      .filter(([k, kind]) => enShape.has(k) && enShape.get(k) !== kind)
      .map(([k, kind]) => `${k}: pt=${kind} en=${enShape.get(k)}`);
    expect(mismatched).toEqual([]);
  });

  it("never renders an empty string", () => {
    const empties: string[] = [];
    for (const [path, kind] of ptShape) {
      if (kind !== "string") continue;
      const read = (bag: Bag, p: string) =>
        p.split(".").reduce<unknown>((acc, part) => (acc as Bag)?.[part], bag);
      if (!String(read(pt as unknown as Bag, path) ?? "").trim()) empties.push(`pt.${path}`);
      if (!String(read(en as unknown as Bag, path) ?? "").trim()) empties.push(`en.${path}`);
    }
    expect(empties).toEqual([]);
  });

  // Keys whose parameter selects a branch instead of being printed. These
  // legitimately don't contain their argument in the output.
  const BRANCHING_KEYS = new Set(["amount_placeholder"]);

  it("interpolates every argument a templated key is given, in both languages", () => {
    // A function key that ignores its parameter silently drops the number the
    // caller meant to show — e.g. an EN string that forgot its ${pct}.
    const offenders: string[] = [];
    for (const [path, kind] of ptShape) {
      if (!kind.startsWith("function/")) continue;
      if (BRANCHING_KEYS.has(path)) continue;
      const arity = Number(kind.split("/")[1]);
      if (arity === 0) continue;
      const read = (bag: Bag, p: string) =>
        p.split(".").reduce<unknown>((acc, part) => (acc as Bag)?.[part], bag);
      // Distinctive values that would be obvious in the output if interpolated.
      const args = Array.from({ length: arity }, (_, i) => 90000 + i);
      for (const [langName, bag] of [["pt", pt], ["en", en]] as const) {
        const fn = read(bag as unknown as Bag, path) as (...a: unknown[]) => string;
        const rendered = String(fn(...args));
        for (const arg of args) {
          if (!rendered.includes(String(arg))) {
            offenders.push(`${langName}.${path} drops arg ${arg} -> "${rendered}"`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
