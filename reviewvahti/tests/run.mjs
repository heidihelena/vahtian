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
  'classifyDocs','validateBundle','voteCategory','claimMatrix','pairsFor','reviewClaim',
  'reliabilityUnits','krippendorffAlpha','fleissKappa','interpretAlpha',
  'isRetrievalPositive','aiPerformance','bootstrapKappaCI','crc32','zipStore','prismaCounts'];
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

// ---- phase 2: Krippendorff's α + Fleiss' κ (hand-worked on a 3-rater × 4-unit example) ----
// units: u1=[1,1,1] u2=[1,1,2] u3=[2,2,2] u4=[1,2,2]. By hand: α = 0.3889, Fleiss κ = 0.3333.
{
  const units = { u1:['1','1','1'], u2:['1','1','2'], u3:['2','2','2'], u4:['1','2','2'] };
  near(C.krippendorffAlpha(units).value, 0.3888888888888889, 'krippendorff α = 0.3889', 1e-9);
  near(C.fleissKappa(units).value, 0.3333333333333333, 'fleiss κ = 0.3333', 1e-9);
  // perfect agreement → α = 1
  near(C.krippendorffAlpha({ a:['x','x'], b:['y','y'] }).value, 1, 'α: perfect agreement → 1');
  // Fleiss refuses unequal coverage; α still computes
  const uneq = { u1:['1','1','2'], u2:['1','2'] };
  eq(C.fleissKappa(uneq).value, null, 'fleiss: unequal coverage → null');
  ok(C.krippendorffAlpha(uneq).value != null, 'α: still computes on unequal coverage');
  eq(C.interpretAlpha(0.85), 'reliable', 'interpret α 0.85'); eq(C.interpretAlpha(0.70), 'tentative — use cautiously', 'interpret α 0.70');
  eq(C.interpretAlpha(0.40), 'unreliable', 'interpret α 0.40');
}

// ---- readStoreZip walks MULTIPLE local-file headers (a real export has protocol + ballot + README) ----
{
  const enc=new TextEncoder();
  const entry=(name,data)=>{ const nB=enc.encode(name), dB=enc.encode(data);
    const h=[0x50,0x4b,0x03,0x04,20,0,0,0,0,0,0,0,0,0,0,0,0,0,dB.length&0xFF,(dB.length>>>8)&0xFF,0,0,dB.length&0xFF,(dB.length>>>8)&0xFF,0,0,nB.length&0xFF,(nB.length>>>8)&0xFF,0,0];
    const b=new Uint8Array(h.length+nB.length+dB.length); b.set(h,0); b.set(nB,h.length); b.set(dB,h.length+nB.length); return b; };
  const e1=entry('protocol-c1.json','{"a":1}'), e2=entry('ballot-c1-R1.json','{"b":2}'), e3=entry('README.txt','hi');
  const all=new Uint8Array(e1.length+e2.length+e3.length); all.set(e1,0); all.set(e2,e1.length); all.set(e3,e1.length+e2.length);
  const out=C.readStoreZip(all);
  eq(out.length, 3, 'zip reader: walks 3 entries');
  eq(out.map(x=>x.name), ['protocol-c1.json','ballot-c1-R1.json','README.txt'], 'zip reader: names in order');
  eq(out[1].text, '{"b":2}', 'zip reader: second payload');
}

// ---- ≥3-rater integration: reviewClaim returns α + Fleiss ----
{
  const protocol={ regime:'screening', objective:{type:'pico_question',text:'X improves Y.'},
    ballot_spec:{categories:['directly_supports','does_not_support'],scale_type:'nominal'}, reason_codes:[],
    records:[{record_id:'r1',identity:{pmid:'1'}},{record_id:'r2',identity:{pmid:'2'}}] };
  protocol.protocol_hash=await C.protocolHash(protocol);
  const mk=(id,v1,v2)=>({protocol_hash:protocol.protocol_hash,round:1,rater:{rater_id:id,rater_type:'human'},
    votes:[{record_id:'r1',value:v1},{record_id:'r2',value:v2}]});
  const { groups } = await C.validateBundle([protocol],
    [mk('R1','directly_supports','does_not_support'), mk('R2','directly_supports','does_not_support'), mk('R3','directly_supports','directly_supports')]);
  const r=C.reviewClaim(groups[0]);
  eq(r.n, 3, '≥3: three reviewers'); eq(r.tier, 'review', '≥3: review tier');
  ok(r.alpha && r.alpha.value!=null, '≥3: Krippendorff α computed');
  ok(r.fleiss && r.fleiss.value!=null, '≥3: Fleiss κ computed (equal coverage)');
  eq(r.pairwise.length, 3, '≥3: three pairwise comparisons');
  eq(r.conflicts.length, 1, '≥3: r2 is a conflict (R3 disagrees)');
}

// ---- phase 3a: AI performance vs the human-agreed reference (hand-worked confusion) ----
{
  // humans agree on r1 (pos), r2 (neg), r4 (neg); disagree on r3 (excluded from the reference)
  const human = {
    R1:{ r1:'directly_supports', r2:'does_not_support', r3:'directly_supports', r4:'not_relevant' },
    R2:{ r1:'directly_supports', r2:'does_not_support', r3:'does_not_support', r4:'not_relevant' }
  };
  const aiM = { AI:{ r1:'directly_supports', r2:'directly_supports', r3:'contradicts', r4:'does_not_support' } };
  const p = C.aiPerformance(human, aiM);
  eq([p.TP,p.FP,p.TN,p.FN], [1,1,1,0], 'aiPerf: confusion on the agreed subset (r3 excluded)');
  eq(p.n, 3, 'aiPerf: N = agreed records the AI also rated');
  near(p.sensitivity, 1, 'aiPerf: sensitivity 1.0'); near(p.specificity, 0.5, 'aiPerf: specificity 0.5');
  near(p.ppv, 0.5, 'aiPerf: PPV 0.5'); near(p.npv, 1, 'aiPerf: NPV 1.0');
  near(p.wss95, 1/3 - 0.05, 'aiPerf: WSS@95 = (TN+FN)/N − 0.05');
  ok(p.recallMeets95 === true, 'aiPerf: recall meets 95%');
  near(p.kappa.value, 0.4, 'aiPerf: κ(AI vs agreed humans) = 0.4');
  eq(C.isRetrievalPositive('partially_supports'), true, 'supporting is retrieval-positive');
  eq(C.isRetrievalPositive('not_relevant'), false, 'not_relevant is retrieval-negative');
  eq(C.aiPerformance(human, {}).n, 0, 'aiPerf: no AI ratings → n 0');
}

// ---- phase 3a: bootstrap CI for κ (structural — randomized) ----
{
  const pairs = [['a','a'],['a','b'],['b','b'],['b','b'],['a','a'],['b','a'],['a','a'],['b','b']];
  const ci = C.bootstrapKappaCI(pairs, 500);
  ok(ci.lo != null && ci.hi != null, 'bootstrap: CI estimated for ≥5 records');
  ok(ci.lo <= ci.hi, 'bootstrap: lo ≤ hi');
  ok(ci.lo >= -1 && ci.hi <= 1, 'bootstrap: within κ range');
  ok(C.bootstrapKappaCI([['a','a'],['a','b']]).lo === null, 'bootstrap: <5 records → no CI');
}

// ---- phase 3a: zipStore (vendored byte-equal) round-trips through readStoreZip ----
{
  eq(C.crc32(new TextEncoder().encode('123456789')), 0xCBF43926, 'crc32: standard check value');
  const zip = C.zipStore([{ name:'summary.html', data:'<h1>x</h1>' }, { name:'reconciled.jsonl', data:'{"a":1}\n' }]);
  ok(zip[0] === 0x50 && zip[1] === 0x4B, 'zipStore: PK magic');
  const back = C.readStoreZip(zip);
  eq(back.map(x=>x.name), ['summary.html','reconciled.jsonl'], 'zip round-trip: names');
  eq(back[0].text, '<h1>x</h1>', 'zip round-trip: payload 1'); eq(back[1].text, '{"a":1}\n', 'zip round-trip: payload 2');
}

// ---- phase 3b: PRISMA screening counts (computed lower half + provenance upper half) ----
{
  const review = {
    records: 5,
    dispositions: [
      { votes:{ R1:'directly_supports', R2:'directly_supports' } },   // sought
      { votes:{ R1:'does_not_support',  R2:'does_not_support'  } },   // excluded
      { votes:{ R1:'partially_supports' } },                          // sought (1 vote)
      { votes:{ R1:'not_relevant',      R2:'not_relevant'      } }    // excluded
    ],   // 4 of 5 records screened
    sourceProvenance: { databases:[{ name:'PubMed', hits:120 }, { name:'Embase', hits:80 }], duplicates_removed:30 }
  };
  const p = C.prismaCounts(review);
  eq(p.screened, 4, 'prisma: screened = records with ≥1 vote');
  eq(p.sought, 2, 'prisma: sought = any supporting vote');
  eq(p.excluded, 2, 'prisma: excluded = all non-supporting');
  eq(p.sought + p.excluded, p.screened, 'prisma: sought + excluded = screened');
  eq(p.notScreened, 1, 'prisma: 1 protocol record not yet screened');
  eq(p.identified, 200, 'prisma: identified = sum of database hits');
  eq(p.duplicates, 30, 'prisma: duplicates from provenance');
  // no hit counts in provenance → identified null (filled from the search log)
  const p2 = C.prismaCounts({ records:2, dispositions:[{votes:{R1:'directly_supports'}}], sourceProvenance:{ databases:[{name:'PubMed'}] } });
  eq(p2.identified, null, 'prisma: identified null when hits absent');
  eq(p2.duplicates, null, 'prisma: duplicates null when absent');
  eq(p2.sought, 1, 'prisma: sought counted without provenance');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
