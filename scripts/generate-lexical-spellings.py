#!/usr/bin/env python3
"""Export the explicit general-abbreviation spellings from Mejiro IME."""
import argparse
import json
from pathlib import Path
import re
import subprocess

REVISION = "a79024daab242549969638b79e64ec8a922a865b"
ROOT = Path(__file__).resolve().parents[1]


def generate(source):
    text = subprocess.check_output(
        ["git", "show", f"{REVISION}:src/lexicon.rs"], cwd=source, text=True
    )
    general = re.search(r"const GENERAL:.*?= &\[(.*?)\n\];", text, re.S)[1]
    prefixes = re.search(r"const PREFIXES:.*?= &\[(.*?)\n\];", text, re.S)[1]
    spellings = {
        kana: re.findall(r'"([^"]+)"', forms)
        for kana, forms in re.findall(r'\("([^"]+)", &\[(.*?)\]\)', general)
    }
    if not spellings.get("かんじ"):
        raise ValueError("Missing general-abbreviation spellings")
    value = {"spellings": spellings, "prefixes": re.findall(r'"([^"]+)"', prefixes)}
    (ROOT / "site/lexical-spellings.js").write_text(
        f"// Mejiro IME {REVISION}, src/lexicon.rs.\n"
        + "export const lexicalSpellings = "
        + json.dumps(value, ensure_ascii=False, indent=2)
        + ";\n"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ime_source", type=Path)
    generate(parser.parse_args().ime_source)
