import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDocx } from '../docx-extract.js';
import {
  makeDocx, cslCitation, complexCitation, simpleCitation,
  bibliographyField, para, textRun,
} from './fixtures.mjs';

test('fldSimple Zotero citation is extracted with parsed CSL JSON', async () => {
  const docx = makeDocx({ body: para(textRun('Intro. ') + simpleCitation(cslCitation({ doi: '10.1000/xyz' }))) });
  const out = await extractDocx(docx);
  assert.equal(out.citations.length, 1);
  const c = out.citations[0];
  assert.equal(c.parseError, null);
  assert.equal(c.items[0].itemData.DOI, '10.1000/xyz');
  assert.equal(c.location.part, 'body');
  assert.equal(c.location.paragraph, 0);
  assert.equal(c.location.inTable, false);
});

test('complex field with instrText split across runs is reassembled', async () => {
  const docx = makeDocx({ body: para(complexCitation(cslCitation({ key: 'KEY99999', title: 'Split Field Paper' }))) });
  const out = await extractDocx(docx);
  assert.equal(out.citations.length, 1);
  assert.equal(out.citations[0].parseError, null);
  assert.equal(out.citations[0].items[0].itemData.title, 'Split Field Paper');
  assert.match(out.citations[0].items[0].uris[0], /KEY99999/);
});

test('citation inside w:del (Track Changes deletion) is skipped', async () => {
  const body =
    para(`<w:del w:id="1" w:author="x">${complexCitation(cslCitation({ id: 1 }))}</w:del>`) +
    para(complexCitation(cslCitation({ id: 2, key: 'LIVEITEM' })));
  const out = await extractDocx(makeDocx({ body }));
  assert.equal(out.citations.length, 1);
  assert.match(out.citations[0].items[0].uris[0], /LIVEITEM/);
});

test('ZOTERO_BIBL field yields bibliography entries, one per paragraph', async () => {
  const body =
    para(complexCitation(cslCitation())) +
    bibliographyField(['1. Smith A. Test Paper. J Test. 2020.', '2. Jones B. Other Paper. J Test. 2021.']);
  const out = await extractDocx(makeDocx({ body }));
  assert.ok(out.bibliography);
  assert.equal(out.bibliography.paramsError, null);
  assert.equal(out.bibliography.entries.length, 2);
  assert.match(out.bibliography.entries[1], /Jones B/);
});

test('plain-text [n] is a flattened suspect; rendered text inside a field is not', async () => {
  const body =
    para(textRun('A live citation ') + complexCitation(cslCitation(), '[1]') + textRun(' here.')) +
    para(textRun('A dead one [7] here.'));
  const out = await extractDocx(makeDocx({ body }));
  const texts = out.flattenedSuspects.map((s) => s.text);
  assert.deepEqual(texts, ['[7]']);
});

test('author-year flattened suspect is caught', async () => {
  const out = await extractDocx(makeDocx({ body: para(textRun('As shown before (Smith et al., 2019).')) }));
  assert.equal(out.flattenedSuspects.length, 1);
  assert.equal(out.flattenedSuspects[0].kind, 'flattened-text');
  assert.match(out.flattenedSuspects[0].text, /Smith et al\., 2019/);
});

test('citation in a footnote carries part and footnote id', async () => {
  const docx = makeDocx({
    body: para(textRun('Body text.')),
    footnotes: [{ id: '2', inner: para(complexCitation(cslCitation({ key: 'FOOTNOTE1' }))) }],
  });
  const out = await extractDocx(docx);
  assert.equal(out.citations.length, 1);
  assert.equal(out.citations[0].location.part, 'footnotes');
  assert.equal(out.citations[0].location.footnoteId, '2');
});

test('deflate-compressed parts are inflated (browser DecompressionStream or node zlib)', async () => {
  const docx = makeDocx({ body: para(simpleCitation(cslCitation({ doi: '10.5555/deflated' }))), deflate: true });
  const out = await extractDocx(docx);
  assert.equal(out.citations[0].items[0].itemData.DOI, '10.5555/deflated');
});

test('Google-Docs zotero link is flagged as flattened suspect', async () => {
  const body = para(
    '<w:hyperlink r:id="rId5"><w:r><w:t>(Smith, 2020)</w:t></w:r></w:hyperlink>' +
    textRun(' shows this.')
  );
  const out = await extractDocx(makeDocx({
    body,
    rels: [{ id: 'rId5', target: 'https://www.zotero.org/google-docs/?abc123' }],
  }));
  assert.ok(out.flattenedSuspects.some((s) => s.kind === 'google-docs-link'));
});

test('unparseable field JSON is kept as a citation with parseError (broken field)', async () => {
  const body = para(complexCitation('{"citationItems": [ BROKEN', '[3]'));
  const out = await extractDocx(makeDocx({ body }));
  assert.equal(out.citations.length, 1);
  assert.equal(out.citations[0].citation, null);
  assert.ok(out.citations[0].parseError, 'parseError must be set for a broken field');
});

test('citation inside a table is located as inTable', async () => {
  const body = `<w:tbl><w:tr><w:tc>${para(complexCitation(cslCitation()))}</w:tc></w:tr></w:tbl>`;
  const out = await extractDocx(makeDocx({ body }));
  assert.equal(out.citations[0].location.inTable, true);
});

test('non-ZIP input throws a plain-language error', async () => {
  await assert.rejects(() => extractDocx(new TextEncoder().encode('not a zip at all, definitely')), /docx/);
});

test('ZIP without word/document.xml throws', async () => {
  const zip = makeDocx.raw([{ name: 'hello.txt', content: 'hi' }]);
  await assert.rejects(() => extractDocx(zip), /not a \.docx/);
});
