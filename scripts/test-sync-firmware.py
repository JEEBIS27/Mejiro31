#!/usr/bin/env python3
import importlib.util
import json
from pathlib import Path
import struct
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('sync_firmware', Path(__file__).with_name('sync-firmware.py'))
syncer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(syncer)


class SyncTests(unittest.TestCase):
    def pair(self, source):
        for profile in ['jp', 'en']:
            name = f'mejiro31_{profile}.uf2'
            path = source / name
            raw = bytearray(512)
            struct.pack_into('<8I', raw, 0, 0x0a324655, 0x9e5d5157, 0x2000, 0x10000000, 256, 0, 1, 0xe48bff56)
            raw[32:40] = b'M31WEB01'
            struct.pack_into('<I', raw, 508, 0x0ab16f30)
            path.write_bytes(raw)
            digest = syncer.builder.verify_uf2(path)
            path.with_suffix('.uf2.sha256').write_text(f'{digest}  {name}\n')
            path.with_suffix('.uf2.json').write_text(json.dumps({
                'format': 'mejiro31-build-v1', 'filename': name, 'sha256': digest,
                'profile': profile, 'layout': 'qwerty', 'keymap': 'vial',
                'sources': {'engine': 'a' * 40, 'vial': 'b' * 40, 'keyboard_head': 'c' * 40}}))

    def test_pair_and_provenance_imported_and_graphite_removed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); source = root / 'source'; source.mkdir()
            output = root / 'site'; output.mkdir()
            self.pair(source)
            stale = output / 'mejiro31_vial_jp_graphite.uf2'; stale.touch()
            syncer.sync(source, output)
            self.assertFalse(stale.exists())
            manifest = json.loads((output / 'manifest.json').read_text())
            self.assertEqual(len(manifest['assets']), 2)
            for asset in manifest['assets']:
                self.assertEqual(syncer.builder.verify_uf2(output / asset['filename']), asset['sha256'])
                self.assertTrue((output / (asset['filename'] + '.json')).exists())

    def test_bad_or_incomplete_pair_leaves_destination_unchanged(self):
        for error in ['missing-en', 'checksum', 'provenance', 'metadata', 'uf2']:
            with self.subTest(error=error), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp); source = root / 'source'; source.mkdir()
                output = root / 'site'; output.mkdir()
                sentinel = output / 'manifest.json'; sentinel.write_text('original')
                self.pair(source)
                en = source / 'mejiro31_en.uf2'
                if error == 'missing-en': en.unlink()
                elif error == 'checksum': en.with_suffix('.uf2.sha256').write_text('bad')
                elif error == 'uf2': en.write_bytes(b'bad')
                else:
                    meta = en.with_suffix('.uf2.json'); data = json.loads(meta.read_text())
                    if error == 'provenance': data['sources']['engine'] = 'd' * 40
                    else: data['layout'] = 'graphite'
                    meta.write_text(json.dumps(data))
                with self.assertRaises((ValueError, FileNotFoundError)):
                    syncer.sync(source, output)
                self.assertEqual(sentinel.read_text(), 'original')
                self.assertEqual(list(output.iterdir()), [sentinel])


if __name__ == '__main__':
    unittest.main()
