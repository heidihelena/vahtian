// Fixture-driven test of /reference-check/.
//
// Loads the page's own script — there is no second copy of the logic to drift
// from the product — stubs fetch with recorded registry shapes, and asserts on
// the rows the classifier produces. Every case here is a bug that was reported
// against a real reference list, so a rule tidied away fails the run.
//
//   node .claude/evals/reference-check/run.mjs
//
// The fixtures are recorded shapes, not live calls: the test must pass offline
// and must not depend on a registry being up or a record being unchanged.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const page = join(here, "..", "..", "..", "reference-check", "index.html");
const html = readFileSync(page, "utf8");
const src = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1]).find((s) => s && s.includes("function classify"));

// ---- recorded registry responses -------------------------------------------
const CROSSREF = {
  // legacy AMS DOI with angle brackets, decoded form
  "10.1175/1520-0469(1963)020<0130:DNF>2.0.CO;2": {
    title: ["Deterministic Nonperiodic Flow"],
    author: [{ family: "Lorenz" }],
    "container-title": ["Journal of the Atmospheric Sciences"],
    "short-container-title": ["J. Atmos. Sci."],
    issued: { "date-parts": [[1963]] }, type: "journal-article",
  },
  // ampersand journal, as Crossref actually stores it
  "10.1016/j.tree.2019.03.005": {
    title: ["Ecological effects of &amp; nothing in particular"],
    author: [{ family: "Andersson" }],
    "container-title": ["Trends in Ecology &amp; Evolution"],
    "short-container-title": ["Trends Ecol &amp; Evol"],
    issued: { "date-parts": [[2019]] }, type: "journal-article",
  },
};
const DATACITE = {
  "10.48550/arXiv.1606.06565": { attributes: {
    titles: [{ title: "Concrete Problems in AI Safety" }],
    creators: [{ name: "Amodei, Dario", familyName: "Amodei" }, { name: "Olah, Chris", familyName: "Olah" }],
    publisher: "arXiv", publicationYear: 2016,
    types: { resourceTypeGeneral: "Preprint" },
  }},
};
const OPENLIB = {
  "9780262035613": {
    title: "Deep Learning", authors: [{ name: "Ian Goodfellow" }, { name: "Yoshua Bengio" }],
    publish_date: "2016", publishers: [{ name: "MIT Press" }],
  },
};

const calls = [];
function fakeFetch(url) {
  calls.push(url);
  const ok = (j) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(j) });
  const nf = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  let m;
  if ((m = url.match(/api\.crossref\.org\/works\/([^?]+)/))) {
    // DOIs are case-insensitive by spec and Crossref honours that; the tool
    // looks up the lowercased form.
    const doi = decodeURIComponent(m[1]).toLowerCase();
    const hit = Object.keys(CROSSREF).find((k) => k.toLowerCase() === doi);
    return hit ? ok({ message: CROSSREF[hit] }) : nf();
  }
  if ((m = url.match(/api\.datacite\.org\/dois\/(.+)$/))) {
    const doi = decodeURIComponent(m[1]);
    const hit = Object.keys(DATACITE).find((k) => k.toLowerCase() === doi.toLowerCase());
    return hit ? ok({ data: DATACITE[hit] }) : nf();
  }
  if ((m = url.match(/openlibrary\.org.*ISBN:(\d+)/))) {
    const rec = OPENLIB[m[1]];
    return ok(rec ? { ["ISBN:" + m[1]]: rec } : {});
  }
  if (/unpaywall/.test(url)) return nf();
  return nf();
}

const el = new Proxy({ value: "", textContent: "", innerHTML: "", hidden: false, checked: false },
  { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => ((t[k] = v), true) });
const sandbox = {
  document: { getElementById: () => el, createElement: () => el, body: el },
  matchMedia: () => ({ matches: false }), navigator: {}, setTimeout, clearTimeout,
  fetch: fakeFetch, AbortController: class { constructor(){ this.signal = {}; } abort(){} },
  Promise, console, __out: {},
};
vm.createContext(sandbox);
vm.runInContext(src.replace(/\}\)\(\);\s*$/,
  "__out={findDois,findExtras,classify,fetchRef,unent,cleanDoi,uncheckedEntries,contextFor,arxivDoi};})();"),
  sandbox, { filename: page });
const T = sandbox.__out;

// ---- assertions -------------------------------------------------------------
let fail = 0;
const check = (name, cond, extra = "") => {
  console.log((cond ? "  ok   " : "  FAIL ") + name + (cond ? "" : "  " + extra));
  if (!cond) fail++;
};

console.log("\n1. percent-decoded DOI");
{
  const text = "Lorenz EN. Deterministic nonperiodic flow. J Atmos Sci. 1963;20:130-141. https://doi.org/10.1175/1520-0469(1963)020%3C0130:DNF%3E2.0.CO;2";
  const d = T.findDois(text);
  check("one DOI found", d.length === 1, JSON.stringify(d.map((x) => x.raw)));
  check("decoded to angle brackets", d[0] && d[0].raw.includes("<0130:DNF>"), d[0] && d[0].raw);
  d.forEach((x) => (x.cite = T.contextFor(text, x)));
  await T.fetchRef(d[0].lower, false, "doi").then((r) => {
    const row = T.classify(d[0], r.cr, null);
    check("resolves", row.verdict === "ok", row.verdict + " " + JSON.stringify(row.flags.map((f) => f.label)));
  });
}

console.log("\n2. literal angle brackets are not truncated");
{
  const d = T.findDois("Lorenz 1963. doi:10.1175/1520-0469(1963)020<0130:DNF>2.0.CO;2");
  check("full DOI captured", d[0] && d[0].raw.endsWith("2.0.CO;2"), d[0] && d[0].raw);
}

console.log("\n3. HTML entities in metadata");
{
  check("unent decodes &amp;", T.unent("Trends in Ecology &amp; Evolution") === "Trends in Ecology & Evolution", T.unent("Trends in Ecology &amp; Evolution"));
  check("unent strips JATS", T.unent("Effects of <i>Vibrio</i> spp.") === "Effects of Vibrio spp.", T.unent("Effects of <i>Vibrio</i> spp."));
  const text = "Andersson K. Ecological effects of & nothing in particular. Trends in Ecology & Evolution. 2019. doi:10.1016/j.tree.2019.03.005";
  const d = T.findDois(text);
  d.forEach((x) => (x.cite = T.contextFor(text, x)));
  await T.fetchRef(d[0].lower, false, "doi").then((r) => {
    const row = T.classify(d[0], r.cr, null);
    check("no journal-mismatch flag", !row.flags.some((f) => /journal/i.test(f.label)),
      JSON.stringify(row.flags.map((f) => f.label)) + " journal=" + row.record.journal);
    check("journal shown decoded", row.record.journal === "Trends in Ecology & Evolution", row.record.journal);
  });
}

console.log("\n4. arXiv via DataCite");
{
  const text = "Amodei D, Olah C, et al. Concrete problems in AI safety. arXiv:1606.06565. 2016.";
  const dois = T.findDois(text);
  const ex = T.findExtras(text, dois);
  check("one arXiv entry", ex.length === 1 && ex[0].kind === "arxiv", JSON.stringify(ex));
  check("maps to DataCite DOI", T.arxivDoi(ex[0].id) === "10.48550/arXiv.1606.06565", T.arxivDoi(ex[0].id));
  ex[0].cite = text;
  await T.fetchRef(T.arxivDoi(ex[0].id), false, "arxiv").then((r) => {
    const row = T.classify(ex[0], r.cr, null);
    check("resolves in DataCite", row.verdict === "ok", row.verdict + " " + JSON.stringify(row.flags.map((f) => f.label)));
    check("source named", row.record && row.record.source === "DataCite", row.record && row.record.source);
    check("title", row.record.title === "Concrete Problems in AI Safety", row.record.title);
    check("year", row.record.year === "2016", row.record.year);
    check("first author", row.record.author === "Amodei", row.record.author);
    check("marked preprint", row.flags.some((f) => /preprint/i.test(f.label)), JSON.stringify(row.flags.map((f) => f.label)));
  });
  check("not listed as unchecked", T.uncheckedEntries(text).length === 0, JSON.stringify(T.uncheckedEntries(text)));
}

console.log("\n5. ISBN via OpenLibrary");
{
  const text = "Goodfellow I, Bengio Y, Courville A. Deep Learning. MIT Press; 2016. ISBN 978-0-262-03561-3.";
  const ex = T.findExtras(text, []);
  check("one ISBN entry", ex.length === 1 && ex[0].kind === "isbn", JSON.stringify(ex));
  check("digits normalised", ex[0].id === "9780262035613", ex[0].id);
  ex[0].cite = text;
  await T.fetchRef(ex[0].id, false, "isbn").then((r) => {
    const row = T.classify(ex[0], r.cr, null);
    check("resolves in OpenLibrary", row.verdict === "ok", row.verdict + " " + JSON.stringify(row.flags.map((f) => f.label)));
    check("source named", row.record.source === "OpenLibrary", row.record.source);
    check("surname from display order", row.record.author === "Goodfellow", row.record.author);
    check("publisher as container", row.record.journal === "MIT Press", row.record.journal);
  });
  check("not listed as unchecked", T.uncheckedEntries(text).length === 0);
}

console.log("\n6. an arXiv ID beside a published DOI is not double-counted");
{
  const text = "Zhou F, et al. Clinical course. Lancet. 2020. arXiv:2001.01234. doi:10.1016/S0140-6736(20)30566-3";
  const dois = T.findDois(text);
  check("extras suppressed near a DOI", T.findExtras(text, dois).length === 0, JSON.stringify(T.findExtras(text, dois)));
}

console.log("\n7. genuinely unresolvable entries are still listed back");
{
  const text = "Singh A, et al. Some conference paper. In: Proceedings of the 2009 Workshop on Things. 2009.";
  check("still unchecked", T.uncheckedEntries(text).length === 1, JSON.stringify(T.uncheckedEntries(text)));
}

console.log("\n8. absent from both registries");
{
  const text = "Nobody A. A wrong identifier. J Example. 2021. doi:10.9999/definitely-not-real";
  const d = T.findDois(text);
  d.forEach((x) => (x.cite = T.contextFor(text, x)));
  await T.fetchRef(d[0].lower, false, "doi").then((r) => {
    const row = T.classify(d[0], r.cr, null);
    check("verdict nr", row.verdict === "nr", row.verdict);
    check("names both registries", row.flags.some((f) => /Crossref or DataCite/.test(f.label)), JSON.stringify(row.flags.map((f) => f.label)));
  });
}

console.log(fail ? `\n${fail} FAILED\n` : "\nall passed\n");
process.exit(fail ? 1 : 0);
