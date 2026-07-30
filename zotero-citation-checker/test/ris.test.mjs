import test from 'node:test';
import assert from 'node:assert/strict';
import { collectWorks, buildRis, risRecord } from '../ris.js';

const item = (over = {}) => ({
  type: 'article-journal',
  title: 'Test Paper',
  DOI: '10.1000/xyz',
  author: [{ family: 'Smith', given: 'Ann' }, { family: 'Jones', given: 'Bo' }],
  issued: { 'date-parts': [[2020, 3]] },
  'container-title': 'Journal of Tests',
  volume: '12',
  issue: '4',
  page: '101-110',
  ISSN: '1234-5678',
  URL: 'https://example.org/paper',
  ...over,
});

const cit = (itemData, parseError = null) => ({
  parseError,
  items: itemData ? [{ id: 1, uris: [], itemData }] : [],
});

test('journal article maps to a full RIS record', () => {
  const lines = risRecord(item());
  assert.equal(lines[0], 'TY  - JOUR');
  assert.ok(lines.includes('TI  - Test Paper'));
  assert.ok(lines.includes('AU  - Smith, Ann'));
  assert.ok(lines.includes('AU  - Jones, Bo'));
  assert.ok(lines.includes('PY  - 2020'));
  assert.ok(lines.includes('T2  - Journal of Tests'));
  assert.ok(lines.includes('SP  - 101'));
  assert.ok(lines.includes('EP  - 110'));
  assert.ok(lines.includes('DO  - 10.1000/xyz'));
  assert.equal(lines[lines.length - 1], 'ER  - ');
});

test('unknown CSL type falls back to GEN; missing fields are skipped', () => {
  const lines = risRecord({ type: 'exotic-thing', title: 'Bare' });
  assert.equal(lines[0], 'TY  - GEN');
  assert.equal(lines.length, 3);
  assert.ok(!lines.some((l) => l.startsWith('PY')));
});

test('chapter and preprint types map to CHAP and UNPB', () => {
  assert.equal(risRecord(item({ type: 'chapter' }))[0], 'TY  - CHAP');
  assert.equal(risRecord(item({ type: 'preprint' }))[0], 'TY  - UNPB');
});

test('single page number gets SP only; newlines in values are flattened', () => {
  const lines = risRecord(item({ page: 'e2041', abstract: 'line one\nline two' }));
  assert.ok(lines.includes('SP  - e2041'));
  assert.ok(!lines.some((l) => l.startsWith('EP')));
  assert.ok(lines.includes('AB  - line one line two'));
});

test('collectWorks dedupes by DOI and skips broken or empty fields', () => {
  const works = collectWorks([
    cit(item()),
    cit(item({ title: 'Same Work, Other Item' })),           // same DOI
    cit(item({ DOI: null, title: 'No DOI Work' })),
    cit(null, 'broken'),                                     // broken field
  ]);
  assert.equal(works.length, 2);
});

test('buildRis: one record per work, CRLF endings', () => {
  const ris = buildRis(collectWorks([cit(item()), cit(item({ DOI: '10.2/other', title: 'Second' }))]));
  assert.equal((ris.match(/^TY  - /gm) || []).length, 2);
  assert.equal((ris.match(/ER  - /g) || []).length, 2);
  assert.ok(ris.includes('\r\n'));
  assert.ok(ris.endsWith('\r\n'));
});
