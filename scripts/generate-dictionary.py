#!/usr/bin/env python3
"""Export the pinned engine's built-in dictionary for the configurator search."""
import argparse
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]

def generate(source):
    revision = json.loads((ROOT / 'firmware/sources.json').read_text())['engine']['ref']
    text = subprocess.check_output(['git', 'show', f'{revision}:src/tables.rs'], cwd=source, text=True)
    entries = []
    for kind, name in enumerate(['USERS_MAP', 'ABSTRACT_MAP', 'ABSTRACT_MAP_LEFT', 'ABSTRACT_MAP_RIGHT', 'VERB_MAP']):
        if re.search(r'pub const ' + name + r':[^\n]*= &\[\];', text):
            continue
        body = re.search(r'pub const ' + name + r':.*?= &\[(.*?)\n\];', text, re.S)
        if not body:
            raise ValueError(f'Missing dictionary table: {name}')
        pattern = r'\("([^"]*)", &\["([^"]*)", "([^"]*)"\]\)' if kind == 4 else r'\("([^"]*)", "([^"]*)"\)'
        for match in re.findall(pattern, body[1]):
            entries.append(dict(kind=kind, key=match[0], value=match[1], row=match[2] if kind == 4 else '', context=0, hidden=False))
    if len(entries) < 1000:
        raise ValueError('Unexpectedly incomplete dictionary export')
    (ROOT / 'site/dictionary.json').write_text(json.dumps(dict(engine=revision, entries=entries), ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'Exported {len(entries)} built-in entries')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, default=ROOT / '.build/Mejiro_Engine')
    generate(parser.parse_args().source_dir)
