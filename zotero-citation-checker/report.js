/*
 * report.js — turn runChecks() output into downloadable Citation Integrity
 * Reports (Markdown and CSV). Pure functions; the page wires them to Blob
 * downloads. Caller supplies filename and date so this stays deterministic.
 */

const KIND_TITLES = {
  'orphan-citation': 'Cited in the manuscript, not found in your library',
  'broken-field': 'Broken citation fields',
  'duplicate-publication': 'Duplicate publications',
  'missing-bibliography-entry': 'Cited in text, missing from the reference list',
  'uncited-bibliography-entry': 'In the reference list, not matched in the text',
  'flattened-suspect': 'Possible flattened citations',
  'google-docs-flattened': 'Google Docs citations that lost their link',
  'numbering-gap': 'Numbering gaps',
  'no-bibliography-field': 'No live bibliography field',
  'unmatchable-item': 'Items the checker could not match',
};

export function locationText(l) {
  if (!l) return '';
  const bits = [l.part];
  if (l.footnoteId != null) bits.push(`footnote ${l.footnoteId}`);
  if (l.paragraph >= 0) bits.push(`paragraph ${l.paragraph + 1}`);
  if (l.inTable) bits.push('in a table');
  if (l.context) bits.push(`"${l.context}"`);
  return bits.join(', ');
}

function findingLocations(f) {
  return f.citations || (f.location ? [f.location] : []);
}

export function summaryLine(summary, findings) {
  const flags = findings.filter((f) => f.level === 'flag').length;
  const notes = findings.length - flags;
  return `${summary.citationsChecked} citation fields checked, ` +
    `${summary.uniqueWorks} unique works, ` +
    `${flags} ${flags === 1 ? 'flag' : 'flags'}, ` +
    `${notes} ${notes === 1 ? 'note' : 'notes'}.`;
}

export function buildMarkdown({ summary, findings, filename, date }) {
  const lines = [];
  lines.push('# Citation Integrity Report');
  lines.push('');
  lines.push(`Document: ${filename}`);
  if (date) lines.push(`Checked: ${date}`);
  lines.push(`Library export: ${summary.libraryChecked ? 'provided, orphan check ran' : 'not provided, orphan check did not run'}`);
  lines.push('');
  lines.push(summaryLine(summary, findings));
  lines.push('');
  if (!findings.length) {
    lines.push('These checks found nothing to report in the document\'s field data.');
  }
  const byKind = new Map();
  for (const f of findings) {
    if (!byKind.has(f.kind)) byKind.set(f.kind, []);
    byKind.get(f.kind).push(f);
  }
  for (const [kind, list] of byKind) {
    lines.push(`## ${KIND_TITLES[kind] || kind} (${list.length})`);
    lines.push('');
    for (const f of list) {
      lines.push(`- **${f.level}** ${f.message}`);
      if (f.entry) lines.push(`  - entry: ${f.entry}`);
      for (const l of findingLocations(f)) lines.push(`  - ${locationText(l)}`);
    }
    lines.push('');
  }
  lines.push('---');
  lines.push('Generated locally by the Zotero Citation Checker (FullVahti Manuscript Audit), vahtian.com/zotero-citation-checker/. ' +
    'This report records what the checker observed in the document\'s Zotero field data; it does not certify the absence of citation problems.');
  lines.push('');
  return lines.join('\n');
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv({ findings }) {
  const rows = [['kind', 'level', 'message', 'part', 'paragraph', 'footnote', 'in_table', 'context', 'entry']];
  for (const f of findings) {
    const locs = findingLocations(f);
    if (!locs.length) locs.push(null);
    for (const l of locs) {
      rows.push([
        f.kind, f.level, f.message,
        l?.part ?? '', l && l.paragraph >= 0 ? l.paragraph + 1 : '',
        l?.footnoteId ?? '', l ? String(!!l.inTable) : '',
        l?.context ?? '', f.entry ?? '',
      ]);
    }
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
