#!/usr/bin/env python3
"""Run the canonical keyboard-owned Vial adapter and protocol regression suite."""
import argparse
from pathlib import Path
import subprocess
ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()
p.add_argument('--source-dir', type=Path, default=ROOT / '.build/vial')
a = p.parse_args()
source = a.source_dir.resolve()
runner = source / 'keyboards/jeebis/mejiro31/tests/run_vial_tests.py'
subprocess.run(['python3', str(runner), '--source-dir', str(source)], check=True)
