# Vahtian social / video-call banners

Off-white-lavender banners with the Vahtian mark on the left, a faint lavender
citation graph (nodes + edges) as the accent, dark main text, and the
`vahtian.com` wordmark bottom-right. Built self-contained per
[`../STYLE.md`](../STYLE.md): local fonts, inline SVG, no external requests.

Run `python3 generate.py` (needs `cairosvg`) to rebuild every `.svg` + `.png`.

| File | Size | Use |
|---|---|---|
| `linkedin-personal-1584x396` | 1584×396 | LinkedIn profile background |
| `linkedin-company-1128x191` | 1128×191 | LinkedIn company page cover |
| `facebook-cover-1640x624` | 1640×624 | Facebook page cover |
| `teams-background-1920x1080` | 1920×1080 | Teams / video-call background |

Each size ships two variants:

- **`<name>.png`** — full layout with the headline, subhead, and url.
- **`<name>-logo.png`** — logo only (centred mark + graph), no text.

Text:
- Headline — *Make research claims checkable.*
- Subhead — *Auditable software for citation integrity and biomedical evidence.*
- Bottom-right — *vahtian.com*
