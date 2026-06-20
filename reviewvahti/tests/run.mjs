// ReviewVahti — zero-dependency test harness. Run: `node tests/run.mjs`
// Loads the pure CORE block out of index.html and exercises it in a vm context.
// PARITY LOCK: the golden protocol_hash / normalizeClaimText / cohenKappa / record values below
// were computed from MatchVahti's canonical CORE. They MUST stay equal — any drift in this
// vendored copy (or in MatchVahti) breaks the lock, exactly like normalizeClaimText's vectors.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, '..', 'index.html'), 'utf8');
const lines = html.split('\n');
const a = lines.findIndex(l => l.includes('CORE START'));
const b = lines.findIndex(l => l.includes('CORE END'));
if (a < 0 || b < 0) { console.error('CORE markers not found'); process.exit(2); }
const names = ['sha256','normalizeClaimText','canonicalJson','canonicalObjective','canonicalProtocolPayload',
  'protocolHash','tierOf','cohenKappa','rawAgreement','pabak','gwetAC1','interpretKappa','readStoreZip',
  'classifyDocs','validateBundle','voteCategory','claimMatrix','pairsFor','reviewClaim'];
const src = lines.slice(a + 1, b).join('\n') + `\n;globalThis.__core = {${names.join(',')}};`;
const context = { crypto: webcrypto, TextEncoder, TextDecoder, console };
vm.createContext(context);
vm.runInContext(src, context);
const C = context.__core;

let pass = 0, fail = 0;
const eq = (got, want, msg) => { if (JSON.stringify(got) === JSON.stringify(want)) pass++;
  else { fail++; console.error('FAIL:', msg, '\n  got: ', JSON.stringify(got), '\n  want:', JSON.stringify(want)); } };
const ok = (c, msg) => { if (c) pass++; else { fail++; console.error('FAIL:', msg); } };
const near = (got, want, msg, tol=1e-9) => { if (got!=null && Math.abs(got-want) < tol) pass++;
  else { fail++; console.error('FAIL:', msg, '\n  got:', got, 'want:', want); } };

// ---- PARITY golden vectors (byte-equal with MatchVahti CORE) ----
eq(C.normalizeClaimText('  LDCT  Reduces   Mortality '), 'ldct reduces mortality', 'parity: normalizeClaimText');
eq(C.tierOf(8), 'guideline', 'parity: tierOf 8+'); eq(C.tierOf(2), 'review', 'parity: tierOf 2');
eq(C.tierOf(1), 'individual', 'parity: tierOf 1'); eq(C.tierOf(0), 'none', 'parity: tierOf 0');
const GOLDEN_PROTOCOL = {
  regime:'screening', objective:{ type:'pico_question', text:'Adjuvant osimertinib improves DFS.' },
  ballot_spec:{ categories:['directly_supports','does_not_support'], scale_type:'nominal' }, reason_codes:[],
  records:[ { record_id:'r2', identity:{ pmid:'222' } }, { record_id:'r1', identity:{ pmid:'111' } } ]
};
eq(await C.protocolHash(GOLDEN_PROTOCOL),
   'de9272fae84c7e4141c0eec8af8eefb2c22fd1b015f8b706990108bd90ba559c',
   'parity: protocol_hash golden (byte-equal with MatchVahti)');
// canonical hash is order/cosmetic-invariant (record order, display fields) but breaks on the record set
eq(await C.protocolHash(GOLDEN_PROTOCOL),
   await C.protocolHash({ ...GOLDEN_PROTOCOL, title:'x', created_at:'now',
     records:[ { record_id:'r1', identity:{ pmid:'111' }, display:{ title:'t' } }, { record_id:'r2', identity:{ pmid:'222' } } ] }),
   'parity: protocol_hash ignores order + display/title/created_at');

// ---- cohenKappa golden + new reliability stats (hand-worked on the same 4 pairs) ----
const PAIRS = [['a','a'],['a','b'],['b','b'],['b','b']];   // agree 3/4; A={a:2,b:2} B={a:1,b:3}
const k = C.cohenKappa(PAIRS);
near(k.value, 0.5, 'cohenKappa value (golden 0.5)'); near(k.po, 0.75, 'cohenKappa po'); near(k.pe, 0.5, 'cohenKappa pe');
near(C.rawAgreement(PAIRS).value, 0.75, 'rawAgreement 0.75');
near(C.pabak(PAIRS).value, 0.5, 'pabak 0.5 (q=2)');
near(C.gwetAC1(PAIRS).value, 0.5294117647058824, 'gwetAC1 ~0.5294', 1e-9);
eq(C.interpretKappa(0.5), 'moderate', 'interpret 0.5 → moderate');
eq(C.interpretKappa(0.85), 'almost perfect', 'interpret 0.85');
eq(C.interpretKappa(-0.1), 'poor (worse than chance)', 'interpret negative');
eq(C.cohenKappa([]).value, null, 'kappa: empty → null');
eq(C.cohenKappa([['a','a'],['a','a']]).value, null, 'kappa: one category → degenerate null');

// ---- STORE-zip reader (build one local-file-header entry by hand; no zipStore dependency) ----
{
  const enc = new TextEncoder();
  const name = 'ballot.json', data = '{"x":1}';
  const nameB = enc.encode(name), dataB = enc.encode(data);
  const head = [0x50,0x4b,0x03,0x04, 20,0, 0,0, 0,0, 0,0, 0,0, 0,0,0,0,
    dataB.length&0xFF,(dataB.length>>>8)&0xFF,0,0, dataB.length&0xFF,(dataB.length>>>8)&0xFF,0,0,
    nameB.length&0xFF,(nameB.length>>>8)&0xFF, 0,0];
  const bytes = new Uint8Array(head.length + nameB.length + dataB.length);
  bytes.set(head,0); bytes.set(nameB, head.length); bytes.set(dataB, head.length+nameB.length);
  const entries = C.readStoreZip(bytes);
  eq(entries.length, 1, 'zip reader: one entry'); eq(entries[0].name, 'ballot.json', 'zip reader: name');
  eq(entries[0].text, '{"x":1}', 'zip reader: payload');
}

// ---- classify → validate → reviewClaim integration (1 protocol + 2 reviewers) ----
{
  const protocol = { ...GOLDEN_PROTOCOL };
  protocol.protocol_hash = await C.protocolHash(protocol);
  const ballotR1 = { protocol_hash: protocol.protocol_hash, round:1, rater:{ rater_id:'R1', rater_type:'human' },
    votes:[ { record_id:'r1', value:'directly_supports' }, { record_id:'r2', value:'does_not_support' } ] };
  const ballotR2 = { protocol_hash: protocol.protocol_hash, round:1, rater:{ rater_id:'R2', rater_type:'human' },
    votes:[ { record_id:'r1', value:'directly_supports' }, { record_id:'r2', value:'directly_supports' } ] };
  const ai = { protocol_hash: protocol.protocol_hash, round:1, rater:{ rater_id:'AI', rater_type:'ai' },
    votes:[ { record_id:'r1', value:'contradicts' } ] };
  const cls = C.classifyDocs([protocol, ballotR1, ballotR2, ai]);
  eq(cls.protocols.length, 1, 'classify: 1 protocol'); eq(cls.ballots.length, 3, 'classify: 3 ballots');
  const { groups, problems } = await C.validateBundle(cls.protocols, cls.ballots);
  eq(problems.length, 0, 'validate: no problems (hash matches)');
  eq(groups.length, 1, 'validate: one claim group');
  const r = C.reviewClaim(groups[0]);
  eq(r.n, 2, 'review: 2 human reviewers (AI excluded from κ)');
  eq(r.aiN, 1, 'review: AI ballot counted separately');
  eq(r.tier, 'review', 'review: tier = review');
  eq(r.two.compared, 2, 'review: both records jointly rated');
  // r1 agree (directly/directly), r2 disagree (does_not_support vs directly) → raw 0.5, 1 conflict
  near(r.two.raw.value, 0.5, 'review: raw agreement 0.5');
  eq(r.conflicts.length, 1, 'review: one conflict record');
  eq(r.conflicts[0].record_id, 'r2', 'review: the conflict is r2');
  // an orphan ballot (wrong hash) is reported, not scored
  const orphan = { protocol_hash:'deadbeef', round:1, rater:{ rater_id:'RX', rater_type:'human' }, votes:[] };
  const v2 = await C.validateBundle([protocol], [ballotR1, orphan]);
  ok(v2.problems.some(p=>p.kind==='orphan_ballot'), 'validate: orphan ballot flagged');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
