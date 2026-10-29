#!/usr/bin/env python3
"""Package verified build artifacts for downloads from the static site."""
import argparse
import importlib.util
import json
from pathlib import Path
import shutil
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('builder', ROOT / 'scripts/build-firmware.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
p = argparse.ArgumentParser()
p.add_argument('artifact_dirs', nargs='+', type=Path)
a = p.parse_args()
sources = json.loads((ROOT / 'firmware/sources.json').read_text())
data = json.loads((ROOT / 'site/data.json').read_text())
allowed = {f'mejiro31_vial_{profile}_qwerty.uf2' for profile in ['jp','en']}
output = ROOT / 'site/firmware'
output.mkdir(exist_ok=True)
assets = []
for directory in a.artifact_dirs:
    if json.loads((directory / 'sources.json').read_text()) != sources:
        raise ValueError(f'Source pins do not match: {directory}')
    for uf2 in sorted(directory.glob('*.uf2')):
        if uf2.name not in allowed:
            raise ValueError(f'Unknown firmware variant: {uf2.name}')
        digest = builder.verify_uf2(uf2)
        if digest != uf2.with_suffix('.uf2.sha256').read_text().split()[0]:
            raise ValueError(f'Checksum mismatch: {uf2}')
        shutil.copyfile(uf2, output / uf2.name)
        (output / (uf2.name + '.sha256')).write_text(f'{digest}  {uf2.name}\n')
        assets.append({'filename': uf2.name, 'size': uf2.stat().st_size, 'sha256': digest})
(output / 'sources.json').write_text(json.dumps(sources, indent=2) + '\n')
(output / 'manifest.json').write_text(json.dumps({'format': 'mejiro31-firmware-v1', 'assets': assets}, indent=2) + '\n')
print(f'Packaged and verified {len(assets)} UF2 files into {output}')
