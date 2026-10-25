# Using Mejiro31: Unified Input Engine

[Start page](../README.md) / [日本語](USAGE.md)

This guide covers the current QMK source presets, `jp_default` and `en_default`. If you use a released v0.4.2 UF2, follow the [legacy guide](legacy/USAGE_EN.md). See [building and migration](FIRMWARE.md#english) for the new firmware.

## Keyboard input and two-row compression

The keyboard starts in normal typing mode. Two-row compression uses a pair of physical keys under one finger to produce the middle-row key. With the base QWERTY assignments, `E + C` produces `D`. An enabled alternate layout then maps that logical key to its output.

Pairs depend on physical positions, so remapping a key does not change its pair. Keys and combos on different fingers can be held simultaneously. Pressing Shift or a layer key while an earlier key is pending does not retroactively change that earlier key.

Releasing either member releases the combo. Releasing the remaining member promptly produces no extra key. Keeping it held activates that single key after a short continuation interval. Adding the paired key to an already-held single key switches directly to the combo.

## Default controls

Saved keymaps and preferences take precedence over these defaults.

| Action | Result |
| --- | --- |
| Tap the center key | Switch between normal typing and steno |
| Hold the center key | NUMBER layer |
| Tap the large left/right thumb keys in normal mode | Space / Enter |
| Hold those keys in normal mode | Shift |
| Tap NUMBER's far-left upper key | Switch between built-in Mejiro and external Plover |
| Tap NUMBER's far-right upper key | Enable/disable alternate layouts |
| Hold NUMBER's far-right lower key | FUNCTION layer |
| Tap FUNCTION's far-left upper key | Switch the host layout setting between JIS and US |

Unlike the legacy firmware, the Mejiro, alternate-layout and JIS/US toggles are **tap** actions. The former symbol-layout toggle is not available in this firmware.

NUMBER provides numbers, arrows and navigation keys. FUNCTION provides F1–F12, media and brightness controls. The 00 key initially sends two zeros, then holds one zero; 000 works similarly. Further repetition follows the host OS settings.

## Tap and Hold

Every key handled by the normal input engine, including a combo result, has separate Tap and Hold assignments.

- Using a key's Hold to modify another key suppresses its Tap on release.
- Releasing it before the long-hold threshold, without using its Hold for another key, releases its Hold first and then performs its Tap. Space/Shift therefore does not apply its own Shift to the Space tap.
- Reaching the long-hold threshold also suppresses Tap.
- An undefined Hold makes the key behave as an ordinary press/hold/release key, including OS repeat.

Hold does not always wait for the long-hold threshold. A short overlap can already form a modifier shortcut.

Sticky Shift can be assigned as a Tap action. It shifts the next target key, then releases on that key's release or when a different key begins. It does not shift that following key. A directly held Shift takes precedence when both are present.

## Languages, host layout and saved settings

English/Japanese profiles and the host's JIS/US setting are separate choices.

| Initial setting | `jp_default` | `en_default` |
| --- | --- | --- |
| Normal typing profile | English | English |
| English alternate layout | Graphite | QWERTY |
| Japanese alternate layout | QWERTY | QWERTY |
| Host layout | US | US |
| Alternate layouts | Enabled | Enabled |
| Steno selection | Built-in Mejiro | External Plover HID |

If your OS uses JIS, select JIS using the FUNCTION toggle. Eisu/Kana keys select a language profile and send IME OFF/ON. The keyboard cannot observe IME changes made only on the computer.

The JIS/US, alternate-layout enabled, and built-in/external steno choices survive power cycles. Temporary language state and recordings do not. Reflashing a different default does not overwrite valid saved preferences.

Ctrl/Alt/GUI shortcuts bypass alternate-layout conversion. macOS uses Ctrl/GUI swapping and Home/End conversion. JIS Alt+Zenkaku/Hankaku is handled separately from ordinary symbol conversion.

## Steno

### Built-in Mejiro

Built-in Mejiro works without running Plover. Conversion, context, undo and macros use the shared [Rust Mejiro engine](https://github.com/JEEBIS27/Mejiro_Engine). Refer to its [specification](https://github.com/JEEBIS27/Mejiro_Engine/blob/main/docs/specification.md) for strokes and commands.

QMK output targets a Japanese IME in romaji input mode. The JP preset sends IME ON when entering built-in Mejiro. Returning to keyboard mode restores the previous keyboard language profile and sends its corresponding IME ON/OFF command. This restores the keyboard's profile, not an IME state read from the OS.

Some symbols still need IME romaji-table mappings. Check the [existing table](https://github.com/JEEBIS27/Mejiro31/releases/download/v0.3.8/romantable.txt) with your IME. QMK disables the `#-n` switch to Kana output mode. `-U` sends two Backspaces when no undo history exists.

### External Plover HID

1. Use Plover 5.1.0 or later and select **Plover HID** as the machine.
2. For Japanese Mejiro input, follow the [Plover Mejiro installation guide](https://github.com/JEEBIS27/Plover_Mejiro).
3. Select external Plover using the NUMBER toggle, then enter steno with the center key.

No Gemini PR serial port setting or legacy `plover-machine-hid` plugin is needed. The firmware sends key state changes and lets Plover assemble strokes. Leaving steno or entering a shortcut sends an all-up state; an already-transmitted stroke is not discarded. Without Plover connected, steno keys do not produce normal text.

Normal keyboard compression is bypassed for steno keys. Holding a Ctrl/Alt/GUI function temporarily enables ordinary keyboard shortcuts. Shift alone does not trigger that switch.

## Recording

A recording started in built-in Mejiro continues across a switch to normal typing. Normal keys, modifiers and shortcuts are sent live. Returning to steno imports only the recorded data, without resending keys. A later replay command plays them in order with the steno output. Refer to the engine specification for recording controls.

Hold durations, OS autorepeat and the IME's final committed text are not recorded. Exceeding capacity aborts and erases the active recording slots while keeping live typing and unrelated saved slots working. Recordings are held in RAM and disappear on power loss.

Plover Mejiro records steno output, but does not record normal keyboard input.

## Remapping

The new firmware uses six Tap/Hold pairs, twelve maps in total, and editable virtual positions for combo results. Legacy six-layer VIA saves and the old `via_keymap.json` are not compatible.

VIA Raw HID remains available, but the editor needs a definition matching the twelve maps and virtual positions. The old definition distributed here does not support this format, and a dedicated Vial UI has not been implemented. Use the [source customization guide](FIRMWARE.md#english) for now.

[Back to start](../README.md)
