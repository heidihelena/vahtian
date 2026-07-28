#!/usr/bin/env node
// Runs the live rules in /pattern-mirror/index.html over the calibration corpus.
//
// The rules are not a module: they live inside the page, because the page is the
// product and a second copy would drift from it. So this loads the page's own
// script, stubs the handful of DOM calls in its wiring, and calls analyse()
// directly. If the page stops parsing, this fails, which is the point.
//
//   node .claude/evals/pattern-mirror/run.mjs           # corpus, summary table
//   node .claude/evals/pattern-mirror/run.mjs --full    # every finding
//   node .claude/evals/pattern-mirror/run.mjs FILE:section
//
// Exit code 1 if a corpus file moves outside its recorded budget.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..", "..");
const page = join(repo, "pattern-mirror", "index.html");

function loadRules() {
  const html = readFileSync(page, "utf8");
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const src = blocks.find((b) => b.includes("var RULES="));
  if (!src) throw new Error("no rule block found in " + page);

  // The wiring at the bottom touches the DOM. Stub enough for it to run, then
  // hand analyse() back out through the sandbox.
  const el = new Proxy(
    { value: "", textContent: "", innerHTML: "", hidden: false },
    { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => ((t[k] = v), true) }
  );
  const sandbox = {
    document: { getElementById: () => el, createElement: () => el, body: el },
    matchMedia: () => ({ matches: false }),
    navigator: {},
    setTimeout,
    __out: {},
  };
  vm.createContext(sandbox);
  vm.runInContext(src.replace(/\}\)\(\);\s*$/, "__out.analyse=analyse;__out.buildList=buildList;})();"), sandbox, {
    filename: "pattern-mirror/index.html",
  });
  if (!sandbox.__out.analyse) throw new Error("analyse() not exported; the IIFE tail changed shape");
  return sandbox.__out;
}

// Section label per corpus file. The tool suppresses rules that do not apply to
// a section, so a file run under the wrong label is not a valid result.
const SECTIONS = {
  "abstract.txt": "abstract",
  "intro.txt": "introduction",
  "litrev.txt": "introduction",
  "disc_method.txt": "discussion",
  "disc_ineq.txt": "discussion",
  "clean-methods.txt": "methods",
  "article-learn.txt": "other",
};

// What the corpus is allowed to produce. A change that pushes a file past its
// budget is a rule change that needs a reason written into README.md, not a
// number quietly edited here. A budget may name the groups it covers: the Learn
// article is an essay, and the page says outright that the Evidence group
// over-fires on essays, so only Structural and Language are held to a number.
const BUDGET = {
  "abstract.txt": 0,
  "intro.txt": 1,
  "litrev.txt": 0,
  "disc_method.txt": 1,
  "disc_ineq.txt": 2,
  "clean-methods.txt": 0,
  "article-learn.txt": { groups: ["Structural", "Language"], max: 6 },
};

const { analyse } = loadRules();
const args = process.argv.slice(2);
const full = args.includes("--full");
const targets = args.filter((a) => !a.startsWith("--"));

let files;
if (targets.length) {
  files = targets.map((t) => {
    const [f, s] = t.split(":");
    return { path: f, name: basename(f), section: s || "other", budget: null };
  });
} else {
  files = readdirSync(join(here, "corpus"))
    .filter((f) => f.endsWith(".txt"))
    .sort()
    .map((f) => ({
      path: join(here, "corpus", f),
      name: f,
      section: SECTIONS[f] || "other",
      budget: BUDGET[f] ?? null,
    }));
}

let failed = 0;
const rows = [];
for (const f of files) {
  const res = analyse(readFileSync(f.path, "utf8"), f.section);
  const b = f.budget;
  const scoped = b && typeof b === "object" ? b.groups : null;
  const counted = scoped ? res.items.filter((i) => scoped.includes(i.group)) : res.items;
  const max = b === null || b === undefined ? null : typeof b === "object" ? b.max : b;
  const n = counted.length;
  const over = max !== null && n > max;
  if (over) failed++;
  rows.push({
    name: f.name,
    section: f.section,
    words: res.words,
    n,
    all: res.items.length,
    budget: max === null ? "—" : scoped ? `${max} (${scoped.join("+")})` : String(max),
    over,
  });
  if (full || over) {
    for (const it of res.items) {
      const anchor = it.s ? `P${it.p} S${it.s}` : `P${it.p}`;
      console.log(`\n  ${f.name} ${anchor}  ${it.name}${it.shown ? ` — ${it.shown}` : ""}`);
      console.log(`    ${it.sentence.slice(0, 160)}${it.sentence.length > 160 ? "…" : ""}`);
    }
    if (full && !res.items.length) console.log(`\n  ${f.name}: nothing`);
  }
}

console.log("\n| file | section | words | counted | all | budget |");
console.log("|---|---|---:|---:|---:|---:|");
for (const r of rows) {
  console.log(
    `| ${r.name} | ${r.section} | ${r.words} | ${r.n}${r.over ? " ⚠" : ""} | ${r.all} | ${r.budget} |`
  );
}

if (failed) {
  console.error(`\n${failed} file(s) over budget. Either the rule is wrong, or the budget and README.md need updating with the reason.`);
  process.exit(1);
}
console.log("\nok");
