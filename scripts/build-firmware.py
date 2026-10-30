#!/usr/bin/env python3
"""Build QWERTY JP/EN firmware for site downloads."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import struct
import subprocess
ROOT = Path(__file__).resolve().parents[1]

def verify_uf2(path):
    raw = path.read_bytes()
    if not raw or len(raw) % 512:
        raise ValueError(f'Invalid UF2 length: {path}')
    count = len(raw) // 512
    addresses = set()
    payload = bytearray()
    for index in range(count):
        block = raw[index*512:(index+1)*512]
        magic1, magic2, flags, address, length, number, total, family = struct.unpack_from('<8I', block)
        if (magic1, magic2, struct.unpack_from('<I', block, 508)[0]) != (0x0a324655, 0x9e5d5157, 0x0ab16f30):
            raise ValueError('Invalid UF2 magic')
        if flags != 0x2000 or family != 0xe48bff56 or length != 256 or total != count or number != index:
            raise ValueError('Invalid RP2040 UF2 metadata')
        # The board reserves its final 8 KiB flash for wear-levelled EEPROM.
        if address % 256 or address < 0x10000000 or address + length > 0x10200000 - 8192 or address in addresses:
            raise ValueError('Invalid UF2 flash address')
        addresses.add(address)
        payload.extend(block[32:32+length])
    if b'M31WEB01' not in payload:
        raise ValueError('Mejiro31 site protocol is missing from firmware')
    return hashlib.sha256(raw).hexdigest()

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--source-dir', type=Path, default=ROOT / '.build/vial')
    p.add_argument('--output-dir', type=Path, default=ROOT / '.build/artifacts')
    p.add_argument('--profile', choices=['jp','en','all'], default='all')
    p.add_argument('--layout', choices=['qwerty'], default='qwerty')
    p.add_argument('--jobs', type=int, default=4)
    a = p.parse_args()
    source = a.source_dir.resolve()
    if not (source / '.mejiro31-prepared.json').exists():
        p.error('Run scripts/prepare-firmware.py first; source must be an isolated prepared tree.')
    if json.loads((source / '.mejiro31-prepared.json').read_text()) != json.loads((ROOT / 'firmware/sources.json').read_text()):
        p.error('Pinned sources changed. Run scripts/prepare-firmware.py again.')
    data = json.loads((ROOT / 'site/data.json').read_text())
    layouts = [(i,x) for i,x in enumerate(data['layouts']) if a.layout == 'all' or x['id'] == a.layout]
    if not layouts: p.error('Unknown layout: ' + a.layout)
    output = a.output_dir.resolve(); output.mkdir(parents=True, exist_ok=True)
    for profile in (['jp','en'] if a.profile == 'all' else [a.profile]):
        for layout_id, layout in layouts:
            # QMK doesn't track changes in Make command-line defines. Force the
            # variant's objects to rebuild while retaining Cargo's cached core.
            shutil.rmtree(source / '.build/obj_jeebis_mejiro31_vial', ignore_errors=True)
            for ext in ['elf','uf2','hex','bin','map']:
                (source / f'.build/jeebis_mejiro31_vial.{ext}').unlink(missing_ok=True)
            subprocess.run(['make', 'jeebis/mejiro31:vial', f'-j{a.jobs}', f'MEJIRO_PROFILE={int(profile == "en")}', f'MEJIRO_LAYOUT={layout_id}'], cwd=source, check=True)
            dest = output / f'mejiro31_{profile}.uf2'
            shutil.copyfile(source / '.build/jeebis_mejiro31_vial.uf2', dest)
            digest = verify_uf2(dest)
            dest.with_suffix('.uf2.sha256').write_text(f'{digest}  {dest.name}\n')
            print(f'Verified: {dest}', flush=True)
    (output / 'sources.json').write_text((ROOT / 'firmware/sources.json').read_text())

if __name__ == '__main__': main()
