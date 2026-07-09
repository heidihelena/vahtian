// SynthVahti statistics core — pure functions, no DOM.
// Imported by index.html (same-origin module; zero external requests) and by
// tools/synth-test.mjs, which asserts golden parity against metafor in CI.
"use strict";

// qnorm(0.975) to full precision so CI bounds match metafor exactly.
export const Z = 1.959963984540054;

export function splitCsv(line){
  const out=[]; let cur="",q=false;
  for(const ch of line){
    if(ch==='"'){q=!q;}
    else if(ch===","&&!q){out.push(cur);cur="";}
    else cur+=ch;
  }
  out.push(cur);
  return out.map(s=>s.replace(/^"|"$/g,""));
}

export function parseCsv(text){
  const lines=String(text||"").trim().split(/\r?\n/).filter(l=>l.trim());
  if(!lines.length) return [];
  const head=lines[0].split(",").map(s=>s.trim());
  return lines.slice(1).map(line=>{
    const cells=splitCsv(line); const o={};
    head.forEach((h,i)=>o[h]=(cells[i]||"").trim());
    return o;
  });
}

export const num=v=>{ const n=parseFloat(v); return isNaN(n)?null:n; };
export const pct=x=>x==null?"—":(100*x).toFixed(1)+"%";

const inv=x=>1/(1+Math.exp(-x));
export function logit_ci(y,v,dir){ const se=Math.sqrt(v); return inv(y+dir*Z*se); }

// DerSimonian–Laird random-effects pooling of a proportion on the logit scale.
// Continuity correction (add 0.5 to events, 1 to n) applies only to zero cells,
// matching metafor's escalc(measure="PLO", add=1/2, to="only0").
export function poolProportion(studies){ // studies: [{label, events, n}]
  const pts=[];
  for(const s of studies){
    let e=s.events, n=s.n; if(e==null||n==null||n<=0) continue;
    let ec=e, nc=n; if(e===0||e===n){ ec=e+0.5; nc=n+1; }
    const p=ec/nc, y=Math.log(p/(1-p)), v=1/(nc*p*(1-p));
    pts.push({label:s.label, p:e/n, y, v, n, lo:logit_ci(y,v,-1), hi:logit_ci(y,v,1)});
  }
  if(pts.length<1) return null;
  const sw=pts.reduce((a,s)=>a+1/s.v,0);
  const yF=pts.reduce((a,s)=>a+s.y/s.v,0)/sw;
  const Q=pts.reduce((a,s)=>a+(1/s.v)*(s.y-yF)**2,0);
  const df=pts.length-1;
  const sw2=pts.reduce((a,s)=>a+(1/s.v)**2,0);
  const C=sw-sw2/sw;
  const tau2=C>0?Math.max(0,(Q-df)/C):0;
  const I2=Q>df&&Q>0?Math.max(0,100*(Q-df)/Q):0;
  const sws=pts.reduce((a,s)=>a+1/(s.v+tau2),0);
  const yR=pts.reduce((a,s)=>a+s.y/(s.v+tau2),0)/sws;
  const seR=Math.sqrt(1/sws);
  return { k:pts.length, studies:pts.map(s=>({...s, w:1/(s.v+tau2)})),
    pooled:inv(yR), lo:inv(yR-Z*seR), hi:inv(yR+Z*seR), yR, seR, tau2, I2, Q, df };
}

export const REQUIRED_ANY=[["tp","fp","fn","tn"],["opa","n"]];
export const KNOWN_COLUMNS="record_id, cutoff, tp, fp, fn, tn, n, opa, kappa_linear";

// Groups rows by cutoff and pools OPA / sensitivity / specificity per group.
// Returns {cutoffs:[...], n_rows, skipped:[{row,reason}]}.
export function synthesise(rows){
  const byCut={}; const skipped=[];
  rows.forEach((r,idx)=>{
    const c=r.cutoff||"(none)"; (byCut[c]=byCut[c]||[]).push({r,idx});
  });
  const out={cutoffs:[], n_rows:rows.length, skipped};
  for(const c of Object.keys(byCut)){
    const rs=byCut[c];
    const opaStud=[], sensStud=[], specStud=[]; const kappas=[];
    for(const {r,idx} of rs){
      const tp=num(r.tp),fp=num(r.fp),fn=num(r.fn),tn=num(r.tn),n=num(r.n),opa=num(r.opa),kp=num(r.kappa_linear);
      const lab=r.record_id||("row "+(idx+2));
      if(tp!=null&&fp!=null&&fn!=null&&tn!=null){
        const tot=tp+fp+fn+tn;
        opaStud.push({label:lab, events:tp+tn, n:tot});
        sensStud.push({label:lab, events:tp, n:tp+fn});
        specStud.push({label:lab, events:tn, n:tn+fp});
      } else if(opa!=null&&n!=null){
        opaStud.push({label:lab, events:Math.round(opa*n), n});
      } else {
        skipped.push({row:idx+2, label:lab, reason:"needs tp,fp,fn,tn (or opa+n)"});
        continue;
      }
      if(kp!=null) kappas.push(kp);
    }
    out.cutoffs.push({ cutoff:c, k:rs.length,
      opa:poolProportion(opaStud), sens:poolProportion(sensStud), spec:poolProportion(specStud),
      kappa: kappas.length?{n:kappas.length, mean:kappas.reduce((a,b)=>a+b,0)/kappas.length, min:Math.min(...kappas), max:Math.max(...kappas)}:null });
  }
  return out;
}

// ---------- figures (SVG strings; print-weight text and marks) ----------
const escXml=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const INK="#1C1830", SUBINK="#4A4460", GRID="#E7E3F0", NAVY="#2D2440",
      TEAL="#1E9E8A", TEALD="#08544A", VIOLET="#6F52B8";

// A "nice" axis domain zoomed to the data, so agreement clustered at 78–100%
// doesn't crush against a fixed 0–100 axis. Rounds out to 5% steps, clamps to
// [0,1], keeps a sensible minimum span, and always shows ≥4 labelled ticks.
export function forestDomain(pool){
  const vals=[];
  for(const s of pool.studies){ vals.push(s.lo, s.hi); }
  vals.push(pool.lo, pool.hi);
  let lo=Math.min(...vals), hi=Math.max(...vals);
  const pad=Math.max((hi-lo)*0.12, 0.01);
  lo=Math.max(0, Math.floor((lo-pad)*20)/20);   // down to nearest 5%
  hi=Math.min(1, Math.ceil((hi+pad)*20)/20);     // up to nearest 5%
  if(hi-lo<0.15){ lo=Math.max(0,hi-0.15); }      // minimum readable span
  // pick a tick step giving ~4–6 ticks
  const span=hi-lo;
  const step=span>0.6?0.2:span>0.3?0.1:0.05;
  const ticks=[]; for(let t=Math.ceil(lo/step)*step; t<=hi+1e-9; t+=step) ticks.push(+t.toFixed(4));
  return {lo, hi, ticks};
}

export function forestSvg(title, pool, fmt){
  if(!pool) return `<p class="muted">No poolable data.</p>`;
  const S=pool.studies, n=S.length, rowH=28, top=64, bot=84;
  const W=840, labX=16, x0=248, x1=560, estX=572, wX=824;
  const H=top+n*rowH+bot;
  const dom=forestDomain(pool);
  const sx=p=>{ const t=(Math.max(dom.lo,Math.min(dom.hi,p))-dom.lo)/(dom.hi-dom.lo); return x0+(x1-x0)*t; };
  const swAll=S.reduce((a,b)=>a+b.w,0);
  let g=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system,Segoe UI,Roboto,sans-serif" role="img" aria-label="${escXml('Forest plot: '+title)}">`;
  g+=`<title>${escXml('Forest plot — '+title)}</title>`;
  g+=`<rect width="${W}" height="${H}" fill="#ffffff"/>`;
  g+=`<text x="${labX}" y="28" font-size="16" font-weight="700" fill="${INK}">${escXml(title)}</text>`;
  g+=`<text x="${labX}" y="47" font-size="12" fill="${SUBINK}">random-effects (DerSimonian–Laird, logit) · k=${pool.k} · I²=${pool.I2.toFixed(0)}% · τ²=${pool.tau2.toFixed(3)}</text>`;
  // column headers
  g+=`<text x="${estX}" y="${top-6}" font-size="11" font-weight="600" fill="${SUBINK}">estimate [95% CI]</text>`;
  g+=`<text x="${wX}" y="${top-6}" font-size="11" font-weight="600" fill="${SUBINK}" text-anchor="end">weight</text>`;
  // axis grid + labels (zoomed domain)
  for(const t of dom.ticks){
    const x=sx(t);
    g+=`<line x1="${x}" y1="${top-4}" x2="${x}" y2="${top+n*rowH+6}" stroke="${GRID}"/>`;
    g+=`<text x="${x}" y="${top+n*rowH+24}" font-size="11.5" fill="${SUBINK}" text-anchor="middle">${(t*100).toFixed(t*100%1?1:0)}</text>`;
  }
  g+=`<text x="${(x0+x1)/2}" y="${top+n*rowH+44}" font-size="12" fill="${SUBINK}" text-anchor="middle">agreement (%)</text>`;
  // pooled reference line through the study rows
  const cxP=sx(pool.pooled);
  g+=`<line x1="${cxP}" y1="${top-4}" x2="${cxP}" y2="${top+n*rowH+6}" stroke="${TEAL}" stroke-dasharray="4 4" stroke-width="1.3"/>`;
  S.forEach((s,i)=>{ const y=top+i*rowH+rowH/2;
    g+=`<text x="${labX}" y="${y+4.5}" font-size="12.5" fill="${INK}">${escXml(String(s.label).slice(0,26))}</text>`;
    g+=`<line x1="${sx(s.lo)}" y1="${y}" x2="${sx(s.hi)}" y2="${y}" stroke="#3A3450" stroke-width="2" stroke-linecap="round"/>`;
    const sz=Math.max(6, 5+9*Math.sqrt(s.w/swAll));
    g+=`<rect x="${sx(s.p)-sz/2}" y="${y-sz/2}" width="${sz}" height="${sz}" rx="1" fill="${NAVY}"/>`;
    g+=`<text x="${estX}" y="${y+4.5}" font-size="12" fill="${INK}">${fmt(s.p)} [${fmt(s.lo)}, ${fmt(s.hi)}]</text>`;
    g+=`<text x="${wX}" y="${y+4.5}" font-size="12" fill="${SUBINK}" text-anchor="end">${(100*s.w/swAll).toFixed(1)}%</text>`;
  });
  // pooled diamond
  const yD=top+n*rowH+12, cx=sx(pool.pooled), l=sx(pool.lo), r=sx(pool.hi);
  g+=`<polygon points="${l},${yD} ${cx},${yD-8} ${r},${yD} ${cx},${yD+8}" fill="${TEAL}" stroke="${TEALD}" stroke-width="1.4"/>`;
  g+=`<text x="${labX}" y="${yD+4.5}" font-size="12.5" font-weight="700" fill="${TEALD}">Pooled (RE)</text>`;
  g+=`<text x="${estX}" y="${yD+4.5}" font-size="12.5" font-weight="700" fill="${TEALD}">${fmt(pool.pooled)} [${fmt(pool.lo)}, ${fmt(pool.hi)}]</text>`;
  g+=`<text x="${wX}" y="${yD+4.5}" font-size="12" font-weight="700" fill="${TEALD}" text-anchor="end">100%</text>`;
  g+=`</svg>`;
  return g;
}

export function funnelSvg(title, pool){
  if(!pool||pool.k<3) return `<p class="muted">Funnel needs ≥3 studies.</p>`;
  const W=560,H=380,padL=68,padB=64,padT=44,padR=24;
  const ys=pool.studies.map(s=>Math.sqrt(s.v)); const seMax=Math.max(...ys)*1.1;
  const xs=pool.studies.map(s=>s.y); const c=pool.yR;
  const xspan=Math.max(...xs.map(x=>Math.abs(x-c)),1)*1.2;
  const X=v=>padL+(W-padL-padR)*((v-(c-xspan))/(2*xspan));
  const Y=se=>padT+(H-padT-padB)*(se/seMax);
  let g=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system,Segoe UI,Roboto,sans-serif" role="img" aria-label="${escXml('Funnel plot: '+title)}">`;
  g+=`<title>${escXml('Funnel plot — '+title)}</title>`;
  g+=`<rect width="${W}" height="${H}" fill="#fff"/>`;
  g+=`<text x="16" y="26" font-size="15" font-weight="700" fill="${INK}">${escXml(title)}</text>`;
  const seB=seMax, xL=c-Z*seB, xR=c+Z*seB;
  g+=`<polygon points="${X(c)},${Y(0)} ${X(xL)},${Y(seB)} ${X(xR)},${Y(seB)}" fill="#F4F1FB" stroke="${VIOLET}" stroke-width="1.4"/>`;
  g+=`<line x1="${X(c)}" y1="${Y(0)}" x2="${X(c)}" y2="${Y(seMax)}" stroke="${VIOLET}" stroke-width="1.4" stroke-dasharray="4 3"/>`;
  pool.studies.forEach(s=>{ g+=`<circle cx="${X(s.y)}" cy="${Y(Math.sqrt(s.v))}" r="4.5" fill="${NAVY}"/>`; });
  g+=`<text x="${(padL+W-padR)/2}" y="${H-34}" font-size="12" fill="${SUBINK}" text-anchor="middle">logit proportion (effect)</text>`;
  g+=`<text x="16" y="${padT+(H-padT-padB)/2}" font-size="12" fill="${SUBINK}" transform="rotate(-90 16 ${padT+(H-padT-padB)/2})" text-anchor="middle">standard error</text>`;
  g+=`<text x="${padL}" y="${H-14}" font-size="11" fill="${SUBINK}">Visual only — Deeks&#39; funnel-asymmetry test (the DTA-appropriate test) runs in synthesis.R</text>`;
  g+=`</svg>`;
  return g;
}

// ---------- exports: report + generated R ----------
export function buildReport(M){
  const L=[];
  L.push("# DTA agreement synthesis — SynthVahti (browser half)\n");
  L.push("> Random-effects (DerSimonian–Laird, logit scale). Sensitivity/specificity are **agreement vs an imperfect reference, not accuracy**. κ is descriptive. The HSROC / bivariate model, complex random effects, sensitivity analyses, and publication-bias (Deeks) run in R (synthesis.R), package-versioned.\n");
  L.push("| cutoff | studies | pooled OPA [95% CI] | I² | τ² | pooled sens* | pooled spec* | κ mean (range) |");
  L.push("|---|---|---|---|---|---|---|---|");
  for(const c of M.cutoffs){
    L.push(`| ${c.cutoff} | ${c.k} | ${c.opa?pct(c.opa.pooled)+" ["+pct(c.opa.lo)+", "+pct(c.opa.hi)+"]":"—"} | ${c.opa?c.opa.I2.toFixed(0)+"%":"—"} | ${c.opa?c.opa.tau2.toFixed(3):"—"} | ${c.sens?pct(c.sens.pooled):"—"} | ${c.spec?pct(c.spec.pooled):"—"} | ${c.kappa?c.kappa.mean.toFixed(2)+" ("+c.kappa.min.toFixed(2)+"–"+c.kappa.max.toFixed(2)+")":"—"} |`);
  }
  L.push("\n*agreement vs an imperfect reference, not accuracy.\n");
  L.push("**Method note:** DerSimonian–Laird can underestimate τ² when studies are few; the generated synthesis.R includes the sensitivity analyses to check this.");
  L.push("**Headline analysis (R):** bivariate/HSROC, complex random effects, pre-specified sensitivity analyses, and Deeks' publication-bias test — see synthesis.R, with sessionInfo()/renv for package-versioned reproducibility.");
  return L.join("\n")+"\n";
}

export function buildRScript(){
  return `# synthesis.R — headline DTA meta-analysis (run in R; the reproducible, package-versioned half)
# Input: extraction.csv from ExtractVahti (record_id, cutoff, tp, fp, fn, tn, ...).
# SynthVahti (browser) already did agreement pooling + figures; R does HSROC / bivariate / pub-bias.
#
# Reproducibility: capture exact package versions.
#   install.packages("renv"); renv::init(); renv::snapshot()
# and record sessionInfo() in the manuscript supplement.

library(mada)   # bivariate (Reitsma) + SROC for diagnostic test accuracy

d <- read.csv("extraction.csv", stringsAsFactors = FALSE)
d <- subset(d, !is.na(tp) & !is.na(fp) & !is.na(fn) & !is.na(tn))   # reconstructable 2x2 only

for (cut in unique(d$cutoff)) {
  dd <- subset(d, cutoff == cut)
  if (nrow(dd) < 4) { message("skip ", cut, " (k<4: bivariate model needs a few studies)"); next }
  message("=== cutoff ", cut, " (k=", nrow(dd), ") ===")

  # mada expects the 2x2 in uppercase columns
  m <- data.frame(TP = dd$tp, FP = dd$fp, FN = dd$fn, TN = dd$tn)

  fit <- reitsma(m)                    # bivariate model (pooled logit-sens/spec + correlation)
  print(summary(fit))

  slug <- gsub("[^0-9a-zA-Z]", "", cut)
  png(sprintf("sroc-%s.png", slug), width = 1600, height = 1600, res = 300)
  plot(fit, sroclwd = 2, main = sprintf("SROC - %s", cut))   # summary ROC + confidence region
  points(fpr(m), sens(m), pch = 19)
  dev.off()

  # Deeks' funnel-asymmetry test (the DTA-appropriate publication-bias test):
  # regress lnDOR on 1/sqrt(ESS), weighted by ESS; slope P < 0.10 suggests asymmetry.
  n_dis  <- dd$tp + dd$fn
  n_non  <- dd$fp + dd$tn
  lnDOR  <- log(((dd$tp + 0.5) * (dd$tn + 0.5)) / ((dd$fp + 0.5) * (dd$fn + 0.5)))
  ess    <- 4 * n_dis * n_non / (n_dis + n_non)
  deeks  <- lm(lnDOR ~ I(1 / sqrt(ess)), weights = ess)
  cat("Deeks' funnel-asymmetry test (slope row; P < 0.10 suggests asymmetry):\\n")
  print(summary(deeks)$coefficients)
}

# Sensitivity analyses (pre-specified): re-run the above on subsets, e.g.
#   subset(d, reference_standard == ">=2-path consensus"); subset(d, era == "post-2018")
sessionInfo()
`;
}
