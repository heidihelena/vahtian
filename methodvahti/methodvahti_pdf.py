"""
MethodVahti — sample-size optimisation + COREQ/SRQR PDF report
Vahtian · Apache-2.0 licence · part of the EpiNet toolkit

Two public functions:

    optimise_n(params)        -> dict   (pure Python; no reportlab needed)
    build(report, out_path)   -> str    (renders the branded PDF)

`optimise_n` synthesises three sample-size models — linear saturation,
network complexity, and fuzzy-set QCA configurational adequacy — and adjusts
the synthesis for information power. The three estimates are always returned
alongside the synthesis: the number is a decision aid, never a verdict.

Evidence grading (never removed from the report):
    ◆ Consensus         broad methodological agreement
    ◇ Contested         legitimate expert disagreement
    ○ Author hypothesis Vahtian's construction — not externally validated
    ◌ Opinion range     researcher/team decision — no universal standard

All three models and the synthesis are ○ Author hypothesis. They are not
externally validated — see methodvahti/VALIDATION.md.

Brand: STYLE.md (navy #2D2440, violet #8B6FC9, lilac #C5B8E8). Body text uses
the bundled, embedded Liberation Sans/Mono (SIL OFL, assets/fonts/) — the same
system-stack approximation the brand's social-card generator uses — so the
report carries its own fonts. The four evidence glyphs are drawn as vector
shapes (not font characters) so they render regardless of font coverage.
"""
from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Optional


# ── Brand palette (STYLE.md) ──────────────────────────────────────────────────

NAVY   = "#2D2440"
VIOLET = "#8B6FC9"
LILAC  = "#C5B8E8"
INDIGO = "#5566B5"
INK    = "#1C1830"
MUTED  = "#5B5570"
BG     = "#FAF9FC"
CARD   = "#FFFFFF"
LINE   = "#E7E3F0"

# Depth → saturation base, grounded in the code-vs-meaning saturation
# literature (Hennink, Kaiser & Marconi 2017: code ≈ 9, meaning ≈ 16–24).
# ◇ Contested — these anchors are debated, not settled.
_DEPTH_BASE = {"descriptive": 9, "explanatory": 16, "theoretical": 24}


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, float(x)))


# The four evidence glyphs are drawn as vector shapes (see _evidence_glyph).
# The body font may not cover every code point, so strip the glyphs from any
# running text — the words ("Author hypothesis", "Consensus", …) and the drawn
# legend carry the meaning.
_EV_GLYPHS = "◆◇○◌"


def _san(s) -> str:
    s = str(s)
    for gph in _EV_GLYPHS:
        s = s.replace(gph + " ", "").replace(gph, "")
    return " ".join(s.split()) if s.strip() else s


# ── Three sample-size models ──────────────────────────────────────────────────
#
# Each returns an integer estimate. All are ○ Author hypothesis: principled,
# deterministic, monotonic — but not externally validated.

def _model_linear_saturation(base: int, H: float, p: float, Q: float) -> float:
    """Saturation grows with heterogeneity and with rarity of the target theme;
    richer data lowers it. (Guest 2006 / Hennink 2017 family.)"""
    return base * (1 + 0.90 * H) * (1 + 0.50 * (1 - p)) * (1 - 0.25 * (Q - 0.5) * 2)


def _model_network_complexity(base: int, H: float, S: float, T: float, Q: float) -> float:
    """Information-power view (Malterud 2016): a narrow aim, a strong theory and
    rich dialogue all lower the N needed to map the concept network."""
    return (base * (1 + 1.10 * H)
            * (1 - 0.35 * S) * (1 - 0.25 * T) * (1 - 0.15 * (Q - 0.5) * 2))


def _model_fuzzy_set_qca(base: int, H: float, S: float,
                         comparative_floor: Optional[int]) -> float:
    """Configurational adequacy: enough cases to cover the plausible
    configurations. Diversity = heterogeneity × aim breadth."""
    diversity = H * (1 - S)
    n = base * 0.80 + 18.0 * diversity
    if comparative_floor is not None:
        n = max(n, comparative_floor)
    return n


def optimise_n(params: dict) -> dict:
    """
    Synthesise three sample-size models with an information-power adjustment.

    params (all 0.0–1.0 unless noted):
        heterogeneity        required — typically result.primary_score["value"]
        theme_prevalence     how common the target theme is        (default 0.30)
        depth                "descriptive"|"explanatory"|"theoretical" (default "explanatory")
        specificity          narrow aim = high specificity         (default 0.50)
        theory_strength      strength of the framework             (default 0.50)
        data_quality         expected richness                     (default 0.50)
        power                target evidential power               (default 0.80)
        mixed_methods        bool                                  (default False)
        min_detectable_diff  if mixed_methods: minimum group diff  (e.g. 0.20)

    Returns a dict with optimal_n, the three model estimates, the
    information-power index, a stability range, and full provenance.
    The synthesis is ○ Author hypothesis — show all three models.
    """
    H = _clamp01(params.get("heterogeneity", 0.0))
    p = _clamp01(params.get("theme_prevalence", 0.30))
    S = _clamp01(params.get("specificity", 0.50))
    T = _clamp01(params.get("theory_strength", 0.50))
    Q = _clamp01(params.get("data_quality", 0.50))
    power = _clamp01(params.get("power", 0.80))
    depth = str(params.get("depth", "explanatory")).lower()
    base = _DEPTH_BASE.get(depth, _DEPTH_BASE["explanatory"])
    mixed = bool(params.get("mixed_methods", False))
    d = params.get("min_detectable_diff")

    # Comparative floor for a mixed-methods contrast: a smaller detectable
    # difference needs more cases per arm to be credible. ◌ Opinion range.
    comparative_floor = None
    if mixed and d:
        comparative_floor = math.ceil(2 + 1.0 / max(float(d), 0.05))

    def _optimal(H, p, S, T, Q):
        n1 = _model_linear_saturation(base, H, p, Q)
        n2 = _model_network_complexity(base, H, S, T, Q)
        n3 = _model_fuzzy_set_qca(base, H, S, comparative_floor)
        models = [max(4.0, n1), max(4.0, n2), max(4.0, n3)]
        center = sum(models) / len(models)
        # Information power index: high power → fewer needed; high heterogeneity
        # → more. (Malterud 2016, reframed.) ○ Author hypothesis.
        ip = (S + T + Q + (1 - H)) / 4.0
        ip_factor = 1 - 0.20 * (ip - 0.5) * 2
        power_factor = 1 + 0.50 * (power - 0.80)
        optimal = center * ip_factor * power_factor
        return models, ip, ip_factor, power_factor, optimal

    models, ip, ip_factor, power_factor, optimal = _optimal(H, p, S, T, Q)
    optimal_n = math.ceil(optimal)

    # Stability: perturb each input ±0.05 (one at a time) and re-synthesise.
    perturbed = []
    base_inputs = dict(H=H, p=p, S=S, T=T, Q=Q)
    for key in base_inputs:
        for delta in (-0.05, 0.05):
            kw = dict(base_inputs)
            kw[key] = _clamp01(kw[key] + delta)
            _, _, _, _, opt = _optimal(kw["H"], kw["p"], kw["S"], kw["T"], kw["Q"])
            perturbed.append(math.ceil(opt))
    lo, hi = min(perturbed + [optimal_n]), max(perturbed + [optimal_n])
    stable = (hi - lo) <= max(1, round(0.10 * optimal_n))

    result = {
        "optimal_n": optimal_n,
        "stable": stable,
        "stability_range": [lo, hi],
        "models": {
            "linear_saturation":  math.ceil(models[0]),
            "network_complexity": math.ceil(models[1]),
            "fuzzy_set_qca":      math.ceil(models[2]),
        },
        "information_power_index": round(ip, 3),
        "adjustments": {
            "ip_factor": round(ip_factor, 3),
            "power_factor": round(power_factor, 3),
        },
        "inputs": {
            "heterogeneity": H, "theme_prevalence": p, "depth": depth,
            "specificity": S, "theory_strength": T, "data_quality": Q,
            "power": power, "mixed_methods": mixed,
            "min_detectable_diff": d,
        },
        "comparative_floor": comparative_floor,
        "evidence": ("○ Author hypothesis (Vahtian, 2026) — three-model synthesis "
                     "with information-power adjustment; not externally validated "
                     "(see VALIDATION.md)."),
        "interpretation": (
            f"Three models proposed N = {math.ceil(models[0])} (linear saturation), "
            f"{math.ceil(models[1])} (network complexity), "
            f"{math.ceil(models[2])} (fuzzy-set QCA). Synthesised and adjusted for "
            f"information power (index {round(ip, 3)}), the optimal N is "
            f"{optimal_n} "
            f"({'stable' if stable else 'sensitive'} to ±0.05 input perturbation; "
            f"range {lo}–{hi}). The researcher decides N; this is decision support."
        ),
    }
    return result


# ── PDF rendering ─────────────────────────────────────────────────────────────

# COREQ 32-item reference (Tong, Sainsbury & Craig 2007) — used when the report
# does not supply its own coreq_items list.
_COREQ_32 = [
    "Interviewer / facilitator identified", "Credentials (e.g. PhD, MD)",
    "Occupation at time of study", "Gender", "Experience and training",
    "Relationship established prior to study", "Participant knowledge of the interviewer",
    "Interviewer characteristics reported", "Methodological orientation and theory",
    "Sampling (purposive, convenience, snowball)", "Method of approach",
    "Sample size", "Non-participation and reasons", "Setting of data collection",
    "Presence of non-participants", "Description of sample",
    "Interview guide described", "Repeat interviews", "Audio/visual recording",
    "Field notes", "Duration", "Data saturation discussed",
    "Transcripts returned to participants", "Number of data coders",
    "Description of the coding tree", "Derivation of themes",
    "Software used", "Participant checking", "Quotations presented",
    "Data and findings consistent", "Clarity of major themes",
    "Clarity of minor themes",
]


def _evidence_glyph(kind: str, size: float = 8.0):
    """Return a reportlab Drawing for one evidence symbol, drawn as vector
    shapes so it renders without any embedded font.
        consensus ◆ filled diamond · contested ◇ open diamond
        hypothesis ○ open circle · opinion ◌ dotted circle
    """
    from reportlab.graphics.shapes import Drawing, Polygon, Circle

    d = Drawing(size, size)
    c = size / 2.0
    r = size * 0.42
    navy = NAVY
    if kind == "consensus":
        d.add(Polygon(points=[c, c + r, c + r, c, c, c - r, c - r, c],
                      fillColor=_hex(navy), strokeColor=None))
    elif kind == "contested":
        d.add(Polygon(points=[c, c + r, c + r, c, c, c - r, c - r, c],
                      fillColor=None, strokeColor=_hex(navy), strokeWidth=0.9))
    elif kind == "hypothesis":
        d.add(Circle(c, c, r, fillColor=None, strokeColor=_hex(navy), strokeWidth=0.9))
    elif kind == "opinion":
        circ = Circle(c, c, r, fillColor=None, strokeColor=_hex(MUTED), strokeWidth=0.9)
        circ.strokeDashArray = [1.0, 1.0]
        d.add(circ)
    return d


def _hex(s: str):
    from reportlab.lib.colors import HexColor
    return HexColor(s)


# ── Fonts ─────────────────────────────────────────────────────────────────────
#
# STYLE.md: fonts are local-only. The web pages use the system stack; the brand's
# own card generator approximates that stack with **Liberation Sans/Mono**. The
# PDF does the same — it embeds the bundled Liberation TTFs (SIL OFL, see
# assets/fonts/LICENSE-OFL.txt) so the report carries its own fonts and depends
# on nothing installed on the reader's machine. If the bundled files are ever
# missing, we fall back to the PDF base-14 (Helvetica) — zero-asset, zero-request.

import os
import warnings


def _font_dir() -> str:
    """The bundled fonts live in the installed ``methodvahti`` package
    (assets/fonts) so they ship in the wheel as package data. Fall back to a
    path next to this module for unusual layouts."""
    try:
        import importlib.resources as _res
        return os.fspath(_res.files("methodvahti").joinpath("assets", "fonts"))
    except Exception:
        return os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            "methodvahti", "assets", "fonts")


_FONT_DIR = _font_dir()
_FONTS = {  # logical name → (filename, reportlab base-14 fallback)
    "MV-Sans":            ("LiberationSans-Regular.ttf",    "Helvetica"),
    "MV-Sans-Bold":       ("LiberationSans-Bold.ttf",       "Helvetica-Bold"),
    "MV-Sans-Italic":     ("LiberationSans-Italic.ttf",     "Helvetica-Oblique"),
    "MV-Sans-BoldItalic": ("LiberationSans-BoldItalic.ttf", "Helvetica-BoldOblique"),
    "MV-Mono":            ("LiberationMono-Regular.ttf",    "Courier"),
}
_FONT_REGISTERED = False


def _font(name: str) -> str:
    """Resolve a logical font name to a registered embedded font, or its
    base-14 fallback if the bundled TTF is unavailable. Registration is lazy
    and idempotent."""
    global _FONT_REGISTERED
    from reportlab.pdfbase import pdfmetrics
    if not _FONT_REGISTERED:
        from reportlab.pdfbase.ttfonts import TTFont
        n_loaded = 0
        for logical, (fname, _fb) in _FONTS.items():
            path = os.path.join(_FONT_DIR, fname)
            try:
                pdfmetrics.registerFont(TTFont(logical, path))
                n_loaded += 1
            except Exception:
                pass  # leave unregistered → _resolve() returns the base-14 fallback

        # Mark done *before* the family call so a failure there can't cause the
        # whole (TTF-registering) block to re-run on every later _font() call.
        _FONT_REGISTERED = True

        if n_loaded == 0:
            warnings.warn(
                "MethodVahti: bundled Liberation fonts not found in "
                f"{_FONT_DIR!r}; the PDF will fall back to the base-14 "
                "Helvetica family. Check the package install.",
                RuntimeWarning, stacklevel=2)

        def _resolve(n):
            return n if n in pdfmetrics.getRegisteredFontNames() \
                else _FONTS.get(n, ("", "Helvetica"))[1]

        # Register a family so <b>/<i>/<b><i> inline tags map to the Liberation
        # variants instead of falling back to Helvetica/Times.
        try:
            pdfmetrics.registerFontFamily(
                _resolve("MV-Sans"),
                normal=_resolve("MV-Sans"),
                bold=_resolve("MV-Sans-Bold"),
                italic=_resolve("MV-Sans-Italic"),
                boldItalic=_resolve("MV-Sans-BoldItalic"),
            )
        except Exception:
            pass
    if name in pdfmetrics.getRegisteredFontNames():
        return name
    return _FONTS.get(name, ("", "Helvetica"))[1]


def build(report: dict, out_path: str) -> str:
    """
    Render the COREQ/SRQR-compatible MethodVahti PDF.

    `report` is tolerant of missing keys — absent fields render as
    "not reported" rather than raising. If `report["optimisation"]` is absent
    but `report["optimisation_params"]` is present, optimise_n() is run.

    Returns the written path.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import (
        BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
        TableStyle, KeepTogether, FrameBreak,
    )
    from reportlab.platypus.flowables import HRFlowable

    r = dict(report)
    opt = r.get("optimisation")
    if opt is None and r.get("optimisation_params"):
        opt = optimise_n(r["optimisation_params"])

    def g(key, default="not reported"):
        v = r.get(key)
        return _san(v) if v not in (None, "", []) else default

    # ── styles ────────────────────────────────────────────────────────────────
    H1 = ParagraphStyle("H1", fontName=_font("MV-Sans-Bold"), fontSize=15,
                        textColor=_hex(NAVY), spaceBefore=2, spaceAfter=2, leading=18)
    KICK = ParagraphStyle("KICK", fontName=_font("MV-Sans-Bold"), fontSize=8.5,
                        textColor=_hex(INDIGO), spaceAfter=6, leading=11, tracking=1)
    H2 = ParagraphStyle("H2", fontName=_font("MV-Sans-Bold"), fontSize=12.5,
                        textColor=_hex(NAVY), spaceBefore=4, spaceAfter=3, leading=15)
    STD = ParagraphStyle("STD", fontName=_font("MV-Sans-Italic"), fontSize=8,
                        textColor=_hex(MUTED), spaceAfter=8, leading=10)
    BODY = ParagraphStyle("BODY", fontName=_font("MV-Sans"), fontSize=9.5,
                        textColor=_hex(INK), leading=14, alignment=TA_LEFT, spaceAfter=4)
    LABEL = ParagraphStyle("LABEL", fontName=_font("MV-Sans-Bold"), fontSize=8.5,
                        textColor=_hex(MUTED), leading=12)
    CELL = ParagraphStyle("CELL", fontName=_font("MV-Sans"), fontSize=9, leading=13,
                        textColor=_hex(INK))
    CELLB = ParagraphStyle("CELLB", fontName=_font("MV-Sans-Bold"), fontSize=9, leading=13,
                        textColor=_hex(INK))
    BIG = ParagraphStyle("BIG", fontName=_font("MV-Sans-Bold"), fontSize=30,
                        textColor=_hex(VIOLET), leading=32)
    NOTE = ParagraphStyle("NOTE", fontName=_font("MV-Sans"), fontSize=8.5, leading=12,
                        textColor=_hex(MUTED), spaceBefore=2, spaceAfter=2)
    MONO = ParagraphStyle("MONO", fontName=_font("MV-Mono"), fontSize=8, leading=12,
                        textColor=_hex(MUTED), spaceBefore=2, spaceAfter=2)

    story = []

    def section(title, std=None):
        story.append(Spacer(1, 6))
        story.append(HRFlowable(width="100%", thickness=0.6, color=_hex(LINE),
                                spaceBefore=2, spaceAfter=6))
        story.append(Paragraph(title, H2))
        if std:
            story.append(Paragraph(std, STD))

    def kv_table(rows, value_style=CELL):
        data = [[Paragraph(k, LABEL), Paragraph(str(v), value_style)] for k, v in rows]
        t = Table(data, colWidths=[42 * mm, 120 * mm])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -2), 0.4, _hex(LINE)),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        return t

    # ── Evidence legend ─────────────────────────────────────────────────────────
    def legend():
        items = [("consensus", "Consensus", "broad agreement"),
                 ("contested", "Contested", "expert disagreement"),
                 ("hypothesis", "Author hypothesis", "not externally validated"),
                 ("opinion", "Opinion range", "team decision")]
        cells = []
        for kind, name, desc in items:
            inner = Table(
                [[_evidence_glyph(kind, 9),
                  Paragraph(f'<b>{name}</b><br/><font color="{MUTED}" size="7">{desc}</font>', CELL)]],
                colWidths=[6 * mm, 32 * mm])
            inner.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
            cells.append(inner)
        t = Table([cells], colWidths=[40 * mm] * 4)
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BACKGROUND", (0, 0), (-1, -1), _hex(BG)),
            ("BOX", (0, 0), (-1, -1), 0.5, _hex(LINE)),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 7)]))
        return t

    # ── 1 · Study profile ───────────────────────────────────────────────────────
    section("1 · Study profile", "SRQR 1–6 · COREQ 1–9")
    story.append(kv_table([
        ("Research question", g("research_question")),
        ("Methodological orientation", g("orientation")),
        ("Approach / paradigm", g("approach")),
        ("Data collection", g("collection_method")),
        ("Analysis strategy", g("analysis_strategy")),
        ("Researcher", f'{g("researcher_name")} — {g("researcher_credentials","")}'.rstrip(" —")),
        ("Reflexivity", g("reflexivity")),
        ("Research group", g("research_group")),
    ]))
    story.append(Spacer(1, 8))
    story.append(legend())

    # ── 2 · Optimisation ─────────────────────────────────────────────────────────
    section("2 · Sample-size optimisation", "SRQR 13 · COREQ 17 — detectable difference")
    if opt:
        chip = "stable" if opt["stable"] else "sensitive"
        head = Table([[
            Paragraph(str(opt["optimal_n"]), BIG),
            Paragraph(
                f'<b>Optimal N (synthesis)</b><br/>'
                f'<font size="8" color="{MUTED}">Stability: {chip} · range '
                f'{opt["stability_range"][0]}–{opt["stability_range"][1]} · '
                f'information-power index {opt["information_power_index"]}</font>',
                CELL)]], colWidths=[26 * mm, 136 * mm])
        head.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                  ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
        story.append(head)
        story.append(Paragraph(_san(opt["interpretation"]), BODY))
        story.append(Paragraph(_san(opt["evidence"]), NOTE))
    else:
        story.append(Paragraph("No optimisation parameters supplied.", BODY))

    # ── 3 · Three-model comparison ───────────────────────────────────────────────
    section("3 · Three-model comparison", "The number is a synthesis, never one truth")
    if opt:
        m = opt["models"]
        data = [[Paragraph("Model", CELLB), Paragraph("Estimated N", CELLB),
                 Paragraph("Basis", CELLB)]]
        rows = [
            ("Linear saturation", m["linear_saturation"],
             "Saturation rises with heterogeneity & theme rarity"),
            ("Network complexity", m["network_complexity"],
             "Information power: aim, theory, dialogue lower N"),
            ("Fuzzy-set QCA", m["fuzzy_set_qca"],
             "Cases needed to cover plausible configurations"),
            ("Synthesis (chosen frame)", opt["optimal_n"],
             "Info-power-adjusted synthesis of the three"),
        ]
        for name, n, basis in rows:
            data.append([Paragraph(name, CELL), Paragraph(str(n), CELL),
                         Paragraph(basis, NOTE)])
        t = Table(data, colWidths=[42 * mm, 24 * mm, 96 * mm])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BACKGROUND", (0, 0), (-1, 0), _hex(NAVY)),
            ("TEXTCOLOR", (0, 0), (-1, 0), _hex(CARD)),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, _hex(LINE)),
            ("BACKGROUND", (0, 4), (-1, 4), _hex(BG)),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ]))
        # header text white
        def _white_header(tbl):
            tbl.setStyle(TableStyle([("TEXTCOLOR", (0, 0), (-1, 0), _hex(CARD))]))
        story.append(t)
    story.append(Spacer(1, 6))
    story.append(kv_table([
        ("Chosen N (researcher)", g("chosen_n")),
        ("Rationale (researcher's words)", g("chosen_rationale")),
        ("Stopping criterion", g("stopping_criterion")),
        ("Adaptive plan", g("adaptive_plan")),
    ]))

    # ── 4 · Fuzzy-set sensitivity ────────────────────────────────────────────────
    section("4 · Fuzzy-set calibration sensitivity", "SRQR 5")
    fs = r.get("fuzzy_sensitivity")
    story.append(kv_table([
        ("Concept calibrated", g("fuzzy_concept")),
        ("Calibration rationale", g("fuzzy_calibration_rationale")),
        ("Impact on conclusions", g("fuzzy_conclusion_impact")),
    ]))
    if isinstance(fs, dict) and fs:
        data = [[Paragraph("Calibration", CELLB), Paragraph("Result / effect", CELLB)]]
        for k, v in fs.items():
            data.append([Paragraph(str(k), CELL), Paragraph(str(v), CELL)])
        t = Table(data, colWidths=[52 * mm, 110 * mm])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 0), (-1, 0), _hex(BG)),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, _hex(LINE)),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 7)]))
        story.append(Spacer(1, 4))
        story.append(t)

    # ── 5 · Epistemic limitations ────────────────────────────────────────────────
    section("5 · Epistemic limitations", "SRQR 20 · COREQ 31–32")

    def bullets(items, label):
        if not items:
            return Paragraph(f"<b>{label}:</b> not reported", BODY)
        lis = "".join(f"<br/>• {x}" for x in items)
        return Paragraph(f"<b>{label}:</b>{lis}", BODY)

    story.append(bullets(r.get("can_conclude"), "What this design can conclude"))
    story.append(bullets(r.get("cannot_conclude"), "What it cannot conclude"))
    story.append(Paragraph(f"<b>Transferability:</b> {g('transferability')}", BODY))
    story.append(Paragraph(
        "MethodVahti does not infer causality, validate study quality, or replace "
        "researcher judgment. The optimisation synthesis is an author hypothesis "
        "(Vahtian 2026), not externally validated.", NOTE))

    # ── 6 · COREQ 32-item checklist ──────────────────────────────────────────────
    section("6 · COREQ 32-item checklist", "Tong, Sainsbury & Craig (2007)")
    coreq_items = r.get("coreq_items") or [
        {"item": i + 1, "topic": t, "status": "—", "note": ""}
        for i, t in enumerate(_COREQ_32)
    ]
    data = [[Paragraph("#", CELLB), Paragraph("Item", CELLB),
             Paragraph("Status", CELLB), Paragraph("Note", CELLB)]]
    for it in coreq_items:
        if isinstance(it, dict):
            num = it.get("item", "")
            topic = it.get("topic", "")
            status = it.get("status", "—")
            note = it.get("note", "")
        else:
            num, topic, status, note = "", str(it), "—", ""
        data.append([Paragraph(str(num), CELL), Paragraph(str(topic), CELL),
                     Paragraph(str(status), CELLB), Paragraph(str(note), NOTE)])
    t = Table(data, colWidths=[8 * mm, 78 * mm, 16 * mm, 60 * mm], repeatRows=1)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, 0), _hex(NAVY)),
        ("TEXTCOLOR", (0, 0), (-1, 0), _hex(CARD)),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_hex(CARD), _hex(BG)]),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, _hex(LINE)),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)

    # ── 7 · Citation + audit record ──────────────────────────────────────────────
    section("7 · Citation & audit record", "Reproducibility")
    rid = g("report_id", "MV-DRAFT")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    citation = (f'Vahtian. ({datetime.now(timezone.utc).year}). MethodVahti '
                f'methods report {rid}. EpiNet toolkit. https://vahtian.com/methodvahti')
    story.append(kv_table([
        ("Report ID", rid),
        ("Generated (UTC)", today),
        ("Citation", citation),
        ("Method core", "qualitative_heterogeneity_score() · Apache-2.0"),
    ], value_style=MONO))
    sev = r.get("severity_audit_log")
    if sev:
        story.append(Spacer(1, 4))
        story.append(Paragraph("Severity-weight audit log", LABEL))
        for e in sev:
            story.append(Paragraph(_san(
                f'{e.get("timestamp","")} · {e.get("changed_from")} → '
                f'{e.get("changed_to")} · {e.get("changed_by","")}: '
                f'{e.get("reason","")}'), MONO))

    # ── page furniture ───────────────────────────────────────────────────────────
    study_title = g("study_title", "Qualitative methods report")

    def _decorate(canvas, doc):
        canvas.saveState()
        W, Hpt = A4
        # top navy band on every page
        band_h = 26 * mm if doc.page == 1 else 14 * mm
        canvas.setFillColor(_hex(NAVY))
        canvas.rect(0, Hpt - band_h, W, band_h, fill=1, stroke=0)
        # brand mark — bracket gate + 2x2 lilac cells
        mx, my, ms = 18 * mm, Hpt - band_h / 2, 7 * mm
        s = ms / 32.0
        canvas.saveState()
        canvas.translate(mx, my - ms / 2)
        canvas.scale(s, s)
        canvas.setStrokeColor(_hex(INDIGO)); canvas.setLineWidth(2.3)
        canvas.setLineCap(1); canvas.setLineJoin(1)
        canvas.line(12, 23, 9, 23); canvas.line(9, 23, 9, 9); canvas.line(9, 9, 12, 9)
        canvas.line(20, 23, 23, 23); canvas.line(23, 23, 23, 9); canvas.line(23, 9, 20, 9)
        canvas.setFillColor(_hex(LILAC))
        for cx, cy in ((14, 23), (18, 23), (14, 19), (18, 19)):
            canvas.circle(cx, cy, 1.5, fill=1, stroke=0)
        canvas.restoreState()
        # band text
        canvas.setFillColor(_hex(CARD))
        canvas.setFont(_font("MV-Sans-Bold"),11)
        canvas.drawString(26 * mm, my - 1 * mm if doc.page == 1 else my - 1.5 * mm, "MethodVahti")
        if doc.page == 1:
            canvas.setFont(_font("MV-Sans"),9)
            canvas.setFillColor(_hex(LILAC))
            canvas.drawString(26 * mm, my - 6 * mm, "Qualitative research decision support · a product of Vahtian")
            canvas.setFont(_font("MV-Sans-Bold"),16)
            canvas.setFillColor(_hex(CARD))
            canvas.drawString(18 * mm, Hpt - band_h - 12 * mm, study_title[:64])
            canvas.setFont(_font("MV-Sans"),9)
            canvas.setFillColor(_hex(MUTED))
            canvas.drawString(18 * mm, Hpt - band_h - 18 * mm,
                              f"{rid} · {today} · {g('research_group','')}")
        # footer
        canvas.setFillColor(_hex(MUTED))
        canvas.setFont(_font("MV-Sans"),7.5)
        canvas.drawString(18 * mm, 10 * mm,
                          "© 2026 Vahtian · MethodVahti · Apache-2.0 core · vahtian.com/methodvahti")
        canvas.drawRightString(W - 18 * mm, 10 * mm, f"Page {doc.page}")
        canvas.setStrokeColor(_hex(LINE)); canvas.setLineWidth(0.5)
        canvas.line(18 * mm, 13 * mm, W - 18 * mm, 13 * mm)
        canvas.restoreState()

    W, Hpt = A4
    frame_first = Frame(18 * mm, 16 * mm, W - 36 * mm, Hpt - 26 * mm - 22 * mm - 16 * mm,
                        id="first", leftPadding=0, rightPadding=0,
                        topPadding=6, bottomPadding=0)
    frame_rest = Frame(18 * mm, 16 * mm, W - 36 * mm, Hpt - 14 * mm - 4 * mm - 16 * mm,
                       id="rest", leftPadding=0, rightPadding=0,
                       topPadding=6, bottomPadding=0)
    doc = BaseDocTemplate(out_path, pagesize=A4,
                          title=f"MethodVahti report {rid}", author="Vahtian")
    doc.addPageTemplates([
        PageTemplate(id="first", frames=[frame_first], onPage=_decorate),
        PageTemplate(id="rest", frames=[frame_rest], onPage=_decorate),
    ])
    # after the first page, switch template
    from reportlab.platypus import NextPageTemplate
    story.insert(0, NextPageTemplate("rest"))
    doc.build(story)
    return out_path
