# Mejiro31 Configurator

[Home](../README_EN.md) · [日本語](CONFIGURATOR.md)

## Update the firmware

1. Export a JSON backup if you have saved settings.
2. Open the [Configurator](https://jeebis27.github.io/Mejiro31/), select the Japanese or English profile, and download its UF2. The Japanese profile includes IME switching keys. The English profile prioritizes symbols. Both profiles support US and JIS host layouts.
3. Hold the PCB's BOOT button while connecting it by USB. Copy the UF2 to the RPI-RP2 drive.
4. Reconnect the keyboard in normal mode.

## Edit and save settings

1. Open the Configurator in a desktop browser with WebHID support, such as Chrome or Edge, and connect the keyboard.
2. Select a key to edit Tap or Hold. Select a small button between keys to edit the output of that fixed two-key combination.
3. Use keyboard settings to choose alternate layouts, select the host US or JIS layout, and adjust timing where supported. Displayed assignments are the keys before layout conversion.
4. If the keyboard is locked, select the unlock control and hold both outer keys on the top row.
5. Save your settings to the keyboard. If it disconnects during saving, reconnect it and read back the settings.

You can edit offline and export a JSON backup. To import a backup to a connected keyboard, use the matching language profile.

## Steno and input testing

Use Mejiro settings to edit dictionary entries and First up chords send. Dictionary search includes built-in entries and your current overrides. Reverse lookup finds strokes from hiragana. The input test shows the keys and committed IME text that reach the browser.

On supported firmware, Mejiro settings also control immediate output of the final small tsu, automatic IME switching, and romaji or JIS kana output and its key interval.

## RMK firmware preview

The Configurator offers Japanese and English preview UF2 files for hardware testing. Export the keymap and dictionary to JSON before flashing. To change settings on the preview firmware, use the RMK-compatible preview Configurator.

## Connection problems

If the browser reports “Failed to open the device,” close Vial, VIA, and other connected browser tabs, then reconnect. On Linux, see the [Vial udev setup instructions](https://get.vial.today/manual/linux-udev.html).
