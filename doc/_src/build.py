#!/usr/bin/env python3
"""Build the FlexiTac documentation (https://flexitac.github.io/doc/).

Pages are written in Markdown under doc/_src/pages/ and rendered into static
HTML under doc/ with a Starlight-style layout (sidebar, "On this page",
search, prev/next, "Edit page").  Standard library only, so it runs anywhere
Python 3.9+ does:

    python3 doc/_src/build.py           # build
    python3 doc/_src/build.py --check   # build into memory, fail if doc/ is stale

The generated HTML is committed, because GitHub Pages serves this repository
as-is.  Folders starting with "_" are not published by GitHub Pages (Jekyll),
so the sources here are only visible on GitHub.

Markdown subset (see doc/_src/README.md for examples):
  front matter    --- title / description / sidebar_label / sidebar_sub: true (indented under the page above) ---
  headings        ## and ### (become the "On this page" entries), #### inside components
  blocks          paragraphs, - / 1. lists (nest with 2+ spaces), > quotes, | tables |,
                  ```lang title="file.py" fenced code, raw HTML lines, ![alt](src "caption")
  containers      :::note / :::tip / :::caution / :::danger [Optional title]
                  :::steps   (each "#### Title" starts a numbered step)
                  :::tabs    (each "#### Label" starts a tab; tabs with equal labels sync)
                  :::cards   (each "#### Title | /link/ | icon" starts a card)
                  :::cards[path]  (the same cards as a numbered route, in order)
                  :::timeline   (empty: the homepage's timeline, read from /index.html at build time)
                  :::community  (approved community robots: "#### Name | link | /image" + a credit line each)
                  :::cards[flow]  (numbered icon steps joined by arrows: "#### Title | /link/ | icon";
                                   text under a step becomes a card that opens on click)
  front matter    layout: splash  (no "On this page" column, a wider page: the docs home)
                  Close with ":::".  Use more colons (::::) for the outer of two nested containers.
"""
from __future__ import annotations

import datetime as _dt
import html
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote

SRC = Path(__file__).resolve().parent
DOC = SRC.parent
REPO = DOC.parent
PAGES = SRC / "pages"
BASE = "/doc/"
SITE = "https://flexitac.github.io"
EDIT_BASE = "https://github.com/FlexiTac/FlexiTac.github.io/edit/main/doc/_src/pages/"
ISSUE_URL = "https://github.com/FlexiTac/FlexiTac.github.io/issues/new"
ASSET_VERSION = "20261126b"

# --------------------------------------------------------------------------------------------
# Navigation: the one place that decides page order (sidebar, prev/next).
# Internal entries are page slugs ("" is the docs home); external entries are (label, url).
# --------------------------------------------------------------------------------------------
NAV = [
    ("Get Started", [
        "",
        "get-started",
        "get-started/order-parts",
        "get-started/fabricate",
        "get-started/stream",
        "get-started/troubleshooting",
        "get-started/next-steps",
    ]),
    ("Learning with FlexiTac", [
        "robot-learning/data-collection",
        "robot-learning/tactile-representation",
        "robot-learning/imitation-learning",
        "robot-learning/vla",
        "robot-learning/reinforcement-learning",
        "robot-learning/pretraining",
        "robot-learning/world-models",
    ]),
    ("FlexiTac in Simulation", [
        "simulation",
    ]),
    ("Ecosystem", [
        ("FlexiTac homepage", "/"),
        ("FlexiTac-Gen", "/flexitac-gen/"),
        ("LeFlexiTac", "https://tna001-ai.github.io/LeFlexiTac/docs.html"),
        ("Awesome FlexiTac", "https://binghao-huang.github.io/Awesome-FlexiTac/"),
        ("Interactive course", "/learn/"),
    ]),
]
# Pages that are built and searchable but not in the sidebar or the prev/next chain; link to them from other pages.
UNLISTED = ["resources", "get-started/pyflexitac"]
# Retired pages: their old address forwards to the page that took over their content (keeps old links and
# search results working). Slug -> (new slug, {old #anchor: new #anchor, or a /doc/ path for one that moved page}).
REDIRECTS = {"robot-learning": ("robot-learning/data-collection", {
    "#leflexitac": "#teleoperation", "#touch-in-the-wild": "#umi", "#mount": "#tips", "#choose": "",
    "#research": "/doc/robot-learning/tactile-representation/#3d"})}

# --------------------------------------------------------------------------------------------
# Inline Markdown
# --------------------------------------------------------------------------------------------
_ENTITY = re.compile(r"&(#\d+|#x[0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]*);")


def esc_text(s: str) -> str:
    """Escape text but keep inline HTML tags and entities the author wrote."""
    out = []
    i = 0
    while i < len(s):
        c = s[i]
        if c == "&":
            m = _ENTITY.match(s, i)
            if m:
                out.append(m.group(0)); i = m.end(); continue
            out.append("&amp;")
        elif c == "<":
            m = re.match(r"</?[A-Za-z][A-Za-z0-9-]*(\s[^<>]*)?/?>", s[i:])
            if m:
                out.append(m.group(0)); i += m.end(); continue
            out.append("&lt;")
        elif c == ">":
            out.append("&gt;")
        else:
            out.append(c)
        i += 1
    return "".join(out)


def is_external(url: str) -> bool:
    return url.startswith(("http://", "https://", "mailto:"))


def link_attrs(url: str) -> str:
    if is_external(url):
        return f' href="{html.escape(url, quote=True)}" target="_blank" rel="noopener"'
    return f' href="{html.escape(url, quote=True)}"'


def inline(s: str) -> str:
    """Inline Markdown: `code`, ![img](src), [link](url), **bold**, *em*, ~~del~~."""
    tokens: list[str] = []

    def stash(h: str) -> str:
        tokens.append(h)
        return f"\x00{len(tokens) - 1}\x00"

    s = re.sub(r"`([^`]+)`", lambda m: stash(f"<code>{html.escape(m.group(1), quote=False)}</code>"), s)
    s = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)(?:\s+\"([^\"]*)\")?\)",
               lambda m: stash(f'<img src="{html.escape(m.group(2), quote=True)}" alt="{html.escape(m.group(1), quote=True)}" loading="lazy" decoding="async">'), s)

    def _link(m: re.Match) -> str:
        label, url = m.group(1), m.group(2)
        ext = is_external(url)
        mark = '<span class="ext" aria-hidden="true">↗</span>' if ext else ""
        return stash(f"<a{link_attrs(url)}>") + label + stash(f"{mark}</a>")

    s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", _link, s)
    s = esc_text(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", s)
    s = re.sub(r"~~(.+?)~~", r"<del>\1</del>", s)
    while "\x00" in s:
        s = re.sub(r"\x00(\d+)\x00", lambda m: tokens[int(m.group(1))], s)
    return s


def plain(s: str) -> str:
    """Inline Markdown to plain text (search index, TOC, ids)."""
    s = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", s)
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"[`*~]", "", s)
    return html.unescape(s).strip()


def slugify(s: str) -> str:
    s = plain(s).lower()
    s = re.sub(r"[^\w\s-]", "", s)
    return re.sub(r"[\s_]+", "-", s).strip("-") or "section"


# --------------------------------------------------------------------------------------------
# Tiny build-time syntax highlighter (bash, python, c/arduino, text)
# --------------------------------------------------------------------------------------------
_PY_KW = r"\b(?:from|import|as|with|for|in|if|else|elif|while|def|class|return|print|None|True|False|and|or|not|try|except|lambda)\b"
_C_KW = r"\b(?:#define|#include|void|int|byte|boolean|for|if|else|return|while|true|false|const)\b"


def highlight(code: str, lang: str) -> str:
    lang = (lang or "").lower()
    if lang in ("sh", "bash", "shell", "console", "zsh"):
        rules = [
            ("c", r"(?<!\S)#.*$"),
            ("s", r"\"(?:\\.|[^\"\\])*\"|'[^']*'"),
            ("v", r"\$\{?\w+\}?"),
            ("f", r"(?<![\w-])--?[A-Za-z][\w-]*"),
            ("k", r"^[ \t]*(?:sudo|pip|uv|python3?|git|cd|ls|conda|brew|curl|arduino-cli|flexitac-[\w-]+|export|chmod|usermod|dmesg|make)\b"),
        ]
    elif lang in ("py", "python"):
        rules = [("c", r"#.*$"), ("s", r"\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'"), ("k", _PY_KW), ("n", r"\b\d[\d_.]*\b")]
    elif lang in ("c", "cpp", "ino", "arduino"):
        rules = [("c", r"//.*$"), ("s", r"\"(?:\\.|[^\"\\])*\""), ("k", _C_KW), ("n", r"\b(?:0x[0-9A-Fa-f]+|\d+)\b")]
    else:
        return html.escape(code, quote=False)
    combined = re.compile("|".join(f"(?P<{n}{i}>{p})" for i, (n, p) in enumerate(rules)), re.M)
    out, last = [], 0
    for m in combined.finditer(code):
        out.append(html.escape(code[last:m.start()], quote=False))
        kind = m.lastgroup[0]
        out.append(f'<span class="tk-{kind}">{html.escape(m.group(0), quote=False)}</span>')
        last = m.end()
    out.append(html.escape(code[last:], quote=False))
    return "".join(out)


# --------------------------------------------------------------------------------------------
# Block Markdown
# --------------------------------------------------------------------------------------------
ICONS = {
    "rocket": '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2m6-11a2 2 0 1 0 0 .01M9 15l-3-3c1-4 4-8 11-9 0 7-5 10-9 11l-3-3Zm0 0-1 4m4-4 4-1"/>',
    "cpu": '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
    "layers": '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
    "wrench": '<path d="M14.7 6.3a4 4 0 0 0 5 5L22 14l-8 8-2.3-2.3a4 4 0 0 0-5-5L2 10l8-8 2.3 2.3a4 4 0 0 0 2.4 2Z"/>',
    "cart": '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11L21 7H6"/>',
    "bolt": '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    "wave": '<path d="M2 12h3l3-8 4 16 3-10 2 2h5"/>',
    "lifebuoy": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m5.6 5.6 3.6 3.6m5.6 5.6 3.6 3.6m0-12.8-3.6 3.6m-5.6 5.6-3.6 3.6"/>',
    "compass": '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    "robot": '<path d="M12 3.2v3.3"/><circle cx="12" cy="2.6" r=".9" fill="currentColor" stroke="none"/><rect x="5" y="6.5" width="14" height="10.5" rx="3.2"/><circle cx="9.4" cy="11.6" r="1.25" fill="currentColor" stroke="none"/><circle cx="14.6" cy="11.6" r="1.25" fill="currentColor" stroke="none"/><path d="M2.8 10.2v3.4M21.2 10.2v3.4M9 20.8h6M12 17v3.8"/>',
    "cube": '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z"/><path d="m3 7 9 5 9-5M12 12v10"/>',
    "book": '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4Zm16 0h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7V4Z"/>',
    "users": '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.5.5 4 2.8 4 6"/>',
    "github": '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    "sim": '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M7 12l3-3 2 2 4-4"/>',
    "check": '<path d="m5 12 5 5L20 7"/>',
    "grid": '<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 9.67h17M3.5 14.33h17M7.75 5v14M12 5v14M16.25 5v14"/>',
    "sliders": '<path d="M4 6h9m4 0h3M4 12h3m4 0h9M4 18h11m4 0h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    "code": '<path d="m8 7-5 5 5 5m8-10 5 5-5 5M13.5 5l-3 14"/>',
    "net": '<path stroke-width="1" d="M4 4.5 12 8M4 4.5 12 16M4 12l8-4M4 12l8 4M4 19.5 12 8M4 19.5 12 16M12 8l8 4M12 16l8-4"/><g fill="currentColor" stroke="none"><circle cx="4" cy="4.5" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="4" cy="19.5" r="2"/><circle cx="12" cy="8" r="2"/><circle cx="12" cy="16" r="2"/><circle cx="20" cy="12" r="2"/></g>',
}


def icon(name: str, cls: str = "icon") -> str:
    body = ICONS.get(name)
    if not body:
        return ""
    return (f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{body}</svg>')


ASIDE_DEFAULT = {"note": "Note", "tip": "Tip", "caution": "Caution", "danger": "Danger"}
ASIDE_ICON = {
    "note": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    "tip": '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z"/>',
    "caution": '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/>',
    "danger": '<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8l5-5Z"/><path d="M12 8v5M12 16h.01"/>',
}


class Renderer:
    def __init__(self) -> None:
        self.toc: list[tuple[int, str, str]] = []   # (level, id, text)
        self.ids: set[str] = set()
        self.sections: list[dict] = []              # search index chunks
        self.tab_group = 0

    # -- helpers ---------------------------------------------------------------------------
    def uid(self, base: str) -> str:
        i, cand = 1, base
        while cand in self.ids:
            i += 1
            cand = f"{base}-{i}"
        self.ids.add(cand)
        return cand

    def _text(self, h: str) -> None:
        """Append visible text to the current search section."""
        if self.sections:
            t = re.sub(r"<[^>]+>", " ", h)
            self.sections[-1]["x"] += " " + html.unescape(t)

    # -- block parser --------------------------------------------------------------------------
    def render(self, lines: list[str]) -> str:
        out: list[str] = []
        i, n = 0, len(lines)
        while i < n:
            line = lines[i]
            stripped = line.strip()
            if not stripped:
                i += 1; continue

            # Container :::kind[title]
            m = re.match(r"^(:{3,})(note|tip|caution|danger|steps|tabs|cards|timeline|community)(?:\[(.*)\])?\s*$", stripped)
            if m:
                fence = m.group(1)
                j, depth, body = i + 1, 0, []
                while j < n:
                    s = lines[j].strip()
                    if re.match(rf"^{fence}[a-z]", s) and not re.match(rf"^{fence}:", s):
                        depth += 1
                    elif s == fence:
                        if depth == 0:
                            break
                        depth -= 1
                    body.append(lines[j]); j += 1
                out.append(self.container(m.group(2), m.group(3), body))
                i = j + 1; continue

            # Fenced code
            m = re.match(r"^(`{3,})\s*([\w+-]*)\s*(.*)$", stripped)
            if m:
                fence, lang, meta = m.group(1), m.group(2), m.group(3)
                indent = len(line) - len(line.lstrip())
                j, code = i + 1, []
                while j < n and lines[j].strip() != fence:
                    code.append(lines[j][indent:] if lines[j][:indent].strip() == "" else lines[j])
                    j += 1
                out.append(self.code("\n".join(code), lang, meta))
                i = j + 1; continue

            # Headings
            m = re.match(r"^(#{2,4})\s+(.*?)\s*(?:\{#([\w-]+)\})?\s*$", stripped)
            if m:
                level, text = len(m.group(1)), m.group(2)
                hid = self.uid(m.group(3) or slugify(text))
                if level <= 3:
                    self.toc.append((level, hid, plain(text)))
                    self.sections.append({"h": plain(text), "a": hid, "x": ""})
                out.append(f'<h{level} id="{hid}"><a class="anchor" href="#{hid}" aria-hidden="true" tabindex="-1">#</a>{inline(text)}</h{level}>')
                i += 1; continue

            # Raw HTML block
            if stripped.startswith("<") and re.match(r"^</?[A-Za-z!]", stripped):
                j, block = i, []
                while j < n and lines[j].strip():
                    block.append(lines[j]); j += 1
                h = "\n".join(block)
                self._text(h)
                out.append(h)
                i = j; continue

            # Table
            if stripped.startswith("|") and i + 1 < n and re.match(r"^\|?\s*:?-{2,}", lines[i + 1].strip()):
                j, rows = i, []
                while j < n and lines[j].strip().startswith("|"):
                    rows.append(lines[j].strip()); j += 1
                out.append(self.table(rows))
                i = j; continue

            # Lists
            if re.match(r"^\s*(?:[-*]|\d+\.)\s+", line):
                j = i
                block = []
                while j < n and (lines[j].strip() == "" or re.match(r"^\s*(?:[-*]|\d+\.)\s+", lines[j]) or lines[j].startswith("  ")):
                    if lines[j].strip() == "" and (j + 1 >= n or not (re.match(r"^\s*(?:[-*]|\d+\.)\s+", lines[j + 1]) or lines[j + 1].startswith("  "))):
                        break
                    block.append(lines[j]); j += 1
                out.append(self.list_block(block))
                i = j; continue

            # Blockquote
            if stripped.startswith(">"):
                j, block = i, []
                while j < n and lines[j].strip().startswith(">"):
                    block.append(re.sub(r"^\s*>\s?", "", lines[j])); j += 1
                out.append(f"<blockquote>{self.render(block)}</blockquote>")
                i = j; continue

            # Paragraph (stop at blank or a new block start)
            j, para = i, []
            while j < n and lines[j].strip() and not re.match(r"^\s*(?:#{2,4}\s|```|:{3,}|\||>|<[A-Za-z/])", lines[j]) \
                    and not (j > i and re.match(r"^\s*(?:[-*]|\d+\.)\s+", lines[j])):
                para.append(lines[j].strip()); j += 1
            text = " ".join(para)
            img = re.fullmatch(r"!\[([^\]]*)\]\(([^)\s]+)(?:\s+\"([^\"]*)\")?\)", text)
            if img:
                alt, src, cap = img.groups()
                cap_h = f"<figcaption>{inline(cap)}</figcaption>" if cap else ""
                out.append(f'<figure class="figure"><a href="{html.escape(src, quote=True)}" class="zoom">'
                           f'<img src="{html.escape(src, quote=True)}" alt="{html.escape(alt, quote=True)}" loading="lazy" decoding="async"></a>{cap_h}</figure>')
                self._text(cap or "")
            else:
                h = inline(text)
                self._text(h)
                out.append(f"<p>{h}</p>")
            i = j
        return "\n".join(out)

    def list_block(self, block: list[str]) -> str:
        first = block[0]
        base_indent = len(first) - len(first.lstrip())
        ordered = bool(re.match(r"^\s*\d+\.", first))
        items: list[list[str]] = []
        for ln in block:
            ind = len(ln) - len(ln.lstrip())
            m = re.match(r"^\s*(?:[-*]|\d+\.)\s+(.*)$", ln)
            if m and ind <= base_indent + 1:
                items.append([m.group(1)])
            elif items:
                items[-1].append(ln[base_indent + 2:] if ln.strip() else "")
        tag = "ol" if ordered else "ul"
        start = ""
        if ordered:
            num = int(re.match(r"^\s*(\d+)", first).group(1))
            if num != 1:
                start = f' start="{num}"'
        parts = []
        for it in items:
            head, rest = it[0], it[1:]
            task = re.match(r"^\[( |x)\]\s+(.*)$", head)
            cls = ""
            if task:
                done = task.group(1) == "x"
                head = task.group(2)
                cls = ' class="task"'
                head_h = f'<span class="box{" done" if done else ""}" aria-hidden="true"></span>' + inline(head)
            else:
                head_h = inline(head)
            self._text(head_h)
            if any(r.strip() for r in rest):
                parts.append(f"<li{cls}>{head_h}{self.render(rest)}</li>")
            else:
                parts.append(f"<li{cls}>{head_h}</li>")
        return f"<{tag}{start}>" + "".join(parts) + f"</{tag}>"

    def table(self, rows: list[str]) -> str:
        def cells(r: str) -> list[str]:
            r = r.strip().strip("|")
            return [c.strip() for c in re.split(r"(?<!\\)\|", r)]
        head = cells(rows[0])
        aligns = []
        for c in cells(rows[1]):
            aligns.append("center" if c.startswith(":") and c.endswith(":") else "right" if c.endswith(":") else "")
        def td(tag: str, c: str, k: int) -> str:
            a = aligns[k] if k < len(aligns) else ""
            style = f' style="text-align:{a}"' if a else ""
            h = inline(c.replace("\\|", "|"))
            self._text(h)
            return f"<{tag}{style}>{h}</{tag}>"
        thead = "<tr>" + "".join(td("th", c, k) for k, c in enumerate(head)) + "</tr>"
        body = "".join("<tr>" + "".join(td("td", c, k) for k, c in enumerate(cells(r))) + "</tr>" for r in rows[2:])
        return f'<div class="table-wrap"><table><thead>{thead}</thead><tbody>{body}</tbody></table></div>'

    def code(self, code: str, lang: str, meta: str) -> str:
        title = ""
        m = re.search(r'title="([^"]*)"', meta or "")
        if m:
            title = m.group(1)
        is_term = lang in ("sh", "bash", "shell", "console", "zsh")
        frame = "terminal" if is_term else "editor"
        cap = (f'<figcaption><span class="dots" aria-hidden="true"></span><span class="title">{html.escape(title)}</span></figcaption>'
               if title else "")
        return (f'<figure class="code {frame}{" has-title" if cap else ""}">{cap}'
                f'<pre data-lang="{html.escape(lang)}"><code>{highlight(code, lang)}</code></pre>'
                f'<button class="copy" type="button" aria-label="Copy code" data-copy>'
                f'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>'
                f'</button></figure>')

    def split_h4(self, body: list[str]) -> list[tuple[str, list[str]]]:
        """Split a component body on its own "#### " lines, ignoring nested code and containers."""
        parts: list[tuple[str, list[str]]] = []
        fence = None
        depth = 0
        for ln in body:
            s = ln.strip()
            if s.startswith("```"):
                fence = None if fence else s[:3]
            elif not fence and re.match(r"^:{3,}[a-z]", s):
                depth += 1
            elif not fence and re.fullmatch(r":{3,}", s):
                depth = max(0, depth - 1)
            m = re.match(r"^####\s+(.*)$", s) if not fence and depth == 0 else None
            if m:
                parts.append((m.group(1), []))
            elif parts:
                parts[-1][1].append(ln)
        return parts

    def container(self, kind: str, title: str | None, body: list[str]) -> str:
        if kind in ASIDE_DEFAULT:
            t = title or ASIDE_DEFAULT[kind]
            ic = f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ASIDE_ICON[kind]}</svg>'
            return (f'<aside class="aside {kind}" aria-label="{html.escape(t, quote=True)}"><p class="aside-title">{ic}{inline(t)}</p>'
                    f'<div class="aside-body">{self.render(body)}</div></aside>')
        if kind == "steps":
            items = []
            for k, (head, rest) in enumerate(self.split_h4(body), 1):
                sid = self.uid(slugify(head))
                self._text(head)
                items.append(f'<li id="{sid}"><p class="step-title">{inline(head)}</p>{self.render(rest)}</li>')
            return f'<ol class="steps">{"".join(items)}</ol>'
        if kind == "tabs":
            self.tab_group += 1
            g = self.tab_group
            parts = self.split_h4(body)
            sync = html.escape(title or "", quote=True)
            btns, panels = [], []
            for k, (label, rest) in enumerate(parts):
                sel = "true" if k == 0 else "false"
                self._text(label)
                btns.append(f'<button role="tab" id="tab-{g}-{k}" aria-controls="panel-{g}-{k}" aria-selected="{sel}" tabindex="{0 if k == 0 else -1}" data-label="{html.escape(plain(label), quote=True)}">{inline(label)}</button>')
                panels.append(f'<div role="tabpanel" id="panel-{g}-{k}" aria-labelledby="tab-{g}-{k}"{"" if k == 0 else " hidden"}>{self.render(rest)}</div>')
            return f'<div class="tabs" data-sync="{sync}"><div role="tablist">{"".join(btns)}</div>{"".join(panels)}</div>'
        if kind == "timeline":
            return timeline_html()
        if kind == "community":
            # Approved community robots, one "#### Name | link | /image" block each with a one-line credit under it.
            # Renders as one more timeline row ("Community"); with no entries it renders nothing.
            tiles = []
            for head, rest in self.split_h4(body):
                bits = [b.strip() for b in head.split("|")]
                t, href, img = (bits + ["", ""])[:3]
                self._text(t)
                credit = " ".join(l.strip() for l in rest if l.strip() and not l.strip().startswith("<!--"))
                inner = (f'<span class="tl-media"><img src="{html.escape(img, quote=True)}" alt="" loading="lazy" decoding="async"></span>'
                         f'<span class="tl-title">{inline(t)}</span>'
                         + (f'<span class="tl-credit">{inline(credit)}</span>' if credit else ""))
                tiles.append(f'<li class="tl-tile"><a{link_attrs(href)}>{inner}</a></li>' if href
                             else f'<li class="tl-tile"><span>{inner}</span></li>')
            if not tiles:
                return ""
            return ('<div class="tl tl-community"><div class="tl-row"><div class="tl-label"><p class="tl-year">Community</p>'
                    '<div class="tl-nav" hidden><button type="button" data-dir="-1" aria-label="Scroll back">‹</button>'
                    '<button type="button" data-dir="1" aria-label="Scroll forward">›</button></div></div>'
                    '<div class="tl-lane" role="region" aria-label="Community robots" tabindex="0"><ol class="tl-items">'
                    f'<li class="tl-node"><ul class="tl-tiles">{"".join(tiles)}</ul></li></ol></div></div></div>')
        if kind == "cards" and (title or "").strip() == "flow":
            # :::cards[flow] = big icon steps joined by arrows; each "#### Title | link | icon", no body
            # A step with text under its heading opens that text as a small card instead of following the link
            # (the link stays as the no-JavaScript fallback).
            steps = []
            for k, (head, rest) in enumerate(self.split_h4(body), 1):
                bits = [b.strip() for b in head.split("|")]
                t, href, ic = (bits + ["", ""])[:3]
                self._text(t)
                inner = (f'<span class="flow-icon">{icon(ic)}</span>'
                         f'<span class="flow-step" aria-hidden="true">{k:02d}</span><span class="flow-label">{inline(t)}</span>')
                card, attrs = "", ""
                if any(l.strip() for l in rest):
                    cid = f"flow-card-{k}"
                    attrs = f' data-flow-card aria-haspopup="dialog" aria-expanded="false" aria-controls="{cid}"'
                    card = (f'<div class="flow-card" id="{cid}" role="dialog" aria-label="{html.escape(plain(t), quote=True)}" hidden>'
                            f'{self.render(rest)}<button type="button" class="flow-card-close" aria-label="Close">'
                            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>')
                steps.append(f'<li><a{link_attrs(href)}{attrs}>{inner}</a>{card}</li>' if href else f'<li><span>{inner}</span>{card}</li>')
            return f'<ol class="flow">{"".join(steps)}</ol>'
        if kind == "cards":
            # :::cards[path] = an ordered route: an <ol>, each card numbered in place of its icon
            path = (title or "").strip() == "path"
            tag = "li" if path else "div"
            cards = []
            for k, (head, rest) in enumerate(self.split_h4(body), 1):
                bits = [b.strip() for b in head.split("|")]
                t, href, ic = (bits + ["", ""])[:3]
                self._text(t)
                mark = f'<span class="num" aria-hidden="true">{k}</span>' if path else icon(ic)
                body_h = f'<div class="card-body">{self.render(rest)}</div>'
                if href:
                    # Stretched-link card: the title link covers the card, so links in the body stay valid HTML.
                    ext = '<span class="ext" aria-hidden="true">↗</span>' if is_external(href) else '<span class="arrow" aria-hidden="true">→</span>'
                    cards.append(f'<{tag} class="card link"><p class="card-title">{mark}<a class="stretched"{link_attrs(href)}>{inline(t)}</a></p>{body_h}{ext}</{tag}>')
                else:
                    cards.append(f'<{tag} class="card"><p class="card-title">{mark}<span>{inline(t)}</span></p>{body_h}</{tag}>')
            if path:
                return f'<ol class="cards path">{"".join(cards)}</ol>'
            return f'<div class="cards">{"".join(cards)}</div>'
        return ""


# --------------------------------------------------------------------------------------------
# Pages
# --------------------------------------------------------------------------------------------
def src_for(slug: str) -> Path:
    if slug == "":
        return PAGES / "index.md"
    p = PAGES / f"{slug}.md"
    return p if p.exists() else PAGES / slug / "index.md"


def url_for(slug: str) -> str:
    return BASE + (slug + "/" if slug else "")


def out_for(slug: str) -> Path:
    return DOC / slug / "index.html" if slug else DOC / "index.html"


def parse_front(text: str) -> tuple[dict, list[str]]:
    meta: dict = {}
    lines = text.splitlines()
    if lines and lines[0].strip() == "---":
        end = lines.index("---", 1)
        for ln in lines[1:end]:
            if ":" in ln:
                k, v = ln.split(":", 1)
                meta[k.strip()] = v.strip().strip('"')
        lines = lines[end + 1:]
    return meta, lines


def last_updated(path: Path) -> str:
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", str(path)], cwd=REPO,
                             capture_output=True, text=True, timeout=10).stdout.strip()
        if out:
            return out
    except Exception:
        pass
    return _dt.date.today().isoformat()


def fmt_date(iso: str) -> str:
    d = _dt.date.fromisoformat(iso)
    return d.strftime("%b ") + str(d.day) + d.strftime(", %Y")


LOGO = ('<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><rect x="2.5" y="2.5" width="35" height="35" rx="7" class="logo-plate"/>'
        '<path d="M13 9v22M20 9v22M27 9v22" class="logo-sense"/><path d="M9 15.5h22M9 24.5h22" class="logo-drive"/>'
        '<circle cx="20" cy="24.5" r="3.4" class="logo-dot"/></svg>')
# GitHub card in the header, the same as the homepage's (logo, name, live star and fork counts).
GH_LOGO = '<svg class="gh-logo" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>'
GH_STAR = '<svg class="gh-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"/></svg>'
GH_FORK = '<svg class="gh-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>'


def gh_card() -> str:
    """The homepage's GitHub card. Its starting counts are the homepage's; the page script refreshes them."""
    home = (REPO / "index.html").read_text(encoding="utf-8")
    stars = re.search(r"data-gh-stars>([^<]*)<", home)
    forks = re.search(r"data-gh-forks>([^<]*)<", home)
    st, fk = (stars.group(1) if stars else "–"), (forks.group(1) if forks else "–")
    return (f'<a class="gh-card" href="https://github.com/FlexiTac/FlexiTac" target="_blank" rel="noopener" data-gh-badge '
            f'aria-label="FlexiTac on GitHub: {st} stars, {fk} forks">{GH_LOGO}<span class="gh-text"><span class="gh-name">FlexiTac</span>'
            f'<span class="gh-stats"><span>{GH_STAR}<span data-gh-stars>{st}</span></span>'
            f'<span>{GH_FORK}<span data-gh-forks>{fk}</span></span></span></span></a>')
DISCORD_SVG = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.5 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.7.1 18.2a19.9 19.9 0 0 0 6 3l1.3-2a13 13 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2a19.8 19.8 0 0 0 6-3c.5-5.2-.9-9.8-3.6-13.8ZM8 15.4c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>')


def timeline_html() -> str:
    """The homepage timeline (index.html, section#timeline) as compact year rows of poster tiles.

    The homepage stays the one source of truth: add a node there, rebuild the docs, and it appears here too.
    Only the poster, short title, venue pill and link of each work are used (no videos, no pop-ups).
    """
    page = (REPO / "index.html").read_text(encoding="utf-8")
    a = page.index('<ol class="ft-tl-rows"')
    sec = re.sub(r'<template class="ft-tl-detail">.*?</template>', "", page[a:page.index("</section>", a)], flags=re.S)
    text = lambda h: html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", h))).strip()
    rows, n_tiles = [], 0
    for row in re.split(r'<li class="ft-tl-row[ "]', sec)[1:]:
        year = text(re.search(r'<h3 class="ft-tl-yr"[^>]*>(.*?)</h3>', row, re.S).group(1))
        nodes = []
        for node in re.split(r'<li class="ft-tl-node ', row)[1:]:
            kinds = node.split('"', 1)[0].split()
            when = text(re.search(r"<time[^>]*>(.*?)</time>", node, re.S).group(1))
            event = re.search(r'<span class="ft-tl-event">(.*?)</span>', node, re.S)
            tiles = []
            for card in re.split(r'<article class="ft-tl-card">', node)[1:]:
                media = re.search(r'<div class="ft-tl-media([^"]*)">.*?(?:poster|src)="([^"]+)"', card, re.S)
                link = re.search(r'class="ft-tl-title"><a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', card, re.S)
                if not (media and link):
                    continue
                fit = " ".join(c for c in media.group(1).split() if c in ("is-contain", "is-trim"))
                pills = "".join(f'<span class="tl-pill">{html.escape(text(p))}</span>'
                                for p in re.findall(r'<span class="ft-tl-pill[^"]*">(.*?)</span>', card, re.S))
                src = "/" + media.group(2).lstrip("/")
                href = html.unescape(link.group(1))
                if not re.match(r"^(https?:|mailto:|/)", href):
                    href = "/" + href                       # the homepage's own links are relative to the site root
                tiles.append(f'<li class="tl-tile"><a{link_attrs(href)}>'
                             f'<span class="tl-media {fit}"><img src="{html.escape(src, quote=True)}" alt="" loading="lazy" decoding="async"></span>'
                             f'<span class="tl-title">{html.escape(text(link.group(2)))}</span>{pills}</a></li>')
            if not tiles:
                continue                                   # the "work begins" origin node has no tile
            n_tiles += len(tiles)
            label = html.escape(when) + (f' · {html.escape(text(event.group(1)))}' if event else "")
            mark = " is-hollow" if "is-platform" in kinds else ""
            nodes.append(f'<li class="tl-node{mark}"><p class="tl-when">{label}</p><ul class="tl-tiles">{"".join(tiles)}</ul></li>')
        if nodes:
            rows.append((year, nodes))
    if n_tiles < 5:
        raise SystemExit("timeline: found only %d works in index.html; did the homepage timeline markup change?" % n_tiles)
    out = []
    for k, (year, nodes) in enumerate(rows):
        now = " is-now" if k == len(rows) - 1 else ""
        out.append(f'<div class="tl-row{now}"><div class="tl-label"><p class="tl-year">{html.escape(year)}</p>'
                   f'<div class="tl-nav" hidden><button type="button" data-dir="-1" aria-label="Scroll back">‹</button>'
                   f'<button type="button" data-dir="1" aria-label="Scroll forward">›</button></div></div>'
                   f'<div class="tl-lane" role="region" aria-label="{html.escape(year, quote=True)}" tabindex="0">'
                   f'<ol class="tl-items">{"".join(nodes)}</ol></div></div>')
    return f'<div class="tl">{"".join(out)}</div>'


def sidebar(cur: str, pages: dict) -> str:
    groups = []
    for label, entries in NAV:
        items = []
        for e in entries:
            if isinstance(e, tuple):
                t, u = e
                mark = '<span class="ext" aria-hidden="true">↗</span>' if is_external(u) else '<span class="ext" aria-hidden="true">↗</span>'
                items.append(f'<li><a{link_attrs(u)}>{html.escape(t)}{mark}</a></li>')
            else:
                p = pages[e]
                curr = ' aria-current="page"' if e == cur else ""
                sub = ' class="sub"' if p.get("sub") else ""            # front matter sidebar_sub: true
                soon = '<span class="soon">Soon</span>' if p.get("pending") else ""     # front matter status: pending
                items.append(f'<li{sub}><a href="{url_for(e)}"{curr}>{html.escape(p["label"])}{soon}</a></li>')
        groups.append(f'<details class="group" open><summary>{html.escape(label)}</summary><ul>{"".join(items)}</ul></details>')
    return "".join(groups)


def toc_html(toc: list[tuple[int, str, str]], title: str) -> str:
    rows = [f'<li class="l2"><a href="#_top">Overview</a></li>']
    for level, hid, text in toc:
        rows.append(f'<li class="l{level}"><a href="#{hid}">{html.escape(text)}</a></li>')
    return "<ul>" + "".join(rows) + "</ul>"


def page_html(slug: str, p: dict, pages: dict, order: list[str]) -> str:
    title, desc = p["title"], p["description"]
    k = order.index(slug) if slug in order else None
    prev_s = order[k - 1] if k else None
    next_s = order[k + 1] if k is not None and k + 1 < len(order) else None
    pager = '<nav class="pager" aria-label="Pagination">'
    if prev_s is not None:
        pager += f'<a class="prev" href="{url_for(prev_s)}" rel="prev"><span>Previous</span><strong>{html.escape(pages[prev_s]["label"])}</strong></a>'
    else:
        pager += "<span></span>"
    if next_s is not None:
        pager += f'<a class="next" href="{url_for(next_s)}" rel="next"><span>Next</span><strong>{html.escape(pages[next_s]["label"])}</strong></a>'
    pager += "</nav>"
    src_rel = p["src"].relative_to(PAGES).as_posix()
    toc = toc_html(p["toc"], title) if p["toc"] and not p["splash"] else ""
    issue = f'{ISSUE_URL}?title={html.escape("Docs: " + title, quote=True).replace(" ", "+")}&amp;labels=documentation'
    full_title = "FlexiTac Docs" if slug == "" else f"{title} | FlexiTac Docs"
    canon = SITE + url_for(slug)
    toc_block = (f'<aside class="toc" aria-label="On this page"><div class="toc-inner"><h2>On this page</h2>{toc}</div></aside>'
                 if toc else "")
    mobile_toc = (f'<details class="mtoc"><summary><span>On this page</span><span class="mtoc-cur">Overview</span></summary>{toc}</details>'
                  if toc else "")
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(full_title)}</title>
<meta name="description" content="{html.escape(desc, quote=True)}">
<link rel="canonical" href="{canon}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta property="og:title" content="{html.escape(full_title, quote=True)}">
<meta property="og:description" content="{html.escape(desc, quote=True)}">
<meta property="og:type" content="article">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{SITE}/static/images/flexitac.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/static/images/favicon.svg">
<link rel="apple-touch-icon" href="/static/images/apple-touch-icon.png">
<script>try{{var t=localStorage.getItem("ft-docs-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}}catch(e){{}}</script>
<link rel="stylesheet" href="{BASE}assets/docs.css?v={ASSET_VERSION}">
<script src="{BASE}assets/docs.js?v={ASSET_VERSION}" defer></script>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="header">
  <button class="menu" type="button" aria-label="Menu" aria-expanded="false" aria-controls="sidebar" data-menu><span></span></button>
  <a class="brand" href="{BASE}">{LOGO}<span>FlexiTac</span><span class="brand-sub">Docs</span></a>
  <button class="search-btn" type="button" data-search-open aria-label="Search">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    <span>Search</span><kbd data-kbd>Ctrl K</kbd>
  </button>
  <nav class="hlinks" aria-label="Site">
    <a class="txt" href="/">Home</a>
    {gh_card()}
    <a class="ico" href="https://discord.gg/6gw887Vxms" target="_blank" rel="noopener" aria-label="Discord">{DISCORD_SVG}</a>
    <button class="ico theme" type="button" data-theme-toggle aria-label="Theme: auto" title="Theme: auto">
      <svg class="t-auto" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor"/></svg>
      <svg class="t-light" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <svg class="t-dark" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>
    </button>
  </nav>
</header>
<div class="layout">
  <nav class="sidebar" id="sidebar" aria-label="Documentation">
    <div class="sidebar-inner">{sidebar(slug, pages)}
      <div class="sidebar-foot"><a href="/">← FlexiTac home</a></div>
    </div>
  </nav>
  <div class="main">
    {mobile_toc}
    <div class="content-row{' splash' if p['splash'] else ''}">
      <main id="content" class="content" tabindex="-1">
        <div class="hero" id="_top">
          <h1>{inline(title)}</h1>
          {f'<p class="lead">{inline(desc)}</p>' if desc else ''}
        </div>
        <div class="md">
{p["body"]}
        </div>
        <footer class="page-foot">
          <div class="meta">
            <a href="{EDIT_BASE}{src_rel}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4"/></svg>Edit page</a>
            <a href="{issue}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>Report a problem</a>
            <span class="updated">Last updated: <time datetime="{p["updated"]}">{fmt_date(p["updated"])}</time></span>
          </div>
          {pager}
        </footer>
      </main>
      {toc_block}
    </div>
    <footer class="site-foot">
      <p>FlexiTac © 2026 Columbia University · Hardware licensed <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener">CC BY-NC 4.0</a> · <a href="https://github.com/FlexiTac/FlexiTac.github.io/tree/main/doc/_src" target="_blank" rel="noopener">Docs source on GitHub</a></p>
    </footer>
  </div>
</div>
<div class="scrim" data-scrim hidden></div>
<dialog class="search" aria-label="Search the docs" data-search>
  <div class="search-box">
    <div class="search-field">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input type="search" placeholder="Search the docs" aria-label="Search the docs" autocomplete="off" spellcheck="false" data-search-input>
      <button type="button" class="search-close" data-search-close>Cancel</button>
    </div>
    <ul class="search-results" role="listbox" data-search-results></ul>
    <p class="search-hint"><kbd>↑</kbd><kbd>↓</kbd> to navigate · <kbd>Enter</kbd> to open · <kbd>Esc</kbd> to close</p>
  </div>
</dialog>
</body>
</html>
"""


def build(check: bool = False) -> int:
    order = [e for _, entries in NAV for e in entries if isinstance(e, str)]
    built = order + [u for u in UNLISTED if u not in order]
    pages: dict[str, dict] = {}
    for slug in built:
        src = src_for(slug)
        meta, lines = parse_front(src.read_text(encoding="utf-8"))
        r = Renderer()
        r.sections.append({"h": "", "a": "_top", "x": ""})
        body = r.render(lines)
        pages[slug] = {
            "title": meta.get("title", slug or "FlexiTac Docs"),
            "label": meta.get("sidebar_label") or meta.get("title", slug),
            "sub": str(meta.get("sidebar_sub", "")).lower() == "true",
            "pending": meta.get("status", "") == "pending",
            "description": meta.get("description", ""),
            "body": body, "toc": r.toc, "src": src, "sections": r.sections,
            "updated": last_updated(src),
            "splash": meta.get("layout", "") == "splash",
        }

    outputs: dict[Path, str] = {}
    index = []
    for slug in built:
        p = pages[slug]
        outputs[out_for(slug)] = page_html(slug, p, pages, order)
        for s in p["sections"]:
            text = re.sub(r"\s+", " ", s["x"]).strip()
            if not text and not s["h"]:
                continue
            index.append({"p": p["title"], "h": s["h"], "u": url_for(slug) + ("" if s["a"] == "_top" else "#" + s["a"]),
                          "x": text[:600]})
    for old, (new, anchors) in REDIRECTS.items():
        to = url_for(new)
        outputs[out_for(old)] = (
            f'<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>Moved | FlexiTac Docs</title>'
            f'<meta name="robots" content="noindex"><link rel="canonical" href="{SITE}{to}">'
            f'<meta http-equiv="refresh" content="0; url={to}">'
            f'<script>var m = {json.dumps(anchors)}, h = location.hash, t = h in m ? m[h] : h;'
            f'location.replace(t.charAt(0) === "/" ? t : "{to}" + t);</script></head>'
            f'<body><p>This page moved to <a href="{to}">{html.escape(pages[new]["title"])}</a>.</p></body></html>\n')
    outputs[DOC / "assets" / "search-index.json"] = json.dumps(index, ensure_ascii=False, separators=(",", ":"))

    # Sitemap for search engines; the site's /robots.txt points here. Unlisted pages are public too, so they're in it.
    urls = "".join(f"  <url><loc>{SITE}{url_for(s)}</loc><lastmod>{pages[s]['updated']}</lastmod></url>\n" for s in built)
    outputs[DOC / "sitemap.xml"] = ('<?xml version="1.0" encoding="UTF-8"?>\n'
                                    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n")

    # Internal link check: every /doc/... link and #anchor must resolve.
    anchors = {url_for(s): {h[1] for h in pages[s]["toc"]} | set(re.findall(r'id="([^"]+)"', pages[s]["body"])) | {"_top"} for s in built}
    problems = []
    for slug in built:
        for href in re.findall(r'href="([^"]+)"', pages[slug]["body"]):
            href = html.unescape(href)
            if href.startswith("#"):
                if href[1:] not in anchors[url_for(slug)]:
                    problems.append(f"{slug or 'index'}: missing anchor {href}")
            elif href.startswith(BASE) and not href.startswith(BASE + "assets/"):
                path, _, frag = href.partition("#")
                if path not in anchors:
                    problems.append(f"{slug or 'index'}: broken link {href}")
                elif frag and frag not in anchors[path]:
                    problems.append(f"{slug or 'index'}: missing anchor {href}")
            elif href.startswith("/") and not href.startswith("//"):
                target = REPO / unquote(href.lstrip("/").split("#")[0])
                if not (target.exists() or (target / "index.html").exists()) and not href.startswith(("/learn",)):
                    problems.append(f"{slug or 'index'}: missing file {href}")
        for src in re.findall(r'src="(/[^"]+)"', pages[slug]["body"]):
            if not (REPO / unquote(src.lstrip("/").split("?")[0])).exists():
                problems.append(f"{slug or 'index'}: missing image {src}")
    for pr in problems:
        print("LINK:", pr, file=sys.stderr)

    # Pages this script generated earlier whose slug has since left NAV: remove them (or report them under --check).
    orphans = [p for p in DOC.rglob("index.html")
               if SRC not in p.parents and p not in outputs
               and f'href="{BASE}assets/docs.css' in p.read_text(encoding="utf-8", errors="ignore")]

    stale = [p.relative_to(REPO).as_posix() + " (orphaned page)" for p in orphans] if check else []
    if not check:
        for p in orphans:
            p.unlink()
            d = p.parent
            while d != DOC and not any(d.iterdir()):
                d.rmdir()
                d = d.parent
            print("Removed orphaned page", p.relative_to(REPO).as_posix())
    for path, content in outputs.items():
        if check:
            if not path.exists() or path.read_text(encoding="utf-8") != content:
                stale.append(path.relative_to(REPO).as_posix())
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
    if check and stale:
        print("Out of date (run python3 doc/_src/build.py):\n  " + "\n  ".join(stale), file=sys.stderr)
        return 1
    if not check:
        print(f"Built {len(built)} pages, {len(index)} search entries into {DOC.relative_to(REPO)}/")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(build(check="--check" in sys.argv))
