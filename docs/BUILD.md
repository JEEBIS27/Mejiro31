# Mejiro31 の組み立て方 ([スタートページに戻る](../README.md))

![](./imgs/keyboard_black.jpg)

## 目次
  1. [キット以外に必要なもの](#1.キット以外に必要なもの)
  2. [内容品の確認](#2.内容品の確認)
  3. [組み立て](#3-組み立て)
  4. [トラブルシュート](#4-トラブルシュート)
  5. [お問い合わせ](#5-お問い合わせ)

## 1. キット以外に必要なもの

| 必要なもの | 個数 |
| --------- | ---- |
| キーキャップ | 31 |
| キースイッチ | 31 |
| USB-C ケーブル | 1 |
| 精密ドライバー | 1 |

### キースイッチの互換性

Mejiro31 では、low-profile のキースイッチのみが使用できます。

デフォルトでは Cherry MX 互換の [Gateron low-profile 3.0](https://www.amazon.co.jp/dp/B0FJXBL4BF) シリーズのみが、はんだ付け要らずで利用できるキースイッチです。

Kailh Choc V2 シリーズを利用したい方は、[Kailh Choc 専用のソケット](https://shop.yushakobo.jp/products/a01ps?variant=37665172553889)をはんだ付けで実装していただく必要があります。

### おすすめのキースイッチ

以下に、おすすめのキースイッチを紹介します。ぜひ参考にしてください。

| スイッチ名 | 特徴 | 押下圧 | はんだ付け |
| --------- | ---- | ----- | --------- |
| [Gateron low-profile 3.0](https://www.amazon.co.jp/dp/B0FJXBL4BF) | 標準的 | 50~43g | 不要 |
| [Nuphy Gateron low-profile 3.0](https://sanyollc.com/products/nuphy-gateron-low-profile-3-0-switches) | POM素材 | 45~37g | 不要 |
| [Lofree Hades POM](https://lofree.co.jp/products/hades-low-profile-pom-switches) | 静音 | 40g | 必要 |
| [Kailh Saker mini](https://shop.talpkeyboard.com/products/kailh-saker-chocv2-linear) | 短ストローク | 37g | 必要 |
| [Kailh Choc v2 Panda V1](https://ja.aliexpress.com/item/1005008329710988.html) | 軽量 | 30g | 必要 |
| [Kailh Choc V1 Pink](https://shop.yushakobo.jp/products/pg1350?variant=44079245754599) | 最軽量 | 20g | 必要 |

## 2. 内容品の確認

![](./imgs/build_all.jpeg)

| 内容品 | 個数 |
| ------ | --- |
| 基板 | 1 |
| トップレート | 1 |
| ボトムプレート | 1 |
| フォームプレート | 1 |
| スタビライザー | 2 |
| ネジ | 6 |
| ゴム足 | 6 |

## 3. 組み立て

まずはファームウェアのファイルをダウンロードします。

普通のQWERTY配列を使いたい場合は [こちら](https://github.com/JEEBIS27/Mejiro31/releases/download/v0.1.0/mejiro31_jp_qwerty.uf2) をダウンロードしてください。

その他の代替配列を使いたい場合は以下のリンクからダウンロードしてください。

- [Dvorak 配列](https://github.com/JEEBIS27/Mejiro31/releases/download/v0.1.0/mejiro31_jp_dvorak.uf2)
- [Colemak 配列](https://github.com/JEEBIS27/Mejiro31/releases/download/v0.1.0/mejiro31_jp_colemak.uf2)
- [Colemak-DH 配列](https://github.com/JEEBIS27/Mejiro31/releases/download/v0.1.0/mejiro31_jp_colemak-dh.uf2)
- [Workman 配列](https://github.com/JEEBIS27/Mejiro31/releases/download/v0.1.0/mejiro31_jp_workman.uf2)
- [Eucalyn 配列](https://github.com/JEEBIS27/Mejiro31/releases/download/v0.1.0/mejiro31_jp_eucalyn.uf2)
- [Tomisuke 配列](https://github.com/JEEBIS27/Mejiro31/releases/download/v0.1.0/mejiro31_jp_tomisuke.uf2)
- [Astarte 配列](https://github.com/JEEBIS27/Mejiro31/releases/download/v0.1.0/mejiro31_jp_astarte.uf2)
- [大西配列](https://github.com/JEEBIS27/Mejiro31/releases/download/v0.1.0/mejiro31_jp_o24.uf2)
- [Merlin 配列](https://github.com/JEEBIS27/Mejiro31/releases/download/v0.1.0/mejiro31_jp_merlin.uf2)
- [Graphite 配列](https://github.com/JEEBIS27/Mejiro31/releases/download/v0.1.0/mejiro31_jp_graphite.uf2)

ダウンロードしたら、基板のBOOTボタンを押しながら、PCと接続します。

![](./imgs/build_firmware.jpeg)

ドライブとして認識されるのでダウンロードしたファイルをドラッグ&ドロップします。

ドライブが自動的に消えれば準備完了です。(PCの設定によっては警告が出る場合もありますが大丈夫です。)

ファームウェアの書き込みが完了したら、組み立てを始めます。

まずは、基板についている余分な部分をペンチ等で切り取ります。

![](./imgs/build_trimming_bottom_side.jpeg)

![](./imgs/build_trimming_bottom_middle.jpeg)

![](./imgs/build_trimming_top_edge.jpeg)

![](./imgs/build_trimming_top_middle.jpeg)

取り切るとこのようになります。

![](./imgs/build_front_pcb.jpeg)

次に、トッププレートに基板をはめ込みます。

![](./imgs/build_direction_pcb.jpeg)

![](./imgs/build_fits_pcb.jpeg)

トッププレートの柱が基盤の穴にピッタリハマるようにはめ込んでください。

![](./imgs/build_zoom_pcb.jpeg)

次に、フォームプレートをくぼみに基板の部品がはまるようにしてはめ込んでください。

![](./imgs/build_turning_foam.jpeg)

フォームが壁より高い位置に来ないくらいまでしっかりと押し込みます。

![](./imgs/build_put_foam.jpeg)

次に、ボトムプレートをネジ穴のくぼみが見える形で上に乗せます。

![](./imgs/build_put_bottom.jpeg)

6か所にネジを締めます。

(フォームを押し込むようにしてネジを回し、少し回りづらくなったくらいで止めます。強く締めすぎるとネジ穴が削れ、ネジが閉まらなくなる恐れがあります。)

![](./imgs/build_screwfastening.jpeg)

![](./imgs/build_screw_fastened.jpeg)

6か所にゴム足を張ります。

![](./imgs/build_anti_slip.jpeg)

![](./imgs/build_fits_anti_slip.jpeg)

これで、キーボードのベース部分は完成しました。

今度は、2か所にスタビライザーをはめ込みます。

![](./imgs/build_fitting_stab.jpeg)

![](./imgs/build_fits_stab.jpeg)

次に、キースイッチをはめます。

キースイッチの足とはめ込む穴に気を付けながら、スイッチをはめ込みます。

![](./imgs/build_fit_switches.jpeg)

キーキャップを取り付けます。

完成！

![](./imgs/keyboard_white.jpg)

## 4. トラブルシュート

- キーが反応しない。

スイッチの金属端子の足が曲がっていないかご確認ください。曲がっていた場合はピンセットやラジオペンチを使うと伸ばしやすいです。また、基板に傷がつくと動作しなくなる場合があります。傷をつけないようにお気をつけください。

- ネジ穴が緩くなった。

マスキングテープ等でネジ穴を狭めることで対応してください。場合によってはトッププレートを再購入していただくことになります。

- 部品が壊れた/無くなった。

場合によっては基板や部品は単品で販売が可能ですので[お問い合わせ](#5-お問い合わせ)をお願いいたします。

- そのほかの不具合

はんだ付けにミスがある可能性があります。お手数ですが[お問い合わせ](#5-お問い合わせ)をお願いいたします。

## お問い合わせ

お問い合わせは`jeebis.iox@gmail.com`へお願いします。

[スタートページに戻る](../README.md)
