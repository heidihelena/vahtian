/*
 * docx-extract.js — pull Zotero citation fields out of a .docx, entirely
 * client-side. Part of the Zotero Citation Checker (FullVahti Manuscript
 * Audit). No dependencies: minimal ZIP reader + tag scanner over Word's
 * machine-generated XML.
 *
 * extractDocx(bytes) -> {
 *   citations:         [{ fieldCode, citation, parseError, items, location }]
 *   bibliography:      { fieldCode, params, paramsError, entries, location } | null
 *   flattenedSuspects: [{ kind, text, location }]
 *   parts:             [partName, ...]   // XML parts that were scanned
 * }
 *
 * "citation" is the parsed CSL_CITATION JSON (null when unparseable —
 * that is a broken field, classified downstream in checks.js).
 * A location is { part, paragraph, footnoteId?, inTable, context }.
 */

// ---------------------------------------------------------------- ZIP ----

const EOCD_SIG = 0x06054b50;
const CDIR_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;

async function inflateRaw(u8) {
  if (typeof DecompressionStream === 'function') {
    try {
      const stream = new Blob([u8]).stream()
        .pipeThrough(new DecompressionStream('deflate-raw'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch (e) {
      // 'deflate-raw' unsupported on this runtime (e.g. Node 20) — fall through.
    }
  }
  const zlib = await import('node:zlib');
  return new Uint8Array(zlib.inflateRawSync(u8));
}

/** Read a ZIP archive into Map<name, () => Promise<Uint8Array>>. */
function readZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // EOCD: scan backwards (comment may follow it, max 64 KiB).
  let eocd = -1;
  const floor = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= floor; i--) {
    if (view.getUint32(i, true) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a ZIP file (no end-of-central-directory record) — is this really a .docx?');
  const count = view.getUint16(eocd + 10, true);
  let off = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries = new Map();
  for (let n = 0; n < count; n++) {
    if (view.getUint32(off, true) !== CDIR_SIG) throw new Error('Corrupt ZIP central directory');
    const method = view.getUint16(off + 10, true);
    const csize = view.getUint32(off + 20, true);
    const nameLen = view.getUint16(off + 28, true);
    const extraLen = view.getUint16(off + 30, true);
    const commentLen = view.getUint16(off + 32, true);
    const localOff = view.getUint32(off + 42, true);
    const name = decoder.decode(bytes.subarray(off + 46, off + 46 + nameLen));
    entries.set(name, async () => {
      if (view.getUint32(localOff, true) !== LOCAL_SIG) throw new Error(`Corrupt ZIP local header for ${name}`);
      const lNameLen = view.getUint16(localOff + 26, true);
      const lExtraLen = view.getUint16(localOff + 28, true);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const raw = bytes.subarray(start, start + csize);
      if (method === 0) return raw;
      if (method === 8) return inflateRaw(raw);
      throw new Error(`Unsupported ZIP compression method ${method} for ${name}`);
    });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

// ---------------------------------------------------------- XML helpers ----

const ENTITIES = { quot: '"', amp: '&', lt: '<', gt: '>', apos: "'" };

function decodeEntities(s) {
  return s.replace(/&(quot|amp|lt|gt|apos|#x?[0-9a-fA-F]+);/g, (m, e) => {
    if (e[0] !== '#') return ENTITIES[e];
    const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return String.fromCodePoint(code);
  });
}

function attr(attrs, name) {
  const m = attrs.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`));
  return m ? decodeEntities(m[1]) : null;
}

// -------------------------------------------------- Zotero field parsing ----

const CITATION_MARK = 'CSL_CITATION';
const ITEM_FIELD_RE = /ADDIN\s+ZOTERO_ITEM\s+CSL_CITATION/;
const BIBL_FIELD_RE = /ADDIN\s+ZOTERO_BIBL/;

/** Extract the JSON blob that follows a marker inside a field code. */
function jsonAfter(code, marker) {
  const at = code.indexOf(marker);
  const start = code.indexOf('{', at < 0 ? 0 : at);
  const end = code.lastIndexOf('}');
  if (start < 0 || end <= start) return { value: null, error: 'no JSON object in field code' };
  try {
    return { value: JSON.parse(code.slice(start, end + 1)), error: null };
  } catch (e) {
    return { value: null, error: `field JSON does not parse: ${e.message}` };
  }
}

function citationFromCode(fieldCode, location) {
  const { value, error } = jsonAfter(fieldCode, CITATION_MARK);
  const items = (value && Array.isArray(value.citationItems))
    ? value.citationItems.map((ci) => ({
        id: ci.id ?? null,
        uris: ci.uris || [],
        itemData: ci.itemData || null,
      }))
    : [];
  return { fieldCode, citation: value, parseError: error, items, location };
}

// -------------------------------------------- flattened-citation suspects ----

// Conservative, symptom-shaped patterns; anything caught is a *suspect*
// worth a human look, never a verdict.
const NUMERIC_SUSPECT = /\[\d{1,3}(?:\s?[,;–—-]\s?\d{1,3})*\]/g;
const AUTHOR_YEAR_SUSPECT =
  /\((?:e\.g\.,?\s+)?\p{Lu}[\p{L}'’-]+(?:\s+et\s+al\.?|\s+(?:and|&)\s+\p{Lu}[\p{L}'’-]+)?,?\s+(?:19|20)\d{2}[a-z]?(?:,\s*p{0,2}\.?\s*\d+(?:[–-]\d+)?)?\)/gu;

function findSuspects(text, location, out) {
  for (const re of [NUMERIC_SUSPECT, AUTHOR_YEAR_SUSPECT]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      out.push({ kind: 'flattened-text', text: m[0], location });
    }
  }
}

// ------------------------------------------------------- part scanning ----

const TAG_RE = /<(\/?)([\w:.-]+)((?:\s+[\w:.-]+="[^"]*")*)\s*(\/?)>/g;

/**
 * Scan one WordprocessingML part (document.xml, footnotes.xml, endnotes.xml).
 * rels maps r:id -> hyperlink target for this part (Google-Docs detection).
 */
function scanPart(xml, partLabel, rels, out) {
  let paragraph = -1;
  let delDepth = 0;       // inside <w:del> — deleted by Track Changes, skip
  let tblDepth = 0;
  let footnoteId = null;
  let inFldSimple = 0;    // depth of <w:fldSimple> Zotero-or-not
  const fldStack = [];    // complex fields: { instr, state: 'instr'|'sep', startLoc, rendered }
  let textTag = null;     // 'w:t' | 'w:instrText' when between open and close
  let paraText = '';      // text outside any field, current paragraph
  let paraGoogleDocs = false;
  let hyperlinkTarget = null;

  const loc = () => ({
    part: partLabel,
    paragraph,
    ...(footnoteId !== null ? { footnoteId } : {}),
    inTable: tblDepth > 0,
    context: '',
  });

  const flushParagraph = () => {
    const trimmed = paraText.trim();
    if (trimmed) {
      const location = { ...loc(), context: trimmed.slice(0, 120) };
      if (paraGoogleDocs) {
        out.flattenedSuspects.push({ kind: 'google-docs-link', text: trimmed.slice(0, 120), location });
      }
      findSuspects(trimmed, location, out.flattenedSuspects);
    }
    paraText = '';
    paraGoogleDocs = false;
  };

  const finishField = (fieldCode, startLoc, rendered) => {
    if (ITEM_FIELD_RE.test(fieldCode)) {
      out.citations.push(citationFromCode(fieldCode, startLoc));
    } else if (BIBL_FIELD_RE.test(fieldCode)) {
      const { value, error } = jsonAfter(fieldCode, 'ZOTERO_BIBL');
      out.bibliography = {
        fieldCode,
        params: value,
        paramsError: error,
        entries: rendered.filter((e) => e.trim() !== ''),
        location: startLoc,
      };
    }
  };

  TAG_RE.lastIndex = 0;
  let m;
  let lastIndex = 0;
  while ((m = TAG_RE.exec(xml)) !== null) {
    const [, close, name, attrs, selfClose] = m;
    const textBefore = xml.slice(lastIndex, m.index);
    lastIndex = TAG_RE.lastIndex;

    // Text content of the tag we are inside.
    if (textTag && textBefore) {
      const text = decodeEntities(textBefore);
      if (textTag === 'w:instrText' && !delDepth && fldStack.length && fldStack[fldStack.length - 1].state === 'instr') {
        fldStack[fldStack.length - 1].instr += text;
      } else if (textTag === 'w:t' && !delDepth) {
        const top = fldStack[fldStack.length - 1];
        if (top && top.state === 'sep') {
          top.rendered[top.rendered.length - 1] += text;
        } else if (!inFldSimple && !top) {
          paraText += text;
          if (hyperlinkTarget && /zotero\.org\/google-docs/.test(hyperlinkTarget)) paraGoogleDocs = true;
        }
      }
    }

    if (name === 'w:t' || name === 'w:instrText') {
      textTag = close || selfClose ? null : name;
      continue;
    }

    if (close) {
      if (name === 'w:del') delDepth = Math.max(0, delDepth - 1);
      else if (name === 'w:tbl') tblDepth = Math.max(0, tblDepth - 1);
      else if (name === 'w:fldSimple') inFldSimple = Math.max(0, inFldSimple - 1);
      else if (name === 'w:p') flushParagraph();
      else if (name === 'w:hyperlink') hyperlinkTarget = null;
      else if (name === 'w:footnote' || name === 'w:endnote') footnoteId = null;
      continue;
    }

    switch (name) {
      case 'w:p':
        paragraph++;
        for (const f of fldStack) if (f.state === 'sep') f.rendered.push('');
        if (selfClose) flushParagraph();
        break;
      case 'w:del': if (!selfClose) delDepth++; break;
      case 'w:tbl': if (!selfClose) tblDepth++; break;
      case 'w:footnote':
      case 'w:endnote':
        footnoteId = attr(attrs, 'w:id');
        paragraph = -1;
        break;
      case 'w:hyperlink':
        if (!selfClose) {
          const rid = attr(attrs, 'r:id');
          hyperlinkTarget = (rid && rels.get(rid)) || null;
        }
        break;
      case 'w:fldSimple': {
        const instr = attr(attrs, 'w:instr') || '';
        if (!delDepth) finishField(instr, loc(), ['']);
        if (!selfClose) inFldSimple++;
        break;
      }
      case 'w:fldChar': {
        const type = attr(attrs, 'w:fldCharType');
        if (delDepth) break;
        if (type === 'begin') fldStack.push({ instr: '', state: 'instr', startLoc: loc(), rendered: [''] });
        else if (type === 'separate' && fldStack.length) fldStack[fldStack.length - 1].state = 'sep';
        else if (type === 'end' && fldStack.length) {
          const f = fldStack.pop();
          finishField(f.instr, f.startLoc, f.rendered);
        }
        break;
      }
    }
  }
  flushParagraph();
}

// -------------------------------------------------------------- rels ----

function parseRels(xml) {
  const rels = new Map();
  if (!xml) return rels;
  const RE = /<Relationship\b([^>]*)\/?>/g;
  let m;
  while ((m = RE.exec(xml)) !== null) {
    const id = attr(m[1], 'Id');
    const target = attr(m[1], 'Target');
    if (id && target) rels.set(id, target);
  }
  return rels;
}

// -------------------------------------------------------------- main ----

const PARTS = [
  { file: 'word/document.xml', label: 'body', rels: 'word/_rels/document.xml.rels' },
  { file: 'word/footnotes.xml', label: 'footnotes', rels: 'word/_rels/footnotes.xml.rels' },
  { file: 'word/endnotes.xml', label: 'endnotes', rels: 'word/_rels/endnotes.xml.rels' },
];

export async function extractDocx(bytes) {
  if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
  const zip = readZip(bytes);
  if (!zip.has('word/document.xml')) {
    throw new Error('No word/document.xml inside — this ZIP is not a .docx');
  }
  const decoder = new TextDecoder();
  const out = { citations: [], bibliography: null, flattenedSuspects: [], parts: [] };
  for (const part of PARTS) {
    const get = zip.get(part.file);
    if (!get) continue;
    const xml = decoder.decode(await get());
    const relsGet = zip.get(part.rels);
    const rels = parseRels(relsGet ? decoder.decode(await relsGet()) : null);
    scanPart(xml, part.label, rels, out);
    out.parts.push(part.file);
  }
  return out;
}
