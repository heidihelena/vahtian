import test from 'node:test';
import assert from 'node:assert/strict';
import { runChecks } from '../checks.js';
import { extractDocx } from '../docx-extract.js';
import {
  makeDocx, cslCitation, complexCitation, bibliographyField, para, textRun,
} from './fixtures.mjs';

const loc = (paragraph = 0) => ({ part: 'body', paragraph, inTable: false, context: '' });

function cit({ id = 1, key = 'ABCD1234', title = 'Test Paper', doi = '10.1000/xyz', year = 2020, label = '[1]', paragraph = 0 } = {}) {
  return {
    fieldCode: '',
    citation: { citationID: `c${id}`, properties: { formattedCitation: label }, citationItems: [] },
    parseError: null,
    items: [{
      id,
      uris: [`http://zotero.org/users/1/items/${key}`],
      itemData: {
        id, type: 'article-journal', title, DOI: doi,
        author: [{ family: 'Smith', given: 'A' }],
        issued: { 'date-parts': [[year]] },
      },
    }],
    location: loc(paragraph),
  };
}

const bib = (entries) => ({ fieldCode: '', params: {}, paramsError: null, entries, location: loc(99) });
const base = (over = {}) => ({ citations: [], bibliography: null, flattenedSuspects: [], ...over });

test('broken field is flagged', () => {
  const { findings, summary } = runChecks(base({
    citations: [{ fieldCode: 'x', citation: null, parseError: 'no JSON object in field code', items: [], location: loc() }],
  }));
  assert.equal(findings[0].kind, 'broken-field');
  assert.equal(findings[0].level, 'flag');
  assert.equal(summary.brokenFields, 1);
});

test('same DOI under two different Zotero items is a duplicate publication', () => {
  const { findings } = runChecks(base({
    citations: [
      cit({ id: 1, key: 'AAAA1111', doi: '10.1/dup', label: '[1]' }),
      cit({ id: 2, key: 'BBBB2222', doi: '10.1/DUP', label: '[2]', paragraph: 3 }),
    ],
    bibliography: bib(['1. Smith A. Test Paper. 2020.', '2. Smith A. Test Paper. 2020.']),
  }));
  const dup = findings.find((f) => f.kind === 'duplicate-publication');
  assert.ok(dup, 'duplicate must be found despite DOI case difference');
  assert.equal(dup.citations.length, 2);
});

test('same item cited twice is NOT a duplicate', () => {
  const { findings } = runChecks(base({
    citations: [cit({ id: 1 }), cit({ id: 1, paragraph: 5 })],
    bibliography: bib(['1. Smith A. Test Paper. 2020.']),
  }));
  assert.ok(!findings.some((f) => f.kind === 'duplicate-publication'));
});

test('cited work absent from reference list is missing-bibliography-entry', () => {
  const { findings } = runChecks(base({
    citations: [cit({ title: 'Vanished Work', doi: null })],
    bibliography: bib(['1. Someone Else. Unrelated Entry. 2019.']),
  }));
  const miss = findings.find((f) => f.kind === 'missing-bibliography-entry');
  assert.ok(miss);
  assert.match(miss.message, /Vanished Work/);
});

test('reference-list entry matching no citation is uncited (note level)', () => {
  const { findings, summary } = runChecks(base({
    citations: [cit({ title: 'Cited Work' })],
    bibliography: bib(['1. Smith A. Cited Work. 2020.', '2. Ghost B. Never Cited Paper. 2018.']),
  }));
  const un = findings.find((f) => f.kind === 'uncited-bibliography-entry');
  assert.ok(un);
  assert.equal(un.level, 'note');
  assert.match(un.entry, /Never Cited/);
  assert.equal(summary.uncitedEntries, 1);
});

test('title match is case- and diacritic-insensitive', () => {
  const { findings } = runChecks(base({
    citations: [cit({ title: 'Long Title That The Style Changed The Case Of', doi: null, year: 2021 })],
    bibliography: bib(['1. Smith A. Long title that the style changed the case of. 2021;12:1-9.']),
  }));
  assert.ok(!findings.some((f) => f.kind === 'missing-bibliography-entry'));
});

test('untitled item with DOI falls back to author+year against unclaimed entries', () => {
  const noTitle = cit({ doi: '10.7/untitled', year: 2022 });
  noTitle.items[0].itemData.title = undefined;
  const { findings } = runChecks(base({
    citations: [noTitle],
    bibliography: bib(['1. Smith A. Some Entry Text. 2022.']),
  }));
  assert.ok(!findings.some((f) => f.kind === 'missing-bibliography-entry'));
});

test('same author and year, different work: missing entry is still flagged', () => {
  const { findings } = runChecks(base({
    citations: [
      cit({ id: 1, key: 'K1', doi: '10.1/a', title: 'Alpha Paper' }),
      cit({ id: 2, key: 'K2', doi: '10.9/z', title: 'Vanished Work', label: '[2]' }),
    ],
    bibliography: bib(['1. Smith A. Alpha Paper. 2020.']),
  }));
  const miss = findings.find((f) => f.kind === 'missing-bibliography-entry');
  assert.ok(miss, 'Vanished Work must not be swallowed by an author+year match on the Alpha entry');
  assert.match(miss.message, /Vanished Work/);
});

test('citations without any bibliography field yield a single note', () => {
  const { findings } = runChecks(base({ citations: [cit()] }));
  const notes = findings.filter((f) => f.kind === 'no-bibliography-field');
  assert.equal(notes.length, 1);
  assert.equal(notes[0].level, 'note');
});

test('numbering gap is reported for numeric styles', () => {
  const { findings } = runChecks(base({
    citations: [
      cit({ id: 1, key: 'K1', doi: '10.1/a', label: '[1]' }),
      cit({ id: 3, key: 'K3', doi: '10.1/c', label: '[4]', title: 'Third' }),
    ],
    bibliography: bib(['1. Smith A. Test Paper. 2020.', '4. Smith A. Third. 2020.']),
  }));
  const gap = findings.find((f) => f.kind === 'numbering-gap');
  assert.ok(gap);
  assert.match(gap.message, /2, 3/);
});

test('no numbering check for author-year styles', () => {
  const { findings } = runChecks(base({
    citations: [cit({ label: '(Smith, 2020)' })],
    bibliography: bib(['Smith A. Test Paper. 2020.']),
  }));
  assert.ok(!findings.some((f) => f.kind === 'numbering-gap'));
});

test('flattened suspects pass through; google-docs link is a flag', () => {
  const { findings } = runChecks(base({
    flattenedSuspects: [
      { kind: 'flattened-text', text: '[7]', location: loc(2) },
      { kind: 'google-docs-link', text: '(Smith, 2020)', location: loc(4) },
    ],
  }));
  assert.equal(findings.find((f) => f.kind === 'flattened-suspect').level, 'note');
  assert.equal(findings.find((f) => f.kind === 'google-docs-flattened').level, 'flag');
});

test('orphan: cited work absent from library export is flagged', () => {
  const { findings, summary } = runChecks(base({
    citations: [cit({ title: 'Gone From Library', doi: '10.4/gone' })],
    bibliography: bib(['1. Smith A. Gone From Library. 2020.']),
  }), { library: [{ id: 'x1', title: 'Some Other Item', DOI: '10.4/other' }] });
  const o = findings.find((f) => f.kind === 'orphan-citation');
  assert.ok(o);
  assert.equal(o.level, 'flag');
  assert.match(o.message, /Gone From Library/);
  assert.equal(summary.libraryChecked, true);
});

test('orphan: DOI match is case-insensitive and prefix-tolerant', () => {
  const { findings } = runChecks(base({
    citations: [cit({ doi: '10.4/InLib' })],
    bibliography: bib(['1. Smith A. Test Paper. 2020.']),
  }), { library: [{ id: 'x1', title: 'Different Title In Library', DOI: 'https://doi.org/10.4/inlib' }] });
  assert.ok(!findings.some((f) => f.kind === 'orphan-citation'));
});

test('orphan: title match works when the cited item has no DOI', () => {
  const { findings } = runChecks(base({
    citations: [cit({ title: 'Chapter Without DOI', doi: null })],
    bibliography: bib(['1. Smith A. Chapter Without DOI. 2020.']),
  }), { library: [{ id: 'x1', title: 'Chapter without DOI' }] });
  assert.ok(!findings.some((f) => f.kind === 'orphan-citation'));
});

test('no library given: no orphan findings, summary says unchecked', () => {
  const { findings, summary } = runChecks(base({
    citations: [cit()],
    bibliography: bib(['1. Smith A. Test Paper. 2020.']),
  }));
  assert.ok(!findings.some((f) => f.kind === 'orphan-citation'));
  assert.equal(summary.libraryChecked, false);
});

test('summary counts add up', () => {
  const { summary } = runChecks(base({
    citations: [
      cit({ id: 1, key: 'K1', doi: '10.1/a' }),
      cit({ id: 2, key: 'K2', doi: '10.1/a', label: '[2]' }),
      { fieldCode: 'x', citation: null, parseError: 'broken', items: [], location: loc(9) },
    ],
    bibliography: bib(['1. Smith A. Test Paper. 2020.']),
  }));
  assert.equal(summary.citationsChecked, 3);
  assert.equal(summary.uniqueWorks, 1);
  assert.equal(summary.brokenFields, 1);
  assert.equal(summary.counts['duplicate-publication'], 1);
});

test('integration: DOCX in, findings out', async () => {
  const body =
    para(textRun('One ') + complexCitation(cslCitation({ id: 1, key: 'K1', doi: '10.1/a', title: 'Alpha Paper' }), '[1]')) +
    para(textRun('Two ') + complexCitation(cslCitation({ id: 2, key: 'K2', doi: '10.1/a', title: 'Alpha Paper' }), '[2]')) +
    para(textRun('Dead one [9] here.')) +
    bibliographyField(['1. Smith A. Alpha Paper. 2020.', '2. Smith A. Alpha Paper. 2020.', '3. Ghost B. Uncited Thing. 2017.']);
  const extracted = await extractDocx(makeDocx({ body }));
  const { findings, summary } = runChecks(extracted);
  assert.equal(summary.citationsChecked, 2);
  assert.ok(findings.some((f) => f.kind === 'duplicate-publication'));
  assert.ok(findings.some((f) => f.kind === 'uncited-bibliography-entry'));
  assert.ok(findings.some((f) => f.kind === 'flattened-suspect' && f.message.includes('[9]')));
});
