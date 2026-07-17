# Vahtian social and video-call banners

Rough field-note banners in the current dark, violet, lilac, and near-white
brand system. The artwork uses visibly uneven line weights and the same student,
team, and book language as the reusable icons in [`../icons/`](../icons/).

Run this from any directory:

```sh
python3 /path/to/vahtian/brand/social/generate.py
```

The script needs `cairosvg` and rebuilds both SVG and PNG exports.

| File | Size | Use |
|---|---|---|
| `linkedin-personal-1584x396` | 1584x396 | LinkedIn profile background |
| `linkedin-company-1128x191` | 1128x191 | LinkedIn company page cover |
| `facebook-cover-1640x624` | 1640x624 | Facebook page cover |
| `teams-background-1920x1080` | 1920x1080 | Teams or video-call background |

Each size ships two variants:

- **`<name>.png`** - recommended art-only banner, with no text or logo.
- **`<name>-logo.png`** - the same artwork with the Vahtian mark.

The plain version is intentionally the default. Platform profile images, names,
and interface controls already provide enough foreground information. Text is
not generated: Marksy remains a selective voice layer on editable layouts, not
something baked into a reusable background.
