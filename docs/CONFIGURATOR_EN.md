# Mejiro31 Configurator

[Home](../README_EN.md) · [日本語](CONFIGURATOR.md)

## Update the firmware

1. Export a JSON backup if you have saved settings.
2. Open the [Firmware page](https://jeebis27.github.io/Mejiro31/?lang=en#firmware) and select **Download UF2**. The download starts with the QWERTY layout.
3. Hold the PCB's BOOT button while connecting it by USB. Copy the UF2 to the RPI-RP2 drive.
4. Reconnect the keyboard in normal mode.

## Edit and save settings

1. Open the [Configurator](https://jeebis27.github.io/Mejiro31/?lang=en) in a desktop browser with WebHID support, such as Chrome or Edge, and connect the keyboard.
2. Select a key to edit Tap or Hold. Select a small button between keys to edit the output of that fixed two-key combination.
3. Use keyboard settings to choose an alternate layout and adjust timing where supported. Displayed assignments are the keys before layout conversion.
4. If the keyboard is locked, select the unlock control and hold both outer keys on the top row.
5. Save your settings to the keyboard. If it disconnects during saving, reconnect it and read back the settings.

You can edit offline and export a JSON backup. Import backups from the same firmware profile as the connected keyboard.

## Input testing

The Input test page shows key events received by the browser.

## RMK firmware preview

Download the preview UF2 from **RMK firmware preview** for hardware testing. Export a JSON backup before flashing. Use the RMK-compatible preview Configurator to change its settings.

## Connection problems

If the browser reports “Failed to open the device,” close Vial, VIA, and other connected browser tabs, then reconnect. On Linux, see the [Vial udev setup instructions](https://get.vial.today/manual/linux-udev.html).
