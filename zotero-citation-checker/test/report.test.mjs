import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMarkdown, buildCsv, summaryLine } from '../report.js';

const summary = { citationsChecked: 3, uniqueWorks: 2, libraryChecked: false };
const findings = [
  {
    kind: 'duplicate-publication', level: 'flag',
    message: 'Work cited through 2 items.',
    citations: [
      { part: 'body', paragraph: 0, inTable: false, context: 'One [1]' },
      { part: 'body', paragraph: 1, inTable: false, context: 'Two, with "quotes"' },
    ],
  },
  {
    kind: 'uncited-bibliography-entry', level: 'note',
    message: 'Entry matched by no citation.',
    entry: '3. Ghost B. Uncited, Thing. 2017.',
    location: { part: 'body', paragraph: 7, inTable: false, context: '' },
  },
];

test('summaryLine counts flags and notes', () => {
  assert.equal(summaryLine(summary, findings), '3 citation fields checked, 2 unique works, 1 flag, 1 note.');
});

test('markdown carries header, summary, sections, locations and honesty line', () => {
  const md = buildMarkdown({ summary, findings, filename: 'thesis.docx', date: '2026-07-30' });
  assert.match(md, /# Citation Integrity Report/);
  assert.match(md, /Document: thesis\.docx/);
  assert.match(md, /orphan check did not run/);
  assert.match(md, /## Duplicate publications \(1\)/);
  assert.match(md, /body, paragraph 1/);
  assert.match(md, /entry: 3\. Ghost B\./);
  assert.match(md, /does not certify the absence of citation problems/);
});

test('csv: one row per location, quoting commas and quotes', () => {
  const csv = buildCsv({ findings });
  const lines = csv.trim().split('\r\n');
  assert.equal(lines[0], 'kind,level,message,part,paragraph,footnote,in_table,context,entry');
  assert.equal(lines.length, 4);
  assert.match(lines[2], /"Two, with ""quotes"""/);
  assert.match(lines[3], /"3\. Ghost B\. Uncited, Thing\. 2017\."/);
});

test('csv: finding without location still yields a row', () => {
  const csv = buildCsv({ findings: [{ kind: 'numbering-gap', level: 'note', message: 'Numbers 2, 3 missing.' }] });
  const lines = csv.trim().split('\r\n');
  assert.equal(lines.length, 2);
  assert.match(lines[1], /^numbering-gap,note,/);
});
