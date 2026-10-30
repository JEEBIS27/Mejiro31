# ファームウェアのビルド・書き込み・カスタム

[スタートページ](../README.md) / [使い方](USAGE.md) / [English](#english)

## ファームウェアの構成

[QMKファームウェア](https://github.com/JEEBIS27/qmk_firmware/tree/master/keyboards/jeebis/mejiro31)の `jp_default` / `en_default` を使用します。通常入力は統一入力エンジン、内蔵メジロ式は共通Rustエンジン、外部PloverはPlover HIDで処理します。

JP/ENのビルド・回帰テスト・USB定義検査・ARM実行検査を通しています。これらは実機USB通信や使用するIMEでの動作確認を代替しません。

## ビルド

[QMKのビルド環境](https://docs.qmk.fm/newbs_getting_started)に加え、Rust/Cargoを用意してください。`qmk_firmware` と共通エンジンを同じ親ディレクトリへ配置します。

```sh
git clone --recurse-submodules https://github.com/JEEBIS27/qmk_firmware.git
git clone https://github.com/JEEBIS27/Mejiro_Engine.git
rustup target add thumbv6m-none-eabi
cd qmk_firmware
qmk compile -kb jeebis/mejiro31 -km jp_default
qmk compile -kb jeebis/mejiro31 -km en_default
```

生成物はQMKルートの次の2ファイルです。

- `mejiro31_jp.uf2`
- `mejiro31_en.uf2`

JP/ENは初期配列・親指の記号・速記の初期選択が異なります。どちらも同じ入力エンジンを使い、ホストのJIS/US設定は独立しています。既に保存した設定はビルドの初期値より優先されます。

配列別プリセットは各スクリプトの `--list` で確認できます。ビルド方法は `--help` と[ソース側の説明](https://github.com/JEEBIS27/qmk_firmware/blob/master/keyboards/jeebis/mejiro31/engine.md)を参照してください。

```sh
python3 keyboards/jeebis/mejiro31/keymaps/jp_default/build_firmware_presets.py --list
python3 keyboards/jeebis/mejiro31/keymaps/en_default/build_firmware_presets.py --list
```

## 書き込みと保存データの初期化

1. 保存済みのキーマップがある場合は、設定の控えを取ります。
2. PCBのBOOTボタン（USB端子から離れた側）を押しながらUSBへ接続します。
3. 表示された `RPI-RP2` ドライブへ、選んだUF2をコピーします。
4. 保存したキーマップではなくビルドの初期割り当てを使う場合は、下記の方法で動的キーマップを初期化してください。UF2の上書きだけでは保存キーマップは消えません。
5. ホストのJIS/US、日英プロファイル、速記方式を確認して入力を試します。外部速記を使う場合はPloverのMachineを `Plover HID` に変更します。

保存データの初期化専用キーは、現行の通常配列には置いていません。対応する設定ツールがない場合は、初期化用ビルドとして `qmk/keymap_impl.h` の `keyboard_post_init_user()` の先頭へ一時的に `eeconfig_init();` を追加します。QMKの初期化関数がVIAの動的キーマップ・マクロとユーザー設定を初期値へ戻します。

```c
void keyboard_post_init_user(void) {
    eeconfig_init(); // 初期化用に一度だけ追加
    mejiro_engine_init();
    // 以下は既存の処理
```

このビルドを一度起動したら、追加した行を削除し、通常版を再ビルドして書き戻してください。行を残すと接続するたびに保存内容を消してしまいます。初期化は保存キーマップと設定を消すので、バックアップ後に行ってください。

## カスタマイズ

### TapとHold

`keyboards/jeebis/mejiro31/qmk/defaults.h` に初期割り当てがあります。同じ座標のTapとHoldを一組として変更します。

| Tapマップ | Holdマップ | 用途 |
| --- | --- | --- |
| 0 | 6 | 通常 |
| 1 | 7 | Shift |
| 2 | 8 | NUMBER |
| 3 | 9 | NUMBER＋Shift |
| 4 | 10 | FUNCTION |
| 5 | 11 | 速記モード内の非速記機能 |

例として、通常マップ0の `(2,4)` に `KC_SPC`、Holdマップ6の同じ座標に `KC_LSFT` を置くとSpace/Shiftになります。Holdの `KC_NO` は未定義です。保持レイヤーは `MO(n)` をHold側へ置きます。Sticky Shiftは `MJI_STICKY` またはShiftの `OSM` をTapへ置きます。

QMKの標準Tap-Holdは無効にしており、`MT` / `LT` を直接置く設定方式は使いません。任意のQMK拡張機能がそのまま使えるわけではありません。対応する通常キー・修飾・レイヤー・カスタムキーを使ってください。

二段圧縮の結果は未配線の仮想位置にあります。例えば基本QWERTYのDは `(2,2)` です。これを編集すればE/Cの物理ペアを変えずにコンボの出力を変更できます。物理ペア自体を変える場合は `qmk/keymap_impl.h` の `physical_pairs` を変更します。3キー以上のコンボは対象外です。[全仮想位置と仕様](https://github.com/JEEBIS27/qmk_firmware/blob/master/keyboards/jeebis/mejiro31/engine.md#tapholdの保存形式)を参照してください。

### 代替配列

`keymaps/jp_default/keymap.c` または `keymaps/en_default/keymap.c` の設定を変更します。例えば英語をGraphite、日本語を大西配列にする場合は次のとおりです。

```c
#define MJI_ENGLISH_LAYOUT mji_layout_graphite
#define MJI_JAPANESE_LAYOUT mji_layout_o24
```

配列の定義は `layouts/catalog.h` にあります。新しい配列は `mji_layout_entry_t` で基本HIDキー、通常出力、Shift出力を定義します。

### 判定時間

`keyboards/jeebis/mejiro31/config.h` で変更します。単位はミリ秒です。

```c
#define MJI_COMBO_MS 150
#define MJI_CONTINUATION_MS 50
#define MJI_LONG_HOLD_MS 300
```

順に、コンボの判定時間、コンボの片方を離した後の継続待ち、単独Tapを抑制する明確な長押し時間です。残留キーの長押し時間は「片方だけになった時点」から数えます。これらの判定には `TAPPING_TERM` を使用しません。

### 内蔵メジロ式と録音

メジロ式の変換定義は別リポジトリの共通エンジンで管理します。変換ルールの変更は共通エンジン側で行います。

内蔵録音の1枠あたりの上限は512 UTF-8バイト、8意味操作、128外部HIDイベントです。128キーではなく、押下・解放・修飾変化を数えます。通常入力のイベントは送信済みの出力を記録し、速記復帰時等に録音データだけをまとめて取り込みます。取り込み時にキーを再送しません。

## English

Use `jp_default` or `en_default` from the [QMK firmware source](https://github.com/JEEBIS27/qmk_firmware/tree/master/keyboards/jeebis/mejiro31). Normal typing uses the unified input engine, built-in Mejiro uses the shared Rust engine, and external steno uses Plover HID.

Use a working [QMK build environment](https://docs.qmk.fm/newbs_getting_started), Rust/Cargo, and the `thumbv6m-none-eabi` target. Clone `qmk_firmware` with its submodules and `Mejiro_Engine` as sibling directories, then run the build commands above. The QMK root will contain `mejiro31_jp.uf2` and `mejiro31_en.uf2`.

Back up saved keymaps before initialization. Hold the PCB BOOT button while connecting USB and copy the UF2 to `RPI-RP2`. Reflashing alone does not erase saved keymaps. Initialize the dynamic keymap using a suitable tool or a temporary initialization build calling `eeconfig_init();` at the start of `keyboard_post_init_user()` as shown above. After running it once, remove that line and reflash a normal build; leaving it in would erase settings on every boot. Initialization removes saved keymaps, macros and settings. Verify host JIS/US, language and steno selection afterward. Select **Plover HID** in Plover for external steno.

For source remapping, edit `qmk/defaults.h`: Tap maps 0–5 pair with Hold maps 6–11 at the same coordinates. An undefined Hold is `KC_NO`; modifier keys and `MO(n)` belong on the Hold side. The firmware does not use standard QMK `MT`/`LT` definitions. Combo outputs occupy virtual positions; physical pairs are in `qmk/keymap_impl.h`. A matching twelve-map editor definition is needed for VIA, and a dedicated Vial UI is not implemented.

Choose language layouts with `MJI_ENGLISH_LAYOUT` and `MJI_JAPANESE_LAYOUT` in the preset's `keymap.c`; definitions now live in `layouts/catalog.h`. Set the three timing constants shown above in `config.h`: combo window, remaining-key continuation delay, and long-hold Tap suppression. The latter is not a delay before every Hold activation. `TAPPING_TERM` does not control these decisions.

Built-in recordings allow 512 UTF-8 bytes, eight semantic operations and 128 external HID events per slot. Keyboard input is sent live and imported into the recording without a second transmission. Recordings do not preserve timing or OS repeat.

The source has passed both builds, regression tests, linked USB descriptor checks and ARM execution checks. Those checks do not verify physical USB communication or your IME.
