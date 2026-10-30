#!/usr/bin/env python3
"""Import a verified QWERTY JP/EN pair from the local QMK build output."""
import argparse
import importlib.util
import json
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('uf2_builder', ROOT / 'scripts/build-firmware.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def sync(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    if source == output:
        raise ValueError('Source and destination must differ')
    assets, payloads, common_sources = [], {}, None
    # Validate the entire pair before changing any site files.
    for profile in ['jp', 'en']:
        name = f'mejiro31_{profile}.uf2'
        uf2 = source / name
        digest = builder.verify_uf2(uf2)
        checksum = uf2.with_suffix('.uf2.sha256').read_text().split()
        if checksum != [digest, name]:
            raise ValueError(f'Checksum mismatch: {uf2}')
        metadata = json.loads(uf2.with_suffix('.uf2.json').read_text())
        if (metadata.get('format') != 'mejiro31-build-v1'
                or metadata.get('filename') != name
                or metadata.get('sha256') != digest
                or not (metadata.get('keymap') == f'{profile}_default'
                        or (metadata.get('profile') == profile
                            and metadata.get('layout') == 'qwerty'
                            and metadata.get('keymap') == 'vial'))):
            raise ValueError(f'Invalid build metadata: {uf2}')
        sources = metadata.get('sources')
        if not isinstance(sources, dict) or not all(sources.get(k) for k in ['engine', 'vial', 'keyboard_head']):
            raise ValueError(f'Missing source provenance: {uf2}')
        if common_sources is not None and sources != common_sources:
            raise ValueError('JP/EN source provenance differs; rebuild both together')
        common_sources = sources
        raw = uf2.read_bytes()
        payloads[name] = raw
        payloads[name + '.sha256'] = f'{digest}  {name}\n'.encode()
        payloads[name + '.json'] = (json.dumps(metadata, indent=2) + '\n').encode()
        assets.append({'filename': name, 'size': len(raw), 'sha256': digest})
    payloads['sources.json'] = (json.dumps({'format': 'mejiro31-build-sources-v1',
                                          'sources': common_sources}, indent=2) + '\n').encode()
    payloads['manifest.json'] = (json.dumps({'format': 'mejiro31-firmware-v1', 'assets': assets}, indent=2) + '\n').encode()
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.firmware-sync-', dir=output.parent) as tmp:
        staged = Path(tmp)
        for name, raw in payloads.items():
            (staged / name).write_bytes(raw)
        # The manifest is replaced last, after all binaries and sidecars.
        for name in payloads:
            (staged / name).replace(output / name)
    for path in output.glob('mejiro31_vial_*'):
        if path.name not in payloads and path.name.endswith(('.uf2', '.uf2.sha256', '.uf2.json')):
            path.unlink()
    print(f'Imported QWERTY JP/EN into {output}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', nargs='?', type=Path, default=ROOT.parent / 'qmk_firmware/.build')
    args = parser.parse_args()
    sync(args.source, ROOT / 'site/firmware')


if __name__ == '__main__':
    main()
