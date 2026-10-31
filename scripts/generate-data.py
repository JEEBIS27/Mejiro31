#!/usr/bin/env python3
"""Generate both UI data and Vial metadata from the pinned firmware sources."""
import argparse
import json
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
LABELS = {'qwerty': 'QWERTY', 'colemak': 'Colemak', 'colemak_dh': 'Colemak-DH', 'dvorak': 'Dvorak', 'graphite': 'Graphite', 'workman': 'Workman', 'handsdown_neu': 'Hands Down Neu', 'eucalyn_biacco': 'Eucalyn 改', 'o24': '大西配列', 'tomisuke': 'Tomisuke'}
CUSTOM = [('MJI_00', '00'), ('MJI_000', '000'), ('MJI_MODE', 'Keyboard / Steno'), ('MJI_JIS', 'JIS / US'), ('MJI_ALT', '代替配列 ON / OFF'), ('MJI_MEJIRO', 'Mejiro / Plover'), ('MJI_STICKY', 'Sticky Shift')]

def generate(source):
    kb = source / 'keyboards/jeebis/mejiro31'
    keyboard = json.loads((kb / 'keyboard.json').read_text())
    catalog = (kb / 'layouts/catalog.h').read_text()
    layouts = []
    pattern = r'static const mji_layout_entry_t mji_layout_(\w+)\[\] = \{(.*?)\n\};'
    for name, body in re.findall(pattern, catalog, re.S):
        entries = [[int(x, 16) for x in m] for m in re.findall(r'\{(0x\w+), \{(0x\w+), (0x\w+)\}, \{(0x\w+), (0x\w+)\}\}', body)]
        layouts.append({'id': name, 'label': LABELS.get(name, name.replace('_', ' ').title()), 'entries': entries})
    ids = json.loads((ROOT / 'firmware/layout_ids.json').read_text())
    by_id = {entry['id']: entry for entry in layouts}
    if set(ids) != set(by_id) or len(ids) != len(set(ids)):
        raise ValueError('Update firmware/layout_ids.json by appending new catalog IDs; never reorder existing IDs.')
    layouts = [by_id[name] for name in ids]
    assert 0 < len(layouts) <= 32 and layouts[0]['id'] == 'qwerty'
    physical = [{'row': p['matrix'][0], 'col': p['matrix'][1], 'x': p['x'], 'y': p['y']} for p in keyboard['layouts']['LAYOUT']['layout']]
    impl = (kb / 'qmk/keymap_impl.h').read_text()
    pairs = [{'a': int(a), 'b': int(b), 'logical': int(pos), 'priority': int(priority)} for a, b, pos, priority in re.findall(r'\{(\d+), (\d+), (\d+), ([01])\}', impl.split('static const mji_pair_t physical_pairs[] = {')[1].split('};')[0])]
    keycodes_h = (source / 'quantum/keycodes.h').read_text()
    # The adapter supports basic keys, modifier chords, MO(0..5), Shift OSM,
    # steno usages, bootloader, and its seven explicit custom actions.
    names = list(dict.fromkeys(re.findall(r'\b((?:KC|STN)_\w+)\s*=', keycodes_h)))
    names += list(dict.fromkeys(re.findall(r'\b(STN_[A-Z0-9]+)\s*[,=]', (source / 'quantum/steno_keycodes.h').read_text().split('#ifdef STENO_COMBINEDMAP')[0])))
    names += ['KC_TRNS', 'QK_BOOTLOADER'] + [p[0] for p in CUSTOM]
    names += [f'MO({i})' for i in range(6)] + ['OSM(MOD_LSFT)']
    # Include every modifier chord in the standard QMK encoding, with free entry
    # in the UI for combinations of multiple modifiers.
    base_names = re.findall(r'\b(KC_\w+)\s*=\s*0x00[0-9A-Fa-f]{2}', keycodes_h)
    names += [f'{mod}({key})' for mod in ['LCTL', 'LSFT', 'LALT', 'LGUI', 'RCTL', 'RSFT', 'RALT', 'RGUI'] for key in base_names if key not in ['KC_NO', 'KC_TRANSPARENT']]
    profiles = {}
    code_data = None
    with tempfile.TemporaryDirectory(prefix='mejiro-data-') as tmp:
        tmp = Path(tmp)
        for profile in ['jp', 'en']:
            program = '#include <stdio.h>\n#include <stdint.h>\n#define MATRIX_ROWS 4\n#define MATRIX_COLS 12\n#define PROGMEM\n'
            program += '#include "keycodes.h"\n#include "quantum_keycodes.h"\n#include "modifiers.h"\n#include "steno_keycodes.h"\n'
            program += 'enum { MJI_QWERTY, MJI_SHIFTED, MJI_NUMBER, MJI_NUMBER_SHIFTED, MJI_FUNCTION, MJI_STENO, MJI_HOLD_OFFSET };\n'
            program += 'enum {' + ','.join([CUSTOM[0][0] + '=QK_KB_0'] + [p[0] for p in CUSTOM[1:]]) + '};\n'
            program += f'#define MJI_EN_PROFILE {int(profile == "en")}\n#include "qmk/defaults.h"\nint main(void) {{\n'
            program += 'for (int l=0;l<12;l++) for (int r=0;r<4;r++) for (int c=0;c<12;c++) printf("%u,",keymaps[l][r][c]); puts("");\n'
            for name in names:
                program += f'printf("{name}=%u\\n", (unsigned)({name}));\n'
            program += '}\n'
            (tmp / 'dump.c').write_text(program)
            subprocess.run(['cc', '-std=c11', '-I', str(kb), '-I', str(source / 'quantum'), '-I', str(source / 'quantum/keymap_extras'), '-I', str(source / 'quantum/sequencer'), '-I', str(source / 'platforms'), str(tmp / 'dump.c'), '-o', str(tmp / 'dump')], check=True)
            output = subprocess.check_output([str(tmp / 'dump')], text=True).splitlines()
            values = [int(x) for x in output[0].split(',') if x]
            profiles[profile] = [values[i:i+48] + [0] * 10 for i in range(0, len(values), 48)]
            code_data = [{'name': n, 'value': int(v)} for line in output[1:] for n, v in [line.split('=')]]
    data = {'schema': 2, 'keyCount': 58, 'storageLayers': 16, 'uid': [77,51,49,87,69,66,48,49], 'rows': 4, 'cols': 12, 'layers': ['Keyboard', 'Keyboard + Shift', 'Number', 'Number + Shift', 'Function', 'Steno'], 'physical': physical, 'pairs': pairs, 'layouts': layouts, 'defaults': profiles, 'keycodes': code_data, 'custom': dict(CUSTOM)}
    (ROOT / 'site/data.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
    header = '// Generated by scripts/generate-data.py. Layout IDs are persistent; append new layouts only.\n#pragma once\n'
    header += '#define WEB_LAYOUT_COUNT ' + str(len(layouts)) + '\n'
    header += 'static const mji_layout_map_t web_layouts[] = {\n' + ''.join('    MJI_LAYOUT_MAP(mji_layout_' + p['id'] + '),\n' for p in layouts) + '};\n'
    (ROOT / 'firmware/vial/web_layouts.h').write_text(header)
    kle = []
    previous_y = -1
    for p in physical:
        kle.append([{'x': p['x'], 'y': p['y'] - previous_y - 1}, f"{p['row']},{p['col']}"])
        previous_y = p['y']
    for i, p in enumerate(p for p in pairs if p["logical"] < 48):
        kle.append([{'x': i % 8 * 1.75, 'y': 6 + i // 8 - previous_y - 1}, f"{p['logical']//12},{p['logical']%12}"])
        previous_y = 6 + i // 8
    vial = {'name': 'Mejiro31', 'vendorId': keyboard['usb']['vid'], 'productId': keyboard['usb']['pid'], 'lighting': 'none', 'matrix': {'rows': 4, 'cols': 12}, 'customKeycodes': [{'name': n, 'title': title, 'shortName': title if len(title) < 8 else n.replace('MJI_', '')} for n, title in CUSTOM], 'layouts': {'keymap': kle}}
    (ROOT / 'firmware/vial/vial.json').write_text(json.dumps(vial, ensure_ascii=False, indent=2) + '\n')
    print(f'Generated {len(layouts)} layouts, {len(physical)} keys, {len(pairs)} virtual positions.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-dir', type=Path, default=ROOT / '.build/vial')
    generate(parser.parse_args().source_dir.resolve())
