#!/usr/bin/env node
/**
 * Vahtian copy-skill regression harness.
 *
 * The corpus in copy/cases/ is a held-out record of copy that was actually
 * caught — by the founder, by an audit, or by the canonical rule tables. Each
 * case names the rule that caught it and pins a verbatim `anchor` from that
 * skill's SKILL.md. This runner asserts, deterministically and without a model:
 *
 *   1. every case is well formed and uniquely identified
 *   2. the rule that caught it STILL EXISTS in the skill (the regression gate:
 *      you cannot silently delete a rule that a real failure paid for)
 *   3. for regex-detectable cases, the pattern still fires on the failing
 *      snippet and stays quiet on the shipped replacement and on PASS copy
 *
 * What it deliberately does NOT do: judge live site copy, or judge the cases
 * that need reading (`detector: judgement`). Those are listed by `--judgement`
 * for a skill-driven pass. The corpus is the reference; the skill under test is
 * never the thing that scores it.
 *
 * Usage:
 *   node .claude/evals/run.mjs              # verify the corpus, exit non-zero on regression
 *   node .claude/evals/run.mjs --judgement  # list the cases a human/agent must read
 *   node .claude/evals/run.mjs --quiet       # errors only
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CASE_DIR = join(HERE, "copy", "cases");
const SKILL_DIR = join(HERE, "..", "skills");

const REQUIRED = ["id", "verdict", "skill", "rule", "anchor", "detector", "source", "caught_by", "date"];
const VERDICTS = new Set(["PASS", "FAIL"]);
const DETECTORS = new Set(["regex", "judgement"]);
const CAUGHT_BY = new Set(["founder", "audit", "review", "ci", "rule-table"]);

const args = new Set(process.argv.slice(2));
const quiet = args.has("--quiet");
const ci = !!process.env.GITHUB_ACTIONS;

let fail = 0;
const err = (m) => { fail++; console.error(ci ? `::error::${m}` : `FAIL  ${m}`); };
const note = (m) => { if (!quiet) console.log(m); };

/** Front-matter + `## Section` body. Flat `key: value`; split on the first colon only. */
function parseCase(file) {
  const raw = readFileSync(join(CASE_DIR, file), "utf8");
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!m) return { file, error: "no front-matter block" };
  const meta = {};
  for (const line of m[1].split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const i = line.indexOf(":");
    if (i < 0) return { file, error: `front-matter line is not key: value → ${line}` };
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const sections = {};
  const re = /^## (.+)$/gm;
  const heads = [...m[2].matchAll(re)];
  heads.forEach((h, n) => {
    const start = h.index + h[0].length;
    const end = n + 1 < heads.length ? heads[n + 1].index : m[2].length;
    sections[h[1].trim().toLowerCase()] = m[2].slice(start, end).trim();
  });
  return { file, meta, sections };
}

/** Collapse whitespace so an anchor survives re-wrapping a hard-wrapped paragraph. */
const flat = (s) => s.replace(/\s+/g, " ").trim();

const skillCache = new Map();
function skillText(name) {
  if (!skillCache.has(name)) {
    const p = join(SKILL_DIR, name, "SKILL.md");
    skillCache.set(name, existsSync(p) ? flat(readFileSync(p, "utf8")) : null);
  }
  return skillCache.get(name);
}

if (!existsSync(CASE_DIR)) { console.error(`no case directory at ${CASE_DIR}`); process.exit(2); }
const files = readdirSync(CASE_DIR).filter((f) => f.endsWith(".md")).sort();
if (!files.length) { console.error("corpus is empty"); process.exit(2); }

const seenIds = new Map();
const seenPatterns = new Map();
const paired = new Set();
const judgement = [];
const verdicts = [];
const bySkill = new Map();
let checkedRegex = 0;

for (const file of files) {
  const c = parseCase(file);
  if (c.error) { err(`${file}: ${c.error}`); continue; }
  const { meta, sections } = c;
  const at = `${file}`;

  for (const k of REQUIRED) if (!meta[k]) err(`${at}: missing front-matter field \`${k}\``);
  if (!meta.id) continue;

  if (meta.id !== basename(file, ".md")) err(`${at}: id \`${meta.id}\` does not match filename`);
  if (seenIds.has(meta.id)) err(`${at}: duplicate id \`${meta.id}\` (also ${seenIds.get(meta.id)})`);
  seenIds.set(meta.id, file);

  if (meta.verdict && !VERDICTS.has(meta.verdict)) err(`${at}: verdict must be PASS or FAIL, got \`${meta.verdict}\``);
  if (meta.detector && !DETECTORS.has(meta.detector)) err(`${at}: detector must be regex or judgement, got \`${meta.detector}\``);
  if (meta.caught_by && !CAUGHT_BY.has(meta.caught_by)) err(`${at}: caught_by must be one of ${[...CAUGHT_BY].join(", ")}`);
  if (meta.date && !/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) err(`${at}: date must be ISO-8601 (YYYY-MM-DD)`);

  // The regression gate: the rule that caught this must still be in the skill.
  const text = skillText(meta.skill);
  if (text === null) err(`${at}: skill \`${meta.skill}\` has no SKILL.md`);
  else if (meta.anchor && !text.includes(flat(meta.anchor))) {
    err(`${at}: rule anchor no longer present in ${meta.skill}/SKILL.md — a real failure ` +
        `(${meta.caught_by}, ${meta.date}) was caught by this rule. Restore it, or retire the ` +
        `case in the same commit with a reason.\n         anchor: ${meta.anchor}`);
  }
  if (meta.skill) bySkill.set(meta.skill, (bySkill.get(meta.skill) || 0) + 1);
  if (VERDICTS.has(meta.verdict)) verdicts.push(meta.verdict);

  const snippet = sections["snippet"];
  const replacement = sections["shipped replacement"];
  if (!snippet) err(`${at}: missing \`## Snippet\` section`);
  if (meta.verdict === "FAIL" && !replacement) err(`${at}: FAIL case needs a \`## Shipped replacement\` section`);
  if (meta.verdict === "PASS" && replacement) err(`${at}: PASS case must not carry a \`## Shipped replacement\``);
  if (!sections["why"]) err(`${at}: missing \`## Why\` section`);

  if (meta.detector === "judgement") {
    if (meta.pattern) err(`${at}: judgement case must not declare a \`pattern\``);
    judgement.push(meta);
    continue;
  }
  if (meta.detector !== "regex") continue;
  if (!meta.pattern) { err(`${at}: regex case needs a \`pattern\``); continue; }

  // A pattern shared by a FAIL and a PASS case is the intended shape: the pair
  // pins both edges of one rule. Two cases with the same pattern AND the same
  // verdict is redundancy worth reporting.
  const prev = seenPatterns.get(meta.pattern);
  if (prev && prev.verdict === meta.verdict) note(`  note  ${at}: pattern duplicates ${prev.id} at the same verdict`);
  if (!prev) seenPatterns.set(meta.pattern, { id: meta.id, verdict: meta.verdict });
  else if (prev.verdict !== meta.verdict) paired.add(meta.pattern);

  let re;
  try { re = new RegExp(meta.pattern, meta.flags || "i"); }
  catch (e) { err(`${at}: pattern does not compile — ${e.message}`); continue; }
  checkedRegex++;

  if (!snippet) continue;
  const hits = re.test(snippet);
  if (meta.verdict === "FAIL" && !hits) {
    err(`${at}: pattern no longer matches the failing snippet — the detector has drifted off the ` +
        `tell it was written for.\n         pattern: ${meta.pattern}`);
  }
  if (meta.verdict === "PASS" && hits) {
    err(`${at}: pattern fires on copy that must PASS — this rule now over-triggers.\n` +
        `         pattern: ${meta.pattern}`);
  }
  if (meta.verdict === "FAIL" && replacement && re.test(replacement)) {
    err(`${at}: the shipped replacement still matches the pattern — the fix did not remove the tell.`);
  }
}

if (args.has("--judgement")) {
  console.log(`\n${judgement.length} case(s) need reading — no deterministic detector:\n`);
  for (const m of judgement) {
    console.log(`  ${m.verdict.padEnd(4)} ${m.id}`);
    console.log(`       ${m.skill} · ${m.rule}`);
    console.log(`       caught by ${m.caught_by}, ${m.date} (${m.source})\n`);
  }
  console.log("Run the owning skill against each snippet and confirm it reaches the recorded verdict.\n");
}

if (!quiet) {
  const cov = [...bySkill.entries()].map(([s, n]) => `${s}: ${n}`).join(" · ");
  const fails = verdicts.filter((v) => v === "FAIL").length;
  note(`\n${files.length} cases · ${fails} must be flagged · ${verdicts.length - fails} must not`);
  note(`${checkedRegex} checked by regex · ${judgement.length} need reading`);
  note(`coverage — ${cov}`);
  note(`${paired.size} rule(s) pinned at both edges by a FAIL/PASS pair`);
  note(`${seenIds.size} unique ids · ${skillCache.size} skills under test`);
}

if (fail) {
  console.error(`\n${fail} corpus regression(s). A skill edit that removes a rule a real failure paid for is a regression, not a simplification.`);
  process.exit(1);
}
note("\nOK — every rule that caught a real failure is still in place.");
