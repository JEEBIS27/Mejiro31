# Mejiro31

![](docs/imgs/keyboard_white.jpg)

31キーで通常入力と速記を使えるキーボードです。二段圧縮・Tap/Hold・レイヤー・修飾キーを統一入力エンジンで処理します。内蔵メジロ式は共通のRustエンジン、外部Ploverとの接続はPlover HIDを使用します。

A 31-key keyboard for ordinary typing and stenography. A unified input engine handles two-row compression, Tap/Hold, layers and modifiers. Built-in Mejiro uses the shared Rust engine; external steno uses Plover HID.

## 組み立て方 / Assembly

- [Mejiro31の組み立て方](docs/BUILD.md)
- [How to Assemble Mejiro31](docs/BUILD_EN.md)

## 使い方 / Usage

- [Mejiro31の使い方](docs/USAGE.md)
- [Using Mejiro31](docs/USAGE_EN.md)

## ファームウェア / Firmware

| ビルド / Build | 初期設定 / Defaults |
| --- | --- |
| `jp_default` | 内蔵メジロ式、日本語QWERTY・英語Graphite / Built-in Mejiro, Japanese QWERTY and English Graphite |
| `en_default` | 外部Plover HID、QWERTY / External Plover HID, QWERTY |

どちらもホストのJIS/USと、代替配列の有効・無効を切り替えられます。書き込み・初期化・配列の変更方法は[ファームウェアガイド](docs/FIRMWARE.md)を参照してください。

Both builds support host JIS/US selection and alternate-layout toggling. See the [firmware guide](docs/FIRMWARE.md#english) for building, flashing, initialization and customization.

## ソースコード / Source

- [QMKファームウェア / QMK firmware](https://github.com/JEEBIS27/qmk_firmware/tree/master/keyboards/jeebis/mejiro31)
- [共通メジロ式エンジン / Shared Mejiro engine](https://github.com/JEEBIS27/Mejiro_Engine)
