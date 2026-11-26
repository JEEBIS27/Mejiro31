# Building and customizing Mejiro31 firmware

[Home](../README_EN.md) · [Developer guide](DEVELOPMENT_EN.md) · [日本語](FIRMWARE.md)

Use `jp_default` or `en_default` from the [QMK firmware source](https://github.com/JEEBIS27/qmk_firmware/tree/master/keyboards/jeebis/mejiro31). Normal typing uses the unified input engine, built-in Mejiro uses the shared Rust engine, and external steno uses Plover HID.

Use a working [QMK build environment](https://docs.qmk.fm/newbs_getting_started), Rust/Cargo, and the `thumbv6m-none-eabi` target. Clone `qmk_firmware` with its submodules and `Mejiro_Engine` as sibling directories, then run the following commands.

```sh
git clone --recurse-submodules https://github.com/JEEBIS27/qmk_firmware.git
git clone https://github.com/JEEBIS27/Mejiro_Engine.git
rustup target add thumbv6m-none-eabi
cd qmk_firmware
qmk compile -kb jeebis/mejiro31 -km jp_default
qmk compile -kb jeebis/mejiro31 -km en_default
```

The QMK root will contain `mejiro31_jp.uf2` and `mejiro31_en.uf2`.

Back up saved keymaps before initialization. Hold the PCB BOOT button while connecting USB and copy the UF2 to `RPI-RP2`. Reflashing alone does not erase saved keymaps. Initialize the dynamic keymap using a suitable tool or a temporary initialization build calling `eeconfig_init();` at the start of `keyboard_post_init_user()`. After running it once, remove that line and reflash a normal build; leaving it in would erase settings on every boot. Initialization removes saved keymaps, macros and settings. Verify host JIS/US, language and steno selection afterward. Select **Plover HID** in Plover for external steno.

For source remapping, edit `qmk/defaults.h`: Tap maps 0–5 pair with Hold maps 6–11 at the same coordinates. An undefined Hold is `KC_NO`; modifier keys and `MO(n)` belong on the Hold side. The firmware does not use standard QMK `MT`/`LT` definitions. Combo outputs occupy virtual positions; physical pairs are in `qmk/keymap_impl.h`. For browser-based remapping, see the [Configurator guide](CONFIGURATOR_EN.md).

Choose language layouts with `MJI_ENGLISH_LAYOUT` and `MJI_JAPANESE_LAYOUT` in the preset's `keymap.c`; definitions now live in `layouts/catalog.h`. Set `MJI_COMBO_MS`, `MJI_CONTINUATION_MS`, and `MJI_LONG_HOLD_MS` in `config.h` to adjust the combo window, remaining-key continuation delay, and long-hold Tap suppression. The latter is not a delay before every Hold activation. `TAPPING_TERM` does not control these decisions.

Built-in recordings allow 512 UTF-8 bytes, eight semantic operations and 128 external HID events per slot. Keyboard input is sent live and imported into the recording without a second transmission. Recordings do not preserve timing or OS repeat.

The source has passed both builds, regression tests, linked USB descriptor checks and ARM execution checks. Those checks do not verify physical USB communication or your IME.
