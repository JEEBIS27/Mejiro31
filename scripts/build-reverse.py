#!/usr/bin/env python3
"""Build the browser reverse lookup module from the pinned Mejiro Engine."""
import argparse
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]
ENGINE = "53f8699e6cbeeb8fabe62ac7b7c3bed79041e999"


def build(source):
    with tempfile.TemporaryDirectory(prefix="mejiro-reverse-") as directory:
        work = Path(directory)
        with (work / "engine.tar").open("wb") as archive:
            subprocess.run(
                ["git", "-C", str(source), "archive", ENGINE],
                stdout=archive, check=True,
            )
        with tarfile.open(work / "engine.tar") as archive:
            archive.extractall(work, filter="data")
        subprocess.run(
            ["git", "apply", str(ROOT / "scripts/reverse-word-lookup.patch")],
            cwd=work, check=True,
        )
        subprocess.run([
            "cargo", "build", "--locked", "--release", "-p", "mejiro-native",
            "--target", "wasm32-unknown-unknown", "--manifest-path", str(work / "Cargo.toml"),
            "--target-dir", str(work / "target"),
        ], check=True)
        artifact = work / "target/wasm32-unknown-unknown/release/mejiro_native.wasm"
        target = ROOT / "site/engine/mejiro_native.wasm"
        target.parent.mkdir(parents=True, exist_ok=True)
        staged = target.with_suffix(".wasm.tmp")
        shutil.copyfile(artifact, staged)
        staged.replace(target)
        print(f"Built {target} from Mejiro Engine {ENGINE}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--engine-source", type=Path, default=ROOT.parent / "Mejiro_Engine")
    build(parser.parse_args().engine_source)
