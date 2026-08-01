#!/usr/bin/env node
/**
 * Vahtian vocabulary checker.
 *
 * The skills and the site each name states: found/gap, ok/no/nr, supports/
 * contrasts/unclear, pass/risk/fail. Some of those are the same idea wearing
 * different words, and some are genuinely different objects wearing the same
 * word. Nothing said which was which, so a rule written against one of them
 * silently failed to cover the others. `skill/VOCABULARY.md` names the objects;
 * this asserts, deterministically and without a model, that the files obey it.
 *
 * What it checks:
 *   1. Trust words. Doctrine is check / test / assess. `verifyChain`,
 *      `verifyAudit` and `verify()` are the named code exemptions.
 *   2. Readiness verdicts. Nothing in this house says a manuscript is ready,
 *      compliant, or passing.
 *   3. State sets. A file that defines a state set must say which OBJECT it
 *      rates, because that is the distinction the rules kept losing.
 *   4. The frozen support scale. Support ratings are match_status and
 *      human_support_rating; a new scale for the same object is drift.
 *   5. Anchors. Every definition VOCABULARY.md claims to govern must appear
 *      verbatim in the file it governs, so a definition cannot rot unnoticed.
 *
 * Usage:
 *   node .claude/evals/vocabulary.mjs           # check, exit non-zero on violation
 *   node .claude/evals/vocabulary.mjs --list    # show every state set found
 *   node .claude/evals/vocabulary.mjs --quiet   # violations only
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const LIST = args.has("--list");
const QUIET = args.has("--quiet");

/* ---------- what we scan ---------- */

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === ".git") continue;
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (e === "SKILL.md" || e === "VOCABULARY.md") out.push(p);
  }
  return out;
}

const skillFiles = [...walk(join(ROOT, "skill")), ...walk(join(ROOT, ".claude/skills"))];

/* ---------- 1. trust words ---------- */
// Doctrine: products record support, never truth. The hash-chain function names
// are the only exemption, and they are exempt as identifiers, not as prose.
const TRUST = /\b(verif(?:y|ies|ied|ication)|guarantee[sd]?|prove[sd]?|proof)\b/gi;
// Code identifiers are exempt as identifiers, not as prose.
const TRUST_EXEMPT = /verifyChain|verifyAudit|verify\(\)|`[^`]*verif[^`]*`|freeze\/verify\/audit|proof-of-concept/i;

/* USE vs MENTION.
 * A skill that forbids a word must contain the word. The first run of this
 * checker flagged 20 trust words and every one was a prohibition: rows in
 * brand-safety's table of banned phrases, and a `Never write "..."` whose
 * negation sat on the previous line. Counting those is not a strict check, it
 * is a broken one, and it would have trained everyone to ignore the output.
 * A match is a MENTION, not a use, when any of these hold. */
function isMention(line, prevLines, matchIndex) {
  // inside quotes: the file is naming the phrase, not asserting it
  const before = line.slice(0, matchIndex);
  const quotesBefore = (before.match(/"/g) || []).length;
  if (quotesBefore % 2 === 1) return true;
  // a table row listing phrases, which is how the banned-phrase tables are written
  if (/^\s*\|/.test(line) && /"/.test(line)) return true;
  // a prohibition anywhere in the sentence, which may have wrapped onto earlier lines
  const para = [...prevLines.slice(-2), line].join(" ");
  if (/\b(never|not|no|forbid|ban(?:ned)?|avoid|instead of|rather than|do not|don't|breaks?|overclaim)\b/i.test(para)) return true;
  return false;
}

/* SCOPE.
 * The doctrine governs what the products claim about research. It does not
 * govern an engineer's note that a command was checked, so "verified working
 * this session" in a build skill is not a violation. Shipped, agent-facing
 * skills under skill/ carry product claims; .claude/skills/ is internal
 * tooling and is checked only for quoted product copy. */
function isProductFacing(rel) { return rel.startsWith("skill/"); }

/* ---------- 2. readiness verdicts ---------- */
const READINESS = /\b(ready to submit|submission[- ]ready|publication[- ]ready|cleared for submission|is compliant|fully compliant)\b/gi;

/* ---------- 3. state sets, and the object each rates ---------- */
// A state set is a run of state words. The check is not that they exist, it is
// that the file says what they are ABOUT within a few lines of naming them.
const STATE_SETS = [
  { id: "support", words: ["supports", "contrasts", "not_relevant", "does_not_support"], object: "a claim against one cited source" },
  { id: "presence", words: ["addressed", "gap", "not run"], object: "an element of a manuscript" },
  { id: "resolution", words: ["resolves", "not resolvable", "mismatch"], object: "a reference against a register" },
  // cased: the recoverlite states are uppercase tokens. Lowercase "a twelve-page
  // pass" is an editing sweep, the third meaning of the word, and not a state.
  { id: "recovery", words: ["PASS", "RISK", "FAIL"], object: "a planned design before data", cased: true },
];
/* PASS is the token that collides: recoverlite rates a design, brand-safety gates
 * copy, and "a twelve-page pass" is an editing sweep. A file that gates copy is
 * declaring its object by saying so; these are the phrasings that count. */
const GATE_DECLARED = /\b(brand[- ]safety|copy|gate|verdict|review)\b/i;
const OBJECT_DECLARED = /\b(rates?|describes?|about|applies to|governs?|for)\b/i;

/* ---------- 4. the frozen support scale ---------- */
const FROZEN = ["match_status", "human_support_rating"];

/* ---------- run ---------- */

const violations = [];
const found = [];

function lines(text) { return text.split("\n"); }

for (const file of skillFiles) {
  const rel = relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const ls = lines(text);

  ls.forEach((line, i) => {
    const n = i + 1;

    // 1. trust words, in product-facing skills only, and only where used not mentioned
    if (isProductFacing(rel)) {
      for (const m of line.matchAll(TRUST)) {
        const ctx = line.slice(Math.max(0, m.index - 40), m.index + 40);
        if (TRUST_EXEMPT.test(ctx)) continue;
        if (isMention(line, ls.slice(0, i), m.index)) continue;
        violations.push({ file: rel, line: n, kind: "trust-word", detail: `"${m[0]}", doctrine is check / test / assess`, text: line.trim().slice(0, 110) });
      }
    }

    // 2. readiness verdicts, anywhere, same use/mention rule
    for (const m of line.matchAll(READINESS)) {
      if (isMention(line, ls.slice(0, i), m.index)) continue;
      violations.push({ file: rel, line: n, kind: "readiness-verdict", detail: `"${m[0]}"`, text: line.trim().slice(0, 110) });
    }
  });

  // 3. state sets: does the file say what the set is about?
  // VOCABULARY.md is where the objects are declared, so it is not a caller of them
  const isTheVocabulary = rel.endsWith("VOCABULARY.md");
  for (const set of STATE_SETS) {
    if (isTheVocabulary) break;
    const flags = set.cased ? "" : "i";
    const hits = set.words.filter((w) => new RegExp(`\\b${w.replace(/[_ ]/g, "[_ ]")}\\b`, flags).test(text));
    if (hits.length < 2) continue; // one word is a mention, two is a set
    // anchor on the line that names the MOST of the set, which is where it is defined,
    // not the first line that happens to mention one word of it
    let idx = -1, best = 0;
    ls.forEach((l, k) => {
      // a line that FORBIDS a state set is not a definition of one
      if (isMention(l, ls.slice(0, k), 0)) return;
      const c = hits.filter((w) => new RegExp(`\\b${w.replace(/[_ ]/g, "[_ ]")}\\b`, flags).test(l)).length;
      if (c > best) { best = c; idx = k; }
    });
    if (idx === -1) continue; // every occurrence was a prohibition
    const window = ls.slice(Math.max(0, idx - 3), idx + 6).join(" ");
    const declared = OBJECT_DECLARED.test(window) ||
      (set.id === "recovery" && GATE_DECLARED.test(window));
    found.push({ file: rel, set: set.id, hits: hits.join(" / "), declared });
    if (!declared) {
      violations.push({ file: rel, line: idx + 1, kind: "undeclared-object",
        detail: `uses the ${set.id} state set (${hits.join(", ")}) without saying it rates ${set.object}`,
        text: ls[idx]?.trim().slice(0, 110) ?? "" });
    }
  }

  // 4. a second scale for an object the frozen one already covers
  const usesSupportWords = /\bsupports\b/.test(text) && /\bcontrasts\b|\bdoes_not_support\b/.test(text);
  if (usesSupportWords && !FROZEN.some((f) => text.includes(f))) {
    violations.push({ file: rel, line: 0, kind: "unfrozen-support-scale",
      detail: "rates claim-to-source support without naming match_status / human_support_rating",
      text: "" });
  }
}

/* ---------- 5. anchors: VOCABULARY.md cannot describe a rule that has moved ---------- */
const vocabPath = join(ROOT, "skill", "VOCABULARY.md");
if (existsSync(vocabPath)) {
  const vocab = readFileSync(vocabPath, "utf8");
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  // Anchor lines look like:  <!-- anchor: <file> :: <verbatim text> -->
  for (const m of vocab.matchAll(/<!--\s*anchor:\s*(.+?)\s*::\s*([\s\S]+?)\s*-->/g)) {
    const [, target, phrase] = m;
    const tp = join(ROOT, target);
    if (!existsSync(tp)) {
      violations.push({ file: "skill/VOCABULARY.md", line: 0, kind: "anchor-missing-file", detail: `anchor points at ${target}, which does not exist`, text: "" });
      continue;
    }
    if (!norm(readFileSync(tp, "utf8")).includes(norm(phrase))) {
      violations.push({ file: "skill/VOCABULARY.md", line: 0, kind: "anchor-drifted",
        detail: `${target} no longer contains: "${norm(phrase).slice(0, 70)}…"`, text: "" });
    }
  }
} else {
  violations.push({ file: "skill/VOCABULARY.md", line: 0, kind: "missing", detail: "the vocabulary the skills are checked against does not exist", text: "" });
}

/* ---------- report ---------- */

if (LIST) {
  console.log(`state sets found across ${skillFiles.length} skill files\n`);
  for (const f of found) {
    console.log(`  ${f.declared ? "ok " : "!! "} ${f.file}`);
    console.log(`       ${f.set}: ${f.hits}${f.declared ? "" : "   <- object not declared"}`);
  }
  console.log("");
}

if (!QUIET) console.log(`scanned ${skillFiles.length} skill files`);

if (violations.length === 0) {
  console.log("vocabulary: clean");
  process.exit(0);
}

const byKind = {};
for (const v of violations) (byKind[v.kind] ??= []).push(v);
console.log(`\nvocabulary: ${violations.length} violation(s)\n`);
for (const [kind, vs] of Object.entries(byKind)) {
  console.log(`${kind} (${vs.length})`);
  for (const v of vs) {
    console.log(`  ${v.file}${v.line ? ":" + v.line : ""}  ${v.detail}`);
    if (v.text) console.log(`      ${v.text}`);
  }
  console.log("");
}
process.exit(1);
