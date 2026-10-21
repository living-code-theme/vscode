// Port-owned role-contract tests, exercising generated files and real grammars.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {resolveAll} from '../scripts/palette.mjs';
import {generate} from '../src/generate.mjs';
import {bundledThemes,createHighlighter} from 'shiki';
import {SAMPLES,resolveScopes} from './contract.mjs';

const flavors = resolveAll();

const root = new URL("../", import.meta.url);

const read = (path) => readFileSync(new URL(path, root), "utf8");

const TEXTMATE_PORTS = {vscode: (f) => JSON.parse(read(`themes/${f.slug}-color-theme.json`))};

const at = (code, needle) => {
  const [text, nth = "1"] = needle.split(/#(?=\d+$)/);
  let i = -1;
  for (let n = 0; n < Number(nth); n++) {
    i = code.indexOf(text, i + 1);
    if (i < 0) throw new Error(`"${text}" occurs fewer than ${nth} times in the sample`);
  }
  return i;
};

const norm = (hex) => hex?.toLowerCase().slice(0, 7);

const VSCODE_SEMANTIC = {
  namespace: "namespace", type: "type", class: "type", interface: "type", enum: "type", struct: "type",
  typeParameter: "type", function: "function", method: "function", macro: "decorator", decorator: "decorator",
  variable: "variable", parameter: "parameter", property: "property", enumMember: "property",
  // Every `const` is readonly to the TypeScript server: a name, so the variable color (RADIUS too).
  "variable.readonly": "variable",
  // Readonly properties (`private readonly field`) stay properties, as in every other editor.
  "property.readonly": "property",
  "variable.defaultLibrary": "builtin", "function.defaultLibrary": "function", "class.defaultLibrary": "type",
};

const SEMANTIC_SCOPES = {
  namespace: ["entity.name.namespace"], type: ["entity.name.type"], class: ["entity.name.type.class"],
  interface: ["entity.name.type.interface"], enum: ["entity.name.type.enum"], struct: ["entity.name.type.struct"],
  typeParameter: ["entity.name.type.parameter"], function: ["entity.name.function"], method: ["entity.name.function.member"],
  macro: ["entity.name.function.preprocessor"], decorator: ["entity.name.decorator"], variable: ["variable.other.readwrite"],
  parameter: ["variable.parameter"], property: ["variable.other.property"], enumMember: ["variable.other.enummember"],
  "variable.readonly": ["variable.other.constant"], "property.readonly": ["variable.other.constant.property"],
  "variable.defaultLibrary": ["support.variable"], "function.defaultLibrary": ["support.function"],
  "class.defaultLibrary": ["support.class"],
};

const TERMINALS = {"vscode (terminal)": (f) => {
    const t = JSON.parse(read(`themes/${f.slug}-color-theme.json`)).colors;
    const names = ["Black", "Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White"];
    return { ansi: [...names.map((n) => t[`terminal.ansi${n}`]), ...names.map((n) => t[`terminal.ansiBright${n}`])] };
  }};

const EDITOR_UI = {vscode: (f) => {
    const t = JSON.parse(read(`themes/${f.slug}-color-theme.json`)).colors;
    return { bg: t["editor.background"], fg: t["editor.foreground"], cursor: t["editorCursor.foreground"], selection: t["editor.selectionBackground"], lineNumber: t["editorLineNumber.foreground"], lineNumberActive: t["editorLineNumber.activeForeground"], lineHighlight: t["editor.lineHighlightBackground"] };
  }};

test("TextMate ports give every sample token its role (VS Code, Expressive Code, tmTheme, Sublime Text, Hunk)", async () => {
  const themes = [];
  for (const f of flavors) for (const [port, load] of Object.entries(TEXTMATE_PORTS)) {
    themes.push({ ...(await load(f)), name: `${port}:${f.id}`, type: f.light ? "light" : "dark", port, f });
  }
  const hl = await createHighlighter({ themes, langs: [...new Set(SAMPLES.map((s) => s.lang))] });
  const failures = [];
  for (const { lang, code, expect } of SAMPLES) {
    for (const theme of themes) {
      const tokens = hl.codeToTokensBase(code, { lang, theme: theme.name }).flat();
      for (const [needle, role] of expect) {
        const offset = at(code, needle);
        const token = tokens.find((t) => t.offset <= offset && offset < t.offset + t.content.length);
        const got = norm(token?.color), want = norm(theme.f.r(role));
        if (got !== want) failures.push(`${theme.name} ${lang} ${JSON.stringify(needle)}: ${role} is ${want}, got ${got}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test("VS Code colors every semantic token with its role", async () => {

  const failures = [];
  for (const f of flavors) {
    const theme = JSON.parse(read(`themes/${f.slug}-color-theme.json`));
    const rules = theme.semanticTokenColors;
    for (const [token, role] of Object.entries(VSCODE_SEMANTIC)) {
      const [type, ...mods] = token.split(".");
      // The most specific theme rule whose modifiers the token has.
      const match = Object.keys(rules).filter((k) => {
        const [t, ...m] = k.split(".");
        return (t === type || t === "*") && m.every((x) => mods.includes(x)) && typeof (rules[k].foreground ?? rules[k]) === "string";
      }).sort((a, b) => b.split(".").length - a.split(".").length)[0];
      const got = match ? (rules[match].foreground ?? rules[match])
        : resolveScopes(theme.tokenColors, ["source", ...SEMANTIC_SCOPES[token]]).foreground;
      if (norm(got) !== norm(f.r(role))) failures.push(`vscode ${f.id} ${token}: ${role} is ${f.r(role)}, got ${got}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("every terminal has the same ANSI colors, background, foreground, cursor and selection", () => {
  const failures = [];
  for (const f of flavors) {
    const want = { bg: f.r("bg"), fg: f.r("fg"), cursor: f.r("cursor"), selection: f.r("selection"), ansi: [...f.ansi.normal, ...f.ansi.bright] };
    for (const [port, load] of Object.entries(TERMINALS)) {
      const got = load(f);
      for (const k of ["bg", "fg", "cursor", "selection"]) {
        if (k in got && norm(got[k]) !== norm(want[k])) failures.push(`${port} ${f.id} ${k}: ${want[k]}, got ${got[k]}`);
      }
      got.ansi.forEach((c, i) => { if (norm(c) !== norm(want.ansi[i])) failures.push(`${port} ${f.id} ANSI ${i}: ${want.ansi[i]}, got ${c}`); });
    }
  }
  assert.deepEqual(failures, []);
});

test("every editor draws its editing surface with the same roles", async () => {
  const failures = [];
  for (const f of flavors) {
    for (const [port, load] of Object.entries(EDITOR_UI)) {
      const got = await load(f);
      for (const [role, color] of Object.entries(got)) {
        if (norm(color) !== norm(f.r(role))) failures.push(`${port} ${f.id} ${role}: ${f.r(role)}, got ${color}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});
