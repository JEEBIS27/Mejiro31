# Mejiro31 developer guide

[Home](../README_EN.md) · [日本語](DEVELOPMENT.md)

- [Build and customize the QMK firmware](FIRMWARE_EN.md)
- [QMK firmware source](https://github.com/JEEBIS27/qmk_firmware/tree/master/keyboards/jeebis/mejiro31)
- [Shared Mejiro engine](https://github.com/JEEBIS27/Mejiro_Engine)

The QMK jp_default preset uses built-in Mejiro, Japanese QWERTY, and English Graphite. The en_default preset uses external Plover HID and QWERTY. Both support host JIS/US selection and alternate layouts.

## Configurator development

The static site lives in site/. Node.js and Python are enough to run it locally. The project has no npm dependencies.

```sh
npm test
npm run dev
```

The dev server opens http://127.0.0.1:4173/. Run `npm run dev -- --no-open` to start it without opening a browser. Site paths are relative to support deployment under a GitHub Pages repository path.

Firmware source revisions are pinned in `firmware/sources.json`. The data generator extracts keymaps, layout conversions, and key positions from those sources. Append new IDs to `firmware/layout_ids.json` to preserve IDs already stored on keyboards.

Reverse lookup uses the shared Rust engine compiled to WebAssembly. Grammar-aware lookup loads the parser and dictionary in a worker and falls back to simple lookup after 12 seconds. Run `just build-reverse` to rebuild the WebAssembly after updating the engine. Run `python3 scripts/generate-dictionary.py` to regenerate the dictionary index from its pinned source.

## Publish the Configurator and firmware

The Pages workflow tests and publishes the site from main. The firmware workflow builds the Japanese and English QWERTY profiles. A tag starting with vial-v publishes a GitHub Release when both profile builds succeed.

Run `just sync` to import the pair of local QMK artifacts. From the QMK repository, `just build-site` builds and imports both profiles. To package CI artifacts, run `python3 scripts/package-firmware.py .build/artifacts`. The Configurator verifies the size and SHA-256 of the bundled downloads.
