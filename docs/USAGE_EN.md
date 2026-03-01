# How to Use Mejiro31 ([Back to Start Page](../README.md))

![](./imgs/layer_qwerty_2.png)

## Table of Contents
  1. [Key Layouts](#key-layouts)
     - [KEYBOARD Layer](#keyboard-layer)
     - [STENO Layer](#steno-layer)
     - [NUMBER Layer](#number-layer)
     - [FUNCTION Layer](#function-layer)
  2. [How to Remap Keys](#how-to-remap-keys)
  3. [Advanced Customization](#advanced-customization)
  4. [Contact Us](#contact-us)

## Key Layouts

The default key layout looks like this.

### KEYBOARD Layer
![](./imgs/layer_qwerty_2.png)
The KEYBOARD layer is the standard layer.

Every time you connect Mejiro31, it starts on this layer.

It uses [two-step compression](https://note.com/jeebis_keyboard/n/ncbc327906050), so about $1/3$ of the keys are typed by pressing adjacent keys simultaneously with the same finger.

![](./imgs/二段圧縮.png)

If you want an alternate layout such as Dvorak or Colemak instead of QWERTY, see the firmware list in the [Start Page](../README.md) to download and flash your preferred layout. If you want another layout added, request it via GitHub [Issues](https://github.com/JEEBIS27/Mejiro31/issues).

The left and right spacebars are Space and Enter, respectively, but a long press turns them into Shift.

When Shift is held, the layout changes as shown below.

![](./imgs/layer_qwerty_2_shift.png)

Tap the center layer key to switch to the STENO layer; hold it to switch to the NUMBER layer.

### STENO Layer
![](./imgs/layer_mejiro.png)
The STENO layer runs QMK Mejiro-style stenography by default.

Holding the QMK Mejiro-style toggle key (described later) switches this to the GEMINI layer.

![](./imgs/layer_gemini.png)
The GEMINI layer is required for using stenography with Plover software.

It outputs codes dedicated to Plover.

You generally do not change this keymap.

If the keyboard suddenly stops typing, check that you have not switched to the GEMINI layer.

Tap the center layer key to go back to the KEYBOARD layer; hold it to switch to the NUMBER layer.

### NUMBER Layer
![](./imgs/layer_number.png)
The NUMBER layer holds numbers, arrow keys, and other function keys.

The key above 0 is a 00 key that outputs two zeros.

When Shift is held, the layout changes as shown below.

![](./imgs/layer_number_shift.png)

On the far left, the top key is the QMK Mejiro-style toggle. Holding it disables Mejiro-style mode and activates the GEMINI layer.

On the far right, the top key (hold) toggles alternate layouts on or off, and the bottom key (hold) moves to the FUNCTION layer.

### FUNCTION Layer
![](./imgs/layer_function.png)
The FUNCTION layer provides F1–F13 keys and media keys.

On the far left, the top key (hold) toggles a mode that allows US keyboard input even when the PC keyboard layout is set to JIS.

Mejiro31 outputs as a US keyboard, so if your PC is set to JIS layout, you should enable this mode for proper output.

By default, this mode is enabled.

Note that PC-side shortcuts remain JIS.

On the far right, the top key (hold) toggles a mode that changes the symbols on the QWERTY and NUMBER layers to standard keyboard layout.

When enabled, pressing `Shift + 2` on the NUMBER layer outputs `@`, for example.

## How to Remap Keys

First, download this file:
- [via_keymap.json](https://github.com/JEEBIS27/Mejiro31/releases/download/v0.0.0/via_keymap.json)

Next, open `VIA` in your browser and choose DESIGN.

(This link opens the DESIGN view directly.)

- [VIA/DESIGN](https://www.usevia.app/design)

![](./imgs/via_design.png)

In the DESIGN tab, click `Load`.

![](./imgs/via_load.png)

Select the JSON file you downloaded. If it loads correctly, the layout appears as shown below.

![](./imgs/via_loaded.png)

After loading the JSON, move to the CONFIGURE tab.

![](./imgs/via_configure.png)

Click `Authorize device`, then choose Mejiro31 in the popup to connect.

![](./imgs/via_select_keyboard.png)

You will enter the keymap editor. Click a key on the keyboard, then pick a new key from the list below to remap it.

![](./imgs/via_QWERTY.png)

Once you do this setup, future changes only require opening the VIA CONFIGURE tab and connecting Mejiro31; you do not need to load the JSON again.

(VIA cannot redefine simultaneous presses of vertical neighbors, so in practice you can only change keys on the NUMBER and FUNCTION layers. For alternate layouts like Dvorak or Colemak, see [Advanced Customization](#advanced-customization).)

## Advanced Customization

### Outline
  1. [How to perform advanced customization](#how-to-perform-advanced-customization)
     - [Fork the firmware repository](#fork-the-firmware-repository)
     - [Set up the firmware build environment](#set-up-the-firmware-build-environment)
  2. [Examples of advanced customization](#examples-of-advanced-customization)
     - [Language settings per layer](#language-settings-per-layer)
     - [Language settings for alternate layouts](#language-settings-for-alternate-layouts)
     - [Define alternate layouts](#define-alternate-layouts)
     - [Detailed combo settings](#detailed-combo-settings)
     - [config.h settings](#configh-settings)

Mejiro31 supports deeper customization by editing its QMK firmware settings to meet finer needs.

### How to perform advanced customization

To customize deeply, fork the Mejiro31 firmware repository into your account and set up a build environment.

Build the modified source and flash the resulting firmware onto Mejiro31 to apply your changes.

### Fork the firmware repository

Visit [github.com](https://github.com/).

![](./imgs/github_home.png)

If you do not have a GitHub account, sign up first.

Then open the Mejiro31 QMK firmware repository:
- [JEEBIS27/qmk_firmware](https://github.com/JEEBIS27/qmk_firmware)

![](./imgs/mejiro31_firmware_repo.png)

Click the `Fork` button in the top right to fork it to your account.

![](./imgs/github_forking.png)

After clicking `Fork`, you will see the creation screen. Click `Create fork` to finish.

![](./imgs/github_just_forking.png)

Your account now has a fork of the Mejiro31 QMK firmware repository.

Open your fork and click the green `Code` button to copy the URL.

![](./imgs/github_cloning_repo.png)

You will use this URL in [Set up the firmware build environment](#set-up-the-firmware-build-environment).

### Set up the firmware build environment

The steps differ by OS; these guides are helpful:

- [QMK setup for Windows (official docs)](https://docs.qmk.fm/#/newbs_getting_started?id=windows-setup)
- [QMK setup for macOS (official docs)](https://docs.qmk.fm/#/newbs_getting_started?id=macos-setup)

When you see a command like `git clone <repository_url>`, use the URL of your forked repository copied earlier.

### Examples of advanced customization

Editing the firmware source allows fine-grained customization.

#### Language settings per layer

Mejiro31 can automatically switch the IME according to the set language whenever a layer changes.

This feature lets the center layer key act both as a keyboard/steno mode toggle and an IME switcher.

By default, steno mode uses Mejiro-style for Japanese input and keyboard mode uses English input.

For advanced customization, for example, if you want to use romaji for Japanese and stenography for English, you can configure the QWERTY layer to turn IME ON and the GEMINI layer to turn IME OFF.

To configure Mejiro31's language settings, open `keyboards/jeebis/mejiro31/keymaps/en_qwerty/keymap.c` in your forked repository.

Around line 72 you will find:

```
<keymaps/en_qwerty/keymap.c>
// 0:unused, 1:English, 2:Japanese, 3:no change
static int stn_lang = 2; // Language for steno mode
static int kbd_lang = 1; // Language for keyboard mode
```

Here, `stn_lang` represents the language setting for the GEMINI layer (steno mode), and `kbd_lang` represents the language setting for the QWERTY layer (keyboard mode).

Set each variable to one of these values:

| Value | Language |
| ----- | -------- |
| 1     | English  |
| 2     | Japanese |
| Other | No change |

To type Japanese in keyboard mode and English in steno mode, configure as follows:

```
<keymaps/en_qwerty/keymap.c>
static int stn_lang = 1; // Language for steno mode
static int kbd_lang = 2; // Language for keyboard mode
```

#### Language settings for alternate layouts

Here we use the Onishi layout as an example.

Open `keyboards/jeebis/mejiro31/keymaps/en_o24/keymap.c`.

Around line 74 you will find:

```
<keymaps/en_o24/keymap.c>
static int alt_lang = 3; // Alternative Layout language setting
```

The `alt_lang` variable is set to 3 (both languages) by default.

Change it to one of these values to configure the alternate layout language:

| Value | Language |
| ----- | -------- |
| 1     | English only |
| 2     | Japanese only |
| 3     | Both languages |

For example, to use Dvorak only for English input, set it to 1:

```
<keymaps/en_dvorak/keymap.c>
static int alt_lang = 1; // Alternative Layout language setting
```

To use the Onishi layout only for Japanese input, set it to 2:

```
<keymaps/en_o24/keymap.c>
static int alt_lang = 2; // Alternative Layout language setting
```

Once you configure the language, the Eisu/Kana key on the NUMBER layer (lower right thumb) will toggle both IME and the alternate layout simultaneously.

#### Define alternate layouts

Next, we will show how to define a custom alternate layout keymap not yet supported by Mejiro31.

Around line 254 you will find:

```
<keymaps/en_o24/keymap.c>
// Layout: Onishi (O24)
// ┌─────┬─────┬─────┬─────┬─────┐┌─────┬─────┬─────┬─────┬─────┬─────┐
// │  q  │  l  │  u  │  ,  │  .  ││  f  │  w  │  r  │  y  │  p  │  /  │
// ├──e──┼──i──┼──a──┼──o──┼──-──┤├──k──┼──t──┼──n──┼──s──┼──h──┼──'──┤
// │  z  │  x  │  c  │  v  │  ;  ││  g  │  d  │  m  │  j  │  b  │  \  │
// └─────┴─────┴─────┴─────┴─────┘└─────┴─────┴─────┴─────┴─────┴─────┘
static const alt_mapping_t alt_mappings[] PROGMEM = {
    {KC_Q,    KC_Q,    KC_Q},
    {KC_W,    KC_L,    KC_L},
    {KC_E,    KC_U,    KC_U},
    {KC_R,    KC_COMM, KC_LABK},
    {KC_T,    KC_DOT,  KC_RABK},
    {KC_Y,    KC_F,    KC_F},
    {KC_U,    KC_W,    KC_W},
    {KC_I,    KC_R,    KC_R},
    {KC_O,    KC_Y,    KC_Y},
    {KC_P,    KC_P,    KC_P},
    {KC_MINS, KC_SLSH, KC_QUES},

    {KC_A,    KC_E,    KC_E},
    {KC_S,    KC_I,    KC_I},
    {KC_D,    KC_A,    KC_A},
    {KC_F,    KC_O,    KC_O},
    {KC_G,    KC_MINS, KC_UNDS},
    {KC_H,    KC_K,    KC_K},
    {KC_J,    KC_T,    KC_T},
    {KC_K,    KC_N,    KC_N},
    {KC_L,    KC_S,    KC_S},
    {KC_SCLN, KC_H,    KC_H},
    {KC_QUOT, KC_QUOT, KC_DQUO},

    {KC_Z,    KC_Z,    KC_Z},
    {KC_X,    KC_X,    KC_X},
    {KC_C,    KC_C,    KC_C},
    {KC_V,    KC_V,    KC_V},
    {KC_B,    KC_SCLN, KC_COLN},
    {KC_N,    KC_G,    KC_G},
    {KC_M,    KC_D,    KC_D},
    {KC_COMM, KC_M,    KC_M},
    {KC_DOT,  KC_J,    KC_J},
    {KC_SLSH, KC_B,    KC_B},
    {KC_BSLS, KC_BSLS, KC_PIPE},
};
```

The `alt_transform` function defined here maps the alternate layout.

The Onishi layout is shown above; edit this table to define any layout you like.

#### Detailed combo settings

Mejiro31 uses a custom combo implementation instead of the standard QMK combo feature.

To define combos, you need to edit source code.

To change existing combos or add new ones, edit the code around line 373:

```
<keymaps/jp_qwerty/keymap.c>
// Combo definitions (order-independent)
const combo_pair_t combo_pairs[] PROGMEM = {

    {KC_Q,    KC_Z,    KC_A,    _QWERTY},
    {KC_W,    KC_X,    KC_S,    _QWERTY},
    {KC_E,    KC_C,    KC_D,    _QWERTY},
    {KC_R,    KC_V,    KC_F,    _QWERTY},
    {KC_T,    KC_B,    KC_G,    _QWERTY},
    {KC_Y,    KC_N,    KC_H,    _QWERTY},
    {KC_U,    KC_M,    KC_J,    _QWERTY},
    {KC_I,    KC_COMM, KC_K,    _QWERTY},
    {KC_O,    KC_DOT,  KC_L,    _QWERTY},
    {KC_P,    KC_SLSH, KC_SCLN, _QWERTY},
    {KC_MINS, KC_BSLS, KC_QUOT, _QWERTY},
    {KC_LBRC, KC_RBRC, KC_EQL,  _QWERTY},
    {KC_V,    KC_B,    KC_TAB,  _QWERTY},
    {KC_R,    KC_T,    KC_ESC,  _QWERTY},
    {KC_N,    KC_M,    KC_BSPC, _QWERTY},
    {KC_Y,    KC_U,    KC_DEL,  _QWERTY},

    {KC_1,    KC_7,    KC_4,     _NUMBER},
    {KC_2,    KC_8,    KC_5,     _NUMBER},
    {KC_3,    KC_9,    KC_6,     _NUMBER},
    {KC_0,    KC_DZ,   KC_TZ,    _NUMBER},
    {KC_DOT,  KC_MINS, KC_COMMA, _NUMBER},
    {KC_9,    KC_DOT,  KC_TAB,   _NUMBER},
    {KC_3,    KC_MINS, KC_ESC,   _NUMBER},
    {KC_PGDN, KC_LEFT, KC_BSPC,  _NUMBER},
    {KC_PGUP, KC_HOME, KC_DEL,   _NUMBER},
};
```

For example, to add a combo on the QWERTY layer that outputs Enter when pressing V and M together, add:

```
<keymaps/via/keymap.c>
    {KC_V,    KC_M,    KC_ENT,  _QWERTY},
```

Note: combos of three or more simultaneous keys are not supported.

Also, you cannot use the output keycode as part of the combo. For example, a combo on the QWERTY layer that outputs F when pressing F and J together cannot be defined.

#### config.h settings

Mejiro31 runs QMK firmware, so standard `config.h` settings are available for many options.

To change the hold time for keys, open `keyboards/jeebis/mejiro31/config.h` and edit:

```
<config.h>
#define TAPPING_TERM 200
```

This value is in milliseconds and defines how long a key must be held to count as a hold.

For example, setting `TAPPING_TERM` to 300 makes Mod-Tap keys register as holds after 300 ms.

See the QMK docs for other `config.h` options:
- [QMK Config Options](https://docs.qmk.fm/config_options)

## Contact Us

Email `jeebis.iox@gmail.com`, or for issues, open an [Issue on the Mejiro31 GitHub repo](https://github.com/JEEBIS27/Mejiro31/issues).

[Back to Start Page](../README.md)
