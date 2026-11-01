#!/usr/bin/env python3
"""Build the shared Mejiro Engine's browser reverse lookup module."""
import argparse
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--engine-source', type=Path, default=ROOT.parent / 'Mejiro_Engine')
args = parser.parse_args()
source = args.engine_source.resolve()
subprocess.run([
    'cargo', 'build', '--locked', '--release', '-p', 'mejiro-native',
    '--target', 'wasm32-unknown-unknown', '--manifest-path', str(source / 'Cargo.toml'),
], check=True)
artifact = source / 'target/wasm32-unknown-unknown/release/mejiro_native.wasm'
target = ROOT / 'site/engine/mejiro_native.wasm'
target.parent.mkdir(parents=True, exist_ok=True)
staged = target.with_suffix('.wasm.tmp')
shutil.copyfile(artifact, staged)
staged.replace(target)
print(f'Built {target} from {source}')
