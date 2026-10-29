# Mejiro31

![](docs/imgs/keyboard_white.jpg)

31キーで通常入力と速記を使えるキーボードです。二段圧縮・Tap/Hold・レイヤー・修飾キーを統一入力エンジンで処理します。内蔵メジロ式は共通のRustエンジン、外部Ploverとの接続はPlover HIDを使用します。

A 31-key keyboard for ordinary typing and stenography. A unified input engine handles two-row compression, Tap/Hold, layers and modifiers. Built-in Mejiro uses the shared Rust engine; external steno uses Plover HID.

## 設定スタジオ / Configurator

Vial対応のファームウェアダウンローダーとリマッパーを `site/` に追加しています。物理キー・二段圧縮の出力・Tap/Hold・代替配列に加え、メジロ式の辞書とFirst up chords sendを編集できます。

- [設定スタジオの使い方・開発・自動配布](docs/CONFIGURATOR.md)
- ローカルで試す: `npm run dev` → `http://127.0.0.1:4173`
- サイト内からVial対応UF2をダウンロードできます。

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

## サイト配布ファームウェアの更新

配布UF2はQWERTYのJP/ENのみです。代替配列はUF2書き込み後、サイト内の設定から選択して保存します。

- QMK側で `just build-site`: JP/ENをビルドしてサイトへ取り込みます。
- QMK側で `just sync-site`: ビルド済みのJP/ENを取り込みます。
- このリポジトリで `just sync`: 隣の `qmk_firmware/.build` から取り込みます。
- `just sync /path/to/artifacts`: 取り込み元を指定します。

取り込み先は `site/firmware/` です。JP/EN両方のUF2、チェックサム、ビルドメタデータを検証し、配布一覧とソース情報を更新します。ビルド条件が異なるJP/ENは取り込みません。`firmware/sources.json` のCI用固定バージョンは変更しません。
