// Test-only DOCX builder: writes a real ZIP (stored or deflate) around
// hand-written WordprocessingML, so the extractor is tested against the
// actual container format, not mocks.
import zlib from 'node:zlib';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(u8) {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** files: [{name, content:string, deflate?:boolean}] -> Uint8Array zip */
export function makeZip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const nameB = Buffer.from(f.name);
    const data = Buffer.from(f.content);
    const stored = !f.deflate;
    const payload = stored ? data : zlib.deflateRawSync(data);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(stored ? 0 : 8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameB.length, 26);
    chunks.push(local, nameB, payload);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(stored ? 0 : 8, 10);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(payload.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameB.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameB);
    offset += 30 + nameB.length + payload.length;
  }
  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...chunks, cdBuf, eocd]));
}

export const escText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
export const escAttr = (s) => escText(s).replace(/"/g, '&quot;');

export function cslCitation({ id = 1, key = 'ABCD1234', title = 'Test Paper', doi = '10.1000/xyz', year = 2020, label = '[1]' } = {}) {
  return JSON.stringify({
    citationID: `cit-${id}`,
    properties: { formattedCitation: label },
    citationItems: [{
      id,
      uris: [`http://zotero.org/users/1/items/${key}`],
      itemData: {
        id, type: 'article-journal', title, DOI: doi,
        author: [{ family: 'Smith', given: 'Ann' }],
        issued: { 'date-parts': [[year]] },
      },
    }],
    schema: 'https://github.com/citation-style-language/schema/raw/master/csl-citation.json',
  });
}

/** A complex (fldChar) Zotero citation field, instr split across two runs. */
export function complexCitation(json, rendered = '[1]') {
  const code = ` ADDIN ZOTERO_ITEM CSL_CITATION ${json} `;
  const mid = Math.floor(code.length / 2);
  return (
    '<w:r><w:fldChar w:fldCharType="begin"/></w:r>' +
    `<w:r><w:instrText xml:space="preserve">${escText(code.slice(0, mid))}</w:instrText></w:r>` +
    `<w:r><w:instrText xml:space="preserve">${escText(code.slice(mid))}</w:instrText></w:r>` +
    '<w:r><w:fldChar w:fldCharType="separate"/></w:r>' +
    `<w:r><w:t>${escText(rendered)}</w:t></w:r>` +
    '<w:r><w:fldChar w:fldCharType="end"/></w:r>'
  );
}

export function simpleCitation(json, rendered = '[1]') {
  const code = ` ADDIN ZOTERO_ITEM CSL_CITATION ${json} `;
  return `<w:fldSimple w:instr="${escAttr(code)}"><w:r><w:t>${escText(rendered)}</w:t></w:r></w:fldSimple>`;
}

/** ZOTERO_BIBL field whose rendered part spans one paragraph per entry. */
export function bibliographyField(entries) {
  const params = JSON.stringify({ uncited: [], omitted: [], custom: [] });
  const first = entries[0] ?? '';
  const rest = entries.slice(1);
  return (
    '<w:p>' +
    '<w:r><w:fldChar w:fldCharType="begin"/></w:r>' +
    `<w:r><w:instrText xml:space="preserve"> ADDIN ZOTERO_BIBL ${escText(params)} CSL_BIBLIOGRAPHY </w:instrText></w:r>` +
    '<w:r><w:fldChar w:fldCharType="separate"/></w:r>' +
    `<w:r><w:t>${escText(first)}</w:t></w:r>` +
    rest.map((e) => `</w:p><w:p><w:r><w:t>${escText(e)}</w:t></w:r>`).join('') +
    '<w:r><w:fldChar w:fldCharType="end"/></w:r>' +
    '</w:p>'
  );
}

export const para = (inner) => `<w:p>${inner}</w:p>`;
export const textRun = (t) => `<w:r><w:t xml:space="preserve">${escText(t)}</w:t></w:r>`;

export function documentXml(bodyInner) {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<w:body>${bodyInner}</w:body></w:document>`;
}

export function footnotesXml(notes) {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    notes.map(({ id, inner }) => `<w:footnote w:id="${id}">${inner}</w:footnote>`).join('') +
    '</w:footnotes>';
}

export function relsXml(rels) {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    rels.map(({ id, target }) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escAttr(target)}" TargetMode="External"/>`).join('') +
    '</Relationships>';
}

export function makeDocx({ body, footnotes = null, rels = null, deflate = false }) {
  const files = [
    { name: '[Content_Types].xml', content: '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>' },
    { name: 'word/document.xml', content: documentXml(body), deflate },
  ];
  if (footnotes) files.push({ name: 'word/footnotes.xml', content: footnotesXml(footnotes), deflate });
  if (rels) files.push({ name: 'word/_rels/document.xml.rels', content: relsXml(rels), deflate });
  return makeDocx.raw(files);
}
makeDocx.raw = makeZip;
