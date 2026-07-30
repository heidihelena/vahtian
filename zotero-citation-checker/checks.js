/*
 * checks.js — rule-based classification over extractDocx() output.
 * Part of the Zotero Citation Checker (FullVahti Manuscript Audit).
 *
 * Deterministic on purpose: every finding is a recorded observation with a
 * location, never a verdict. Levels: 'flag' (needs fixing or a decision),
 * 'note' (worth a human look). Nothing here certifies the absence of
 * citation problems.
 *
 * runChecks(extracted, opts?) -> {
 *   findings: [{ kind, level, message, location?, citations?, entry? }],
 *   summary:  { citationsChecked, uniqueWorks, worksWithFlags, counts }
 * }
 *
 * opts.library: optional CSL-JSON array (Zotero: File > Export Library,
 * format CSL JSON). When present, each cited work is also looked up in it
 * (DOI first, else normalized title) and orphans are flagged.
 */

// ------------------------------------------------------- normalization ----

function normText(s) {
  return (s || '')
    .normalize('NFD').replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function normDoi(doi) {
  if (!doi) return null;
  return doi.trim().toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .replace(/[.,;)\]]+$/, '') || null;
}

function itemYear(itemData) {
  const parts = itemData?.issued?.['date-parts'];
  return Array.isArray(parts) && Array.isArray(parts[0]) ? String(parts[0][0] ?? '') : '';
}

function firstAuthorFamily(itemData) {
  const a = itemData?.author?.[0];
  return a ? (a.family || a.literal || '') : '';
}

/** Stable identity for "same publication": DOI first, else title+year. */
function workKey(item) {
  const doi = normDoi(item.itemData?.DOI);
  if (doi) return `doi:${doi}`;
  const t = normText(item.itemData?.title);
  if (t) return `title:${t}|${itemYear(item.itemData)}`;
  return null;
}

/** Identity of the underlying Zotero *item* (to see one work under many items). */
function itemIdentity(item) {
  if (item.uris && item.uris.length) return item.uris.slice().sort().join('|');
  return item.id != null ? `id:${item.id}` : null;
}

// ------------------------------------------------------------- checks ----

export function runChecks(extracted, opts = {}) {
  const findings = [];
  const { citations, bibliography, flattenedSuspects } = extracted;
  const library = Array.isArray(opts.library) ? opts.library : null;

  // Broken fields first: they carry no usable metadata.
  let broken = 0;
  for (const c of citations) {
    if (c.parseError) {
      broken++;
      findings.push({
        kind: 'broken-field',
        level: 'flag',
        message: `A Zotero citation field is present but its stored data no longer parses (${c.parseError}). Refresh will not fix it; re-insert the citation from Zotero.`,
        location: c.location,
      });
    }
  }

  // Group healthy citations by work.
  const works = new Map(); // workKey -> { items: Map<itemIdentity, item>, citations: [c], labels: Set }
  let unkeyed = 0;
  for (const c of citations) {
    if (c.parseError) continue;
    for (const item of c.items) {
      const key = workKey(item);
      if (!key) {
        unkeyed++;
        findings.push({
          kind: 'unmatchable-item',
          level: 'note',
          message: 'A cited item has no DOI and no title in its stored field data, so it cannot be matched against the bibliography or checked for duplicates.',
          location: c.location,
        });
        continue;
      }
      let w = works.get(key);
      if (!w) works.set(key, w = { items: new Map(), citations: [], sample: item });
      const idKey = itemIdentity(item) || `anon-${w.items.size}`;
      if (!w.items.has(idKey)) w.items.set(idKey, item);
      w.citations.push(c);
    }
  }

  // Duplicate publication: one work, more than one distinct Zotero item.
  let duplicateWorks = 0;
  for (const [, w] of works) {
    if (w.items.size > 1) {
      duplicateWorks++;
      findings.push({
        kind: 'duplicate-publication',
        level: 'flag',
        message: `"${w.sample.itemData?.title ?? 'Untitled work'}" is cited through ${w.items.size} different Zotero items, so it can appear more than once in the bibliography. Merge the duplicates in Zotero (select both, right-click, Merge Items), then refresh the document.`,
        citations: w.citations.map((c) => c.location),
      });
    }
  }

  // Library matching (optional): is each cited work present in the exported
  // Zotero library? DOI first, else normalized title.
  let orphans = 0;
  if (library) {
    const byDoi = new Set();
    const byTitle = new Set();
    for (const it of library) {
      const d = normDoi(it?.DOI);
      if (d) byDoi.add(d);
      const t = normText(it?.title);
      if (t) byTitle.add(t);
    }
    for (const [, w] of works) {
      const doi = normDoi(w.sample.itemData?.DOI);
      const title = normText(w.sample.itemData?.title);
      const inLibrary = (doi && byDoi.has(doi)) || (title && byTitle.has(title));
      if (!inLibrary) {
        orphans++;
        findings.push({
          kind: 'orphan-citation',
          level: 'flag',
          message: `"${w.sample.itemData?.title ?? 'Untitled work'}" is cited in the manuscript but no matching item was found in the exported library (looked up by DOI, then title). The item may have been deleted or renamed in Zotero, or the citation came from someone else's library; refresh will then fail or re-create it.`,
          citations: w.citations.map((c) => c.location),
        });
      }
    }
  }

  // Bibliography cross-checks.
  let missingFromBib = 0;
  let uncitedEntries = 0;
  if (!bibliography) {
    if (citations.length) {
      findings.push({
        kind: 'no-bibliography-field',
        level: 'note',
        message: 'No Zotero bibliography field found in the document, so cited-vs-listed checks could not run. If the reference list is plain text, it was pasted or flattened; insert a live bibliography from the Zotero toolbar.',
      });
    }
  } else {
    const entriesNorm = bibliography.entries.map(normText);
    const entryMatched = new Array(entriesNorm.length).fill(false);

    // Pass 1: title match (the reliable signal). Pass 2, only for items whose
    // field data has no title at all: first author + year, and only against
    // entries no titled work claimed. A titled work never falls back, because
    // author+year alone cannot tell two same-author-same-year papers apart.
    const matchedAt = new Map();
    for (const [key, w] of works) {
      const title = normText(w.sample.itemData?.title);
      if (!title) continue;
      const at = entriesNorm.findIndex((e) => e.includes(title));
      if (at >= 0) { matchedAt.set(key, at); entryMatched[at] = true; }
    }
    for (const [key, w] of works) {
      if (matchedAt.has(key) || normText(w.sample.itemData?.title)) continue;
      const author = normText(firstAuthorFamily(w.sample.itemData));
      const year = itemYear(w.sample.itemData);
      if (!author || !year) continue;
      const at = entriesNorm.findIndex((e, i) => !entryMatched[i] && e.includes(author) && e.includes(year));
      if (at >= 0) { matchedAt.set(key, at); entryMatched[at] = true; }
    }

    for (const [key, w] of works) {
      if (!matchedAt.has(key)) {
        missingFromBib++;
        findings.push({
          kind: 'missing-bibliography-entry',
          level: 'flag',
          message: `"${w.sample.itemData?.title ?? 'Untitled work'}" is cited in the text but no matching entry was found in the reference list. Refresh the document in Zotero; if it stays missing, the citation may be flattened or the entry edited by hand.`,
          citations: w.citations.map((c) => c.location),
        });
      }
    }

    for (let i = 0; i < bibliography.entries.length; i++) {
      if (!entryMatched[i]) {
        uncitedEntries++;
        findings.push({
          kind: 'uncited-bibliography-entry',
          level: 'note',
          message: 'This reference-list entry was not matched to any citation in the text. It may be genuinely uncited, added via "Edit Bibliography", or the matching may have missed it; worth a human look.',
          entry: bibliography.entries[i],
          location: bibliography.location,
        });
      }
    }
  }

  // Numbering gaps (numeric styles only).
  const numbers = new Set();
  let numericLabels = 0;
  let labelled = 0;
  for (const c of citations) {
    const label = c.citation?.properties?.formattedCitation;
    if (!label) continue;
    labelled++;
    const nums = label.match(/\d{1,3}/g);
    if (/^[\[(]?\d/.test(label.trim()) && nums) {
      numericLabels++;
      for (const n of nums) numbers.add(Number(n));
    }
  }
  if (labelled > 0 && numericLabels / labelled > 0.6 && numbers.size > 0) {
    const max = Math.max(...numbers);
    const gaps = [];
    for (let n = 1; n <= max; n++) if (!numbers.has(n)) gaps.push(n);
    if (gaps.length) {
      findings.push({
        kind: 'numbering-gap',
        level: 'note',
        message: `Citation numbers run up to ${max} but ${gaps.length === 1 ? 'number' : 'numbers'} ${gaps.join(', ')} never appear in the text. Ranges like [1-3] can explain this; otherwise a citation may have been deleted without a refresh.`,
      });
    }
  }

  // Flattened suspects pass through as findings.
  for (const s of flattenedSuspects) {
    findings.push({
      kind: s.kind === 'google-docs-link' ? 'google-docs-flattened' : 'flattened-suspect',
      level: s.kind === 'google-docs-link' ? 'flag' : 'note',
      message: s.kind === 'google-docs-link'
        ? `"${s.text}" links to zotero.org/google-docs: a Google Docs citation that lost its live link on export. Re-link it via the Zotero menu in Google Docs before final export.`
        : `"${s.text}" looks like a citation but is plain text, not a live Zotero field. If it should be live, re-insert it from Zotero; if it is a leftover, delete it.`,
      location: s.location,
    });
  }

  const counts = {};
  for (const f of findings) counts[f.kind] = (counts[f.kind] || 0) + 1;

  const worksWithFlags = duplicateWorks + missingFromBib + orphans;
  return {
    findings,
    summary: {
      citationsChecked: citations.length,
      uniqueWorks: works.size,
      worksWithFlags,
      brokenFields: broken,
      uncitedEntries,
      libraryChecked: !!library,
      counts,
    },
  };
}
