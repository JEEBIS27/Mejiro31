# Mejiro31 開発ガイド

[トップ](../README.md) · [English](DEVELOPMENT_EN.md)

- [ファームウェアのビルドとカスタマイズ](FIRMWARE.md)
- [QMKファームウェア](https://github.com/JEEBIS27/qmk_firmware/tree/master/keyboards/jeebis/mejiro31)
- [共通メジロ式エンジン](https://github.com/JEEBIS27/Mejiro_Engine)

QMKの `jp_default` は内蔵メジロ式、日本語QWERTY・英語Graphiteを初期設定に使います。`en_default` は外部Plover HIDとQWERTYを初期設定に使います。どちらもPC側のJIS／USと代替配列の有効状態を切り替えられます。

このリポジトリの `site/` が、GitHub Pagesで公開できるビルド不要のサイトです。ファームウェアは、固定したVial-QMK・Mejiro31・Rustエンジンのソースから自動で組み立てます。既存のQMK作業ツリーには変更を加えません。

## 開発と確認

サイトだけならNode.jsとPythonがあれば動作します。npm依存パッケージはありません。

```sh
npm test
npm run dev
```

`npm run dev` はサーバーを起動し、既定のブラウザーで `http://127.0.0.1:4173/` を開きます。自動で開かない環境では、このURLを手動で開いてください。ブラウザーを開かずに起動する場合は `npm run dev -- --no-open` を使用します。GitHub Pagesのリポジトリサブパスでも動作するよう、サイト内のパスは相対指定です。

ファームウェアの準備にはGit・Python・Cコンパイラー、ビルドにはQMK CLIとそのPython依存、Arm GNU Toolchain、Rust 1.88以降、`thumbv6m-none-eabi`ターゲットが必要です。

```sh
python3 scripts/prepare-firmware.py
python3 -m pip install -r .build/vial/requirements.txt
python3 scripts/generate-data.py
python3 scripts/test-firmware.py
rustup target add thumbv6m-none-eabi
python3 scripts/build-firmware.py --profile all --layout qwerty
```

`prepare-firmware.py`は`.build/`の隔離チェックアウトを準備します。別の場所に作る場合は`--work-dir /tmp/mejiro31-build`を渡し、その後のコマンドに`--source-dir /tmp/mejiro31-build/vial`を指定します。

`firmware/sources.json`に以下の固定コミットがあります。

- Vial-QMK本体。
- Mejiro31の入力エンジン・初期配列・現行Plover HID通信を提供するQMKフォーク。
- 共通Rustエンジン。

準備スクリプトは、固定したQMKリポジトリ内の共通Vialビルドヘルパーを呼び出します。VialコアへのPlover HID移植とロック解除処理の修正は、この共通ヘルパーが管理します。

入力処理は動的キーマップを直接参照し、独自キーコードは `QK_KB_0` から割り当てます。動的Tap Dance・Combo・QMK Settingsは無効化し、Mejiro31側の入力処理を維持します。Vialのロック解除中は独自エンジンの入力も抑制し、解除のキャンセル時にはVialのポーリング状態を終了します。

`generate-data.py`は固定ソースのC定義をコンパイルして、初期キーマップとキーコードの数値を抽出します。配列変換表・物理位置・同時押し位置も同じソースから取り込み、サイトのJSON、Vial定義、ファームウェアの配列一覧を生成します。`firmware/layout_ids.json`はEEPROMに保存する配列IDの順序です。**既存IDを並び替えず、新規IDは末尾へ追加**してください。

独自Raw HID拡張は32バイト固定です。`FA 01 op status`、続く8バイトが `M31WEB01`。`op=0`で取得、`op=1`で設定。バイト12にJIS／代替配列／メジロ式の3ビット、13・14に英数／日本語配列ID、15に基本プロファイル、16にレイヤー数、17に配列数を返します。対応ファームウェアはバイト26に `1`、27に「っ」の即時入力設定を返します。`op=4` でバイト27の `0` / `1` を保存します。設定変更はVialロック解除後に限り受け付け、入力コンテキストをリセットしてから保存します。

### 検証の区別

- JavaScriptテストは模擬HIDデバイスを使い、機種識別、直列通信、ロック、差分書き込み、読み戻し、不正ファイルの拒否を確認します。
- Cテストは実際の移植済みアダプターと独自設定ハンドラーをコンパイルし、既存の入力回帰テスト、配列変更、EEPROM保存、コンテキスト変更時の解放を確認します。
- Arm向けの実ビルド後、UF2ブロック、RP2040のfamily ID、フラッシュ範囲、専用プロトコルの存在とSHA-256を確認します。
- これらは実機のUSB列挙、WebHID権限、再起動後の保存、メジロ式、Plover、各OSのIME動作の確認にはなりません。公開前に実機で確認してください。

## 自動配布

### サイト

GitHubのリポジトリ設定で、PagesのSourceを**GitHub Actions**にします。`main`へのサイト更新で`pages.yml`がテストを実行し、`site/`を公開します。想定URLは `https://jeebis27.github.io/Mejiro31/` です。

### ファームウェア

通常のPRと`main`更新では、日本語・英語のQWERTY版をビルドしてActionsのArtifactsへ保存します。手動実行でも配布対象はQWERTYのJP/ENだけです。

`vial-v0.1.0`など、`vial-v`で始まるタグをpushすると、**QWERTYのJP/ENの2種類**をビルドし、両方が成功した場合だけGitHub Releaseを作成します。UF2、SHA-256、固定ソース一覧を添付します。サイトは最新の正式なVialリリースから、選択したプロファイルのQWERTY版の実在ファイルだけを案内します。

ファームウェアのビルドは今後も必要ですが、手元での各配列のビルドや手動アップロードは不要になります。配列の選択変更・既存キーのリマップだけなら、書き直しも再ビルドも不要です。

VialのビルドIDや保存領域の構成が変わると、キー割当とMejiro31の独自設定を初期化する場合があります。配列違いのUF2を入れたときに古い配列が残らないための動作です。ファームウェア更新前にJSONを書き出し、更新後に読み込んで保存してください。

GitHub APIへのアクセス制限・通信失敗時には、ダウンロードボタンを無効にしてリリース一覧へのリンクを表示します。GitHub APIへ設定内容を送ることはありません。キーマップはブラウザーと接続したキーボードの間で通信します。

ローカルQMKの成果物は `just sync` で取り込みます。QMK側では `just build-site` でJP/ENのビルドから取り込みまで実行できます。UF2・チェックサム・ビルド情報を両方検証し、異なるソースのJP/ENは拒否します。

CIの固定ソースから作ったビルド成果物を更新する場合は `python3 scripts/package-firmware.py .build/artifacts` を実行します。スクリプトは固定ソースの一致、UF2構造、RP2040識別子、専用プロトコル、SHA-256を検証してから配置します。複数の成果物ディレクトリも指定できます。

## ライセンス

ファームウェアの統合部分はGPL-3.0-or-laterです。`firmware/LICENSE`と各固定ソース内の著作権・ライセンス表記を参照してください。この追加によって既存のハードウェア画像や組み立て資料のライセンスを変更するものではありません。

## 全Mejiro31キーマップのVial移行

通常の `jp_default`／`en_default` と既存プリセットも、QMKリポジトリ側の通常ビルドコマンドからVial対応UF2を生成します。ビルド入口が内部で固定したVialコアを準備します。日本語版の英数Graphite／かなQWERTYなど、各宣言型キーマップの初期配列を維持します。既存のTap/Holdエンジンが処理し、QMKのMTへ変換しません。

サイト側の `prepare-firmware.py` は、固定したQMKソース内の `build_vial.py` に準備を委譲します。サイト側で独自にアダプターを書き換える処理は廃止しました。テストもQMK側の共通テストを呼び出します。`firmware/vial/` は旧移植時の参照ファイルで、現在のビルドには適用されません。配布用は共通キーマップの初期値をQWERTYに指定してビルドします。

変更はQMK側PR #3に含まれ、マージ前はその固定コミットを参照します。実機の書き込み・WebHID接続・保存の動作確認とは区別してください。

追加6組は「｀＋Win」「｀＋Q」「Win＋Z」「Alt＋Ctrl」「/＋\」「P＋-」です。空のコンボは通常入力を妨げず、Stenoではコンボを表示・使用しません。利用には16保存レイヤー対応UF2への更新が必要です。更新前に設定を書き出してください。旧形式の12×48設定ファイルは読み込み時に12×58へ拡張し、追加分は未割り当てにします。

入力テスト画面ではブラウザーに届いたキーの押下・離上、修飾キー、履歴とIMEの確定文字を確認できます。OSに捕捉されるキーや物理マトリクスの検査ではありません。右上でサイトのライト／ダーク表示を切り替えられ、選択はブラウザーに保存されます。

### 辞書検索

内蔵辞書の索引 `site/dictionary.json` は、`firmware/dictionary-source.json` に固定した検索用エンジンから `python scripts/generate-dictionary.py` で生成します。別のチェックアウトを使う場合は `--source-dir /path/to/Mejiro_Engine` を指定してください。

### キーボード設定とメジロ式設定

専用設定応答のバイト19が1なら判定時間対応です。20〜25はコンボ・連続入力猶予・長押しの各16ビット値（リトルエンディアン）です。`FA 01 03`で同じ位置の値を保存します。ロック中・不正な範囲の値は拒否し、既存のキーマップ・辞書用領域は使用しません。

### 親指コンボとキーの直接入力

2uのSpaceと下のAlt/Ctrl、2uのEnterと下の左右のIMEキーの間に、4組の未割り当てコンボを配置します。従来の割り当てと保存アドレスはそのまま維持します。バックアップはversion 4（12×58）で、旧12×48/54は空の追加枠を補って読み込みます。

追加辞書は最新UF2で96件まで登録できます。保存領域が変わるため、24/28件版からの更新では本体設定と追加辞書を初期化してください。必要な設定は更新前に書き出し、更新後に読み込めます。

### Vialの保存領域

保存領域は16レイヤーです。標準Vialアプリでもキーを変更できます。レイヤー0～5がTap、6～11が対応するHoldです。定義中の追加16キーは同時押しの出力位置です。追加6組は保存レイヤー12・13、親指4組は14・15に格納し、このサイトで編集します。専用の代替配列・JIS／US設定も、このサイトで操作します。

## 逆引きエンジン

設定スタジオの逆引きは共通RustエンジンのWebAssemblyを使用します。「シンプル（構文解析なし）」が標準です。「文法を考慮（構文解析あり）」を選ぶと、文法解析器と辞書を別スレッドで読み込みます。12秒以内に完了しなければシンプルな逆引きに切り替えます。エンジン更新後は `just build-reverse` で `site/engine/mejiro_native.wasm` を更新します。
