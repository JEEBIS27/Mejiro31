#!/usr/bin/env python3
"""Prepare an isolated, pinned Vial tree; never modifies the source checkouts."""
import argparse
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCES = json.loads((ROOT / 'firmware/sources.json').read_text())

def run(*args, cwd=None):
    subprocess.run(args, cwd=cwd, check=True)

def checkout(name, parent):
    spec = SOURCES[name]
    dest = parent / name
    if not (dest / '.git').exists():
        dest.mkdir(parents=True, exist_ok=True)
        run('git', 'init', str(dest))
        run('git', 'remote', 'add', 'origin', spec['url'], cwd=dest)
    revision = subprocess.run(
        ['git', 'rev-parse', '--verify', 'HEAD'], cwd=dest,
        capture_output=True, text=True,
    )
    current = revision.stdout.strip() if revision.returncode == 0 else ''
    if current != spec['ref']:
        run('git', 'fetch', '--depth', '2', 'origin', spec['ref'], cwd=dest)
        run('git', 'checkout', '--detach', 'FETCH_HEAD', cwd=dest)
    return dest

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--work-dir', type=Path, default=ROOT / '.build')
    parser.add_argument('--skip-submodules', action='store_true')
    args = parser.parse_args()
    parent = args.work_dir.resolve()
    parent.mkdir(parents=True, exist_ok=True)
    keyboard = checkout('keyboard', parent)
    helper = keyboard / 'keyboards/jeebis/mejiro31/build_vial.py'
    if not helper.is_file():
        raise ValueError('Pinned keyboard source must contain the unified Vial build helper')
    command = ['python3', str(helper), '--work-dir', str(parent), '--prepare-only']
    if args.skip_submodules:
        command.append('--skip-submodules')
    subprocess.run(command, check=True)
    vial = parent / 'vial'
    actual = json.loads((vial / '.mejiro31-vial-build.json').read_text())
    if actual['vial'] != SOURCES['vial']['ref'] or actual['engine'] != SOURCES['engine']['ref']:
        raise ValueError('Site pins and keyboard-owned Vial build sources do not match')
    (vial / '.mejiro31-prepared.json').write_text(json.dumps(SOURCES, indent=2) + '\n')
    print(f'Prepared unified Mejiro31 Vial source: {vial}')

if __name__ == '__main__': main()
