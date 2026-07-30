/*
 * ris.js — recover references from a document's Zotero citation fields.
 *
 * Every live Zotero citation field carries the reference's full CSL data,
 * even when the item lives in someone else's library. Exporting that data
 * as RIS lets the reader import the references into their own Zotero and
 * re-insert the citations. Fields whose stored JSON no longer parses, and
 * citations already flattened to plain text, carry nothing to recover.
 *
 * collectWorks(citations) -> deduplicated [{ itemData }]
 * buildRis(works)         -> RIS string (CRLF line endings, one record per work)
 */

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

/** One entry per unique work, keyed by DOI, else title+year. */
export function collectWorks(citations) {
  const seen = new Map();
  for (const c of citations) {
    if (c.parseError) continue;
    for (const item of c.items) {
      if (!item.itemData) continue;
      const doi = normDoi(item.itemData.DOI);
      const title = normText(item.itemData.title);
      const key = doi ? `doi:${doi}` : (title ? `title:${title}|${itemYear(item.itemData)}` : null);
      if (!key || seen.has(key)) continue;
      seen.set(key, { itemData: item.itemData });
    }
  }
  return [...seen.values()];
}

// CSL type -> RIS TY. GEN when unknown; Zotero still imports it.
const RIS_TYPES = {
  'article-journal': 'JOUR',
  'article-magazine': 'MGZN',
  'article-newspaper': 'NEWS',
  book: 'BOOK',
  chapter: 'CHAP',
  'paper-conference': 'CONF',
  thesis: 'THES',
  report: 'RPRT',
  webpage: 'ELEC',
  dataset: 'DATA',
  patent: 'PAT',
  manuscript: 'UNPB',
  preprint: 'UNPB',
};

function risLine(tag, value) {
  const v = String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
  return v ? [`${tag}  - ${v}`] : [];
}

function authorLines(tag, people) {
  if (!Array.isArray(people)) return [];
  const out = [];
  for (const p of people) {
    const name = p.literal || [p.family, p.given].filter(Boolean).join(', ');
    out.push(...risLine(tag, name));
  }
  return out;
}

export function risRecord(itemData) {
  const lines = [];
  lines.push(`TY  - ${RIS_TYPES[itemData.type] || 'GEN'}`);
  lines.push(...risLine('TI', itemData.title));
  lines.push(...authorLines('AU', itemData.author));
  lines.push(...authorLines('ED', itemData.editor));
  const year = itemYear(itemData);
  if (year) lines.push(`PY  - ${year}`);
  lines.push(...risLine('T2', itemData['container-title']));
  lines.push(...risLine('VL', itemData.volume));
  lines.push(...risLine('IS', itemData.issue));
  const pages = String(itemData.page ?? '').trim();
  if (pages) {
    const m = pages.match(/^(\S+?)\s*[-–—]\s*(\S+)$/);
    if (m) { lines.push(`SP  - ${m[1]}`); lines.push(`EP  - ${m[2]}`); }
    else lines.push(`SP  - ${pages}`);
  }
  lines.push(...risLine('DO', itemData.DOI));
  lines.push(...risLine('SN', itemData.ISSN || itemData.ISBN));
  lines.push(...risLine('UR', itemData.URL));
  lines.push(...risLine('PB', itemData.publisher));
  lines.push(...risLine('AB', itemData.abstract));
  lines.push('ER  - ');
  return lines;
}

export function buildRis(works) {
  const lines = [];
  for (const w of works) lines.push(...risRecord(w.itemData));
  return lines.join('\r\n') + '\r\n';
}
