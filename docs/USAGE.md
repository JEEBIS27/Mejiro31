# Mejiro31 の使い方

![](./imgs/5.Both_parallel.JPG)

## 目次
  1. [キーレイアウト](#キーレイアウト)
     - [QWERTY レイヤー](#qwerty-レイヤー)
     - [GEMINI レイヤー](#gemini-レイヤー)
     - [NUMBER レイヤー](#number-レイヤー)
     - [FUNCTION レイヤー](#function-レイヤー)
  2. [キーの入れ替え方法](#キーの入れ替え方法) 
  3. [高度なカスタム](#高度なカスタム)
  4. [お問い合わせ](#お問い合わせ)

## キーレイアウト

デフォルトではこのようなキー配置になっています。

### QWERTY レイヤー
![](./imgs/layer_QWERTY.png)
QWERTY レイヤーは標準のレイヤーです。

Mejiro31 を接続したときは毎回このレイヤーでスタートします。

[二段圧縮](https://note.com/jeebis_keyboard/n/ncbc327906050)を使用しており、キーの $1/3$ は同指の隣接キーの同時押しで入力します。

![](./imgs/二段圧縮.png)

もし QWERTY ではなく、Dvorakや大西配列のような代替レイアウトを使用したい場合は[高度なカスタム](#高度なカスタム)の章をご覧ください。

また、左右のスペースバーはそれぞれ Space と Enter ですが、長押しで Shift キーとして動作します。

真ん中のレイヤーキーを短く押すと GEMINI レイヤーに切り替わり、長押しで NUMBER レイヤーに切り替わります。

### GEMINI レイヤー
![](./imgs/layer_GEMINI.png)
GEMINI レイヤーはメジロ式を使うために必要なレイヤーです。

メジロ式を動かす Plover というソフト専用の出力が割り当たっています。

なので、基本的にこのキー配置を変更することはありません。

急にキーボードが入力できなくなったときは GEMINI レイヤーになってしまっていないかご確認ください。

真ん中のレイヤーキーを短く押すと QWERTY レイヤーに切り替わり、長押しで NUMBER レイヤーに切り替わります。

### NUMBER レイヤー
![](./imgs/layer_NUMBER.png)
NUMBER レイヤーには数字キーや矢印キー、 Windows キー、その他機能キーが割り当たっています。

0 の上のキーは 00 キーで、二つの 0 を出力します。

一番右の、上段のキーは代替レイアウトの有効・無効を切りかえるキーで、下段のキーは長押しで FUNCTION レイヤーに遷移するキーです。

ただし、デフォルトの設定では代替レイアウトキーは無効になっています。それは代替レイアウトが定義されていないからです。代替レイアウトを有効化したい場合は[高度なカスタム](#高度なカスタム)の章をご覧ください。

### FUNCTION レイヤー
![](./imgs/layer_FUNCTION.png)
FUNCTION レイヤーには F1 ~ F13 キーやメディアキーが割り当たっています。

一番右の、上段のキーは PC のキーボード設定が JIS でも US キーボードとして入力できるモードの切り替えキーです。

Mejiro31 は US キーボードとして出力するので、 PC が JIS レイアウトの時はこのモードをオンにしないと設定どおりの出力になりません。

ただし、PC 側のショートカットキーは JIS のままなのでお気を付けください。

## キーの入れ替え方法

まずはこちらのファイルをダウンロードします。
- [mejiro31_via_keymap.json](https://github.com/JEEBIS27/Mejiro31/releases/latest/download/mejiro31_via_keymap.json)

次に、お好きなブラウザーから`VIA`にアクセスして、 DESIGN を選びます。

(以下のリンクからアクセスすると自動で DESIGN の画面に遷移します。)

- [VIA/DESIGN](https://www.usevia.app/design)

![](./imgs/via_design.png)

DESIGN タブを開いたら`Load`ボタンを押します。

![](./imgs/via_load.png)

ここで先ほどダウンロードした JSON ファイルを選択し、正常に読み込まれると以下の画像のようにレイアウトが表示されます。

![](./imgs/via_loaded.png)

JSON ファイルの読み込みが完了後、 CONFIGURE タブに移動します。

![](./imgs/via_configure.png)

CONFIGURE タブの`Authorize device`ボタンを押し、ポップアップ画面で Mejiro31 を選択して接続します。

![](./imgs/via_select_keyboard.png)

するとキーマップ編集画面に遷移するので、キーボードのキーをクリックし変更したいキーを下から選んでクリックすることでキーを入れ替えることができます。

![](./imgs/via_QWERTY.png)

(VIA からだと上下キーの同時押しの再定義ができません。なので事実上変えることができるのは NUMBER レイヤーや FUNCTION レイヤーのキーだけです。もし Dvorak や大西配列のような代替レイアウトを使用したい場合は[高度なカスタム](#高度なカスタム)の章をご覧ください。)

## 高度なカスタム

### 目次
  1. [高度なカスタムを行う方法](#高度なカスタムを行う方法)
     1. [ファームウェアリポジトリをフォークする](#ファームウェアリポジトリをフォークする)
     2. [ファームウェアのビルド環境構築方法](#ファームウェアのビルド環境構築方法)
  2. [高度なカスタムの紹介](#高度なカスタムの紹介)

Mejiro31 は高度なカスタムとして、 QMK ファームウェアの設定を変更することでより細かい需要にこたえることができます。

### 高度なカスタムを行う方法

高度なカスタムを行うためには Mejiro31 のファームウェアリポジトリをあなたのアカウントでフォークし、ビルド環境を構築していただく必要があります。

そうやって書き換えたソースコードをビルドし、生成されたファームウェアを Mejiro31 に書き込むことで高度なカスタムが可能になります。

### ファームウェアリポジトリをフォークする

[github.com](https://github.com/) にアクセスします。

![](./imgs/github_home.png)

github アカウントを持っていない場合はここでサインアップして新しく作成してください。

アカウントを作成したら、以下のリンクから Mejiro31 の QMK ファームウェアリポジトリにアクセスします。
- [Mejiro31 Firmware Repository](https://github.com/JEEBIS27/qmk_firmware)

![](./imgs/mejiro31_firmware_repo.png)

右上の`Fork`ボタンを押して、あなたのアカウントにリポジトリをフォークします。

![](./imgs/github_forking.png)

`Fork`ボタンを押すと次のような画面になります。`Create fork`ボタンを押してフォークを完了させましょう。

![](./imgs/github_just_forking.png)

フォークが完了すると、あなたのアカウントの下に Mejiro31 の QMK ファームウェアリポジトリが作成されます。

フォークしたあなたのリポジトリにアクセスし、緑色の`Code`ボタンを押して URL をコピーします。

![](./imgs/github_cloning_repo.png)

次の[ファームウェアのビルド環境構築方法](#ファームウェアのビルド環境構築方法)の章でこの URL を使用します。

### ファームウェアのビルド環境構築方法

PC 環境によってやり方が異なるのでここでは詳しく紹介しませんが、以下の説明が参考になると思います。

- [QMKファームウェアビルド構築手順(Windows QMK MSYS編)](https://gist.github.com/e3w2q/4bc86e531d1c893d3d13af3e9895a94a)
- [MacでのQMKファームウェアビルド構築方法の参考記事](https://qiita.com/Nikk0r0/items/4089c194715185a124a5)

説明の中で`git clone <repository_url>`というようなコマンドが出てきたら、先ほどコピーしたあなたのフォークしたリポジトリの URL を使用するようにしてください。

### 高度なカスタムの紹介

ファームウェアのソースコードを編集することで、高度なカスタムが可能です。

#### レイヤーごとの言語設定

レイヤーが切り替わるごとに、設定した言語に対応して IME を自動で切り替えることができます。

この機能によって、真ん中のレイヤーキーをキーボード・ステノモードの切り替えキーかつ IME 切り替えキーとして使用することができます。

例えば、日本語入力はメジロ式、英語入力は普通のキーボード入力で行うという場合、 QWERTY レイヤーで IME OFF 、 GEMINI レイヤーでは IME ON に自動で切り替えるようにすることができます。

(※ Windows11 環境では IME のオンオフキーがデフォルトでは動作しないため、この機能を使用する場合は以下の設定を行う必要があります。

まず設定アプリを開き、`時刻と言語` > `言語と地域` > `オプション` > `Microsoft IME` > `キーのタッチとカスタマイズ` に移動します。

![](./imgs/win_ime_settings_1.png)

ここの`キーの割り当て`で変換キーと無変換キーの割り当てをそれぞれ`IME オン`と`IME オフ`に変更します。

![](./imgs/win_ime_settings_2.png)

※ MacOS 環境ではデフォルトで IME のオンオフキーが動作するため、特に設定を行う必要はありません。)

Mejiro31 の言語設定をするにはまず、あなたがフォークしたリポジトリの`keyboards/jeebis/mejiro31/keymaps/via/keymap.c`を開きます。

すると51 行目あたりに以下のコードがあります。

```
<keymaps/via/keymap.c>
// 0:未使用, 1:英語, 2:日本語, 3:無変更
static int stn_lang = 0; // ステノ時の言語
static int kbd_lang = 0; // キーボード時の言語
```

ここでは、`stn_lang`が GEMINI レイヤー (ステノモード) の言語設定、`kbd_lang`が QWERTY レイヤー (キーボードモード) の言語設定を表しています。

それぞれの変数に以下の数値を設定することで言語設定を変更できます。

| 数値 | 言語設定 |
| ---- | ------- |
| 1    | 英語    |
| 2    | 日本語  |
| その他 | 無変更 |

例えば、メジロ式で日本語入力、キーボードで英語入力を行いたい場合は以下のように設定します。

```<keymaps/via/keymap.c>
static int stn_lang = 2; // ステノ時の言語
static int kbd_lang = 1; // キーボード時の言語
```

逆に、キーボードで日本語入力、英語速記で英語入力を行いたい場合は以下のように設定します。

```<keymaps/via/keymap.c>
static int stn_lang = 1; // ステノ時の言語
static int kbd_lang = 2; // キーボード時の言語
```

#### 代替レイアウトの有効化

デフォルトでは QWERTY レイヤーのみが定義されていますが、 Dvorak や大西配列のような代替レイアウトを何でも好きに使うことができます。

ただし、モディファイアキーを押している間は代替レイアウトは無効になり、 QWERTY として動作します。

まず、`keyboards/jeebis/mejiro31/keymaps/via/keymap.c`を開きます。

51 行目あたりに以下のコードがあります。
```
<keymaps/via/keymap.c>
// 0:未使用, 1:英語, 2:日本語, 3:無変更
...
...
static int alt_lang = 0; // Alternative Layoutの言語設定
```

ここの`alt_lang`変数はデフォルトでは 0 (未使用) に設定されています。

これを以下の数値に設定することで代替レイアウトを有効化できます。

| 数値 | 言語設定 |
| ---- | ------- |
| 1    | 英語 |
| 2    | 日本語 |
| 3    | 日英両方 |

NUMBER レイヤーの右親指下段にあるキーで IME の切り替えと代替レイアウトの有効・無効を同時に切り替えることができます。

1 あるいは 2 を設定した場合、 IME 切替キーを有効化する必要があります。全章の[レイヤーごとの言語設定](#レイヤーごとの言語設定)をご覧ください。

次に、代替レイアウトのキーマップを定義します。

153 行目あたりに以下のコードがあります。

```<keymaps/via/keymap.c>
/*---------------------------------------------------------------------------------------------------*/
/*----------------------------------------Alternative Layout-----------------------------------------*/
/*---------------------------------------------------------------------------------------------------*/

// Alternative Layout変換
// 配列名：Graphite
static inline uint16_t alt_transform(uint16_t kc) {
    if (!is_alt_mode || force_qwerty_active) return kc;
    switch (kc) {
        case KC_Q: return KC_B;
        case KC_W: return KC_L;
        case KC_E: return KC_D;
        case KC_R: return KC_W;
        case KC_T: return KC_Z;
        case KC_Y: return KC_QUOT;
        case KC_U: return KC_F;
        case KC_I: return KC_O;
        case KC_O: return KC_U;
        case KC_P: return KC_J;
        case KC_MINS: return KC_MINS;

        case KC_A: return KC_N;
        case KC_S: return KC_R;
        case KC_D: return KC_T;
        case KC_F: return KC_S;
        case KC_G: return KC_G;
        case KC_H: return KC_Y;
        case KC_J: return KC_H;
        case KC_K: return KC_A;
        case KC_L: return KC_E;
        case KC_SCLN: return KC_I;
        case KC_QUOT: return KC_SCLN;

        case KC_Z: return KC_Q;
        case KC_X: return KC_X;
        case KC_C: return KC_M;
        case KC_V: return KC_C;
        case KC_B: return KC_V;
        case KC_N: return KC_K;
        case KC_M: return KC_P;
        case KC_COMM: return KC_COMM;
        case KC_DOT: return KC_DOT;
        case KC_SLSH: return KC_SLSH;
        case KC_BSLS: return KC_BSLS;
        default: return kc;
    }
}
```

ここで定義されている`alt_transform`関数が代替レイアウトのキーマップを定義しています。

デフォルトでは英語用配列の Graphite レイアウトが定義されていますが、ここを書き換えることで好きなレイアウトを定義することができます。

例えば、大西配列を定義したい場合は以下のように書き換えます。

```<keymaps/via/keymap.c>
// Alternative Layout変換
// 配列名：大西配列
static inline uint16_t alt_transform(uint16_t kc) {
    if (!is_alt_mode || force_qwerty_active) return kc;
    switch (kc) {
        case KC_Q: return KC_Q;
        case KC_W: return KC_L;
        case KC_E: return KC_U;
        case KC_R: return KC_MINS;
        case KC_T: return KC_DOT;
        case KC_Y: return KC_F;
        case KC_U: return KC_W;
        case KC_I: return KC_R;
        case KC_O: return KC_Y;
        case KC_P: return KC_P;
        case KC_MINS: return KC_SCLN;

        case KC_A: return KC_E;
        case KC_S: return KC_I;
        case KC_D: return KC_A;
        case KC_F: return KC_O;
        case KC_G: return KC_COMM;
        case KC_H: return KC_K;
        case KC_J: return KC_T;
        case KC_K: return KC_N;
        case KC_L: return KC_S;
        case KC_SCLN: return KC_H;
        case KC_QUOT: return KC_QUOT;

        case KC_Z: return KC_Z;
        case KC_X: return KC_X;
        case KC_C: return KC_C;
        case KC_V: return KC_V;
        case KC_B: return KC_SLSH;
        case KC_N: return KC_G;
        case KC_M: return KC_D;
        case KC_COMM: return KC_M;
        case KC_DOT: return KC_J;
        case KC_SLSH: return KC_B;
        case KC_BSLS: return KC_BSLS;
        default: return kc;
    }
}
```

### コンボの詳細設定

Mejiro31 では QMK 標準のコンボ機能を使用しておらず、独自実装のコンボ機能を使用しています。

それは、 QWERTY レイヤーでの中段キーの入力を同時押しで行う二段圧縮入力によって QMK の想定以上に多くのコンボが発生してしまうためです。

そのため、コンボの詳細設定を行うにはソースコードを書き換える必要があります。

コンボの設定をするには`keyboards/jeebis/mejiro31/keymaps/via/keymap.c`を開き、 271 行目あたりの以下のコードを編集します。

```<keymaps/via/keymap.c>
/*---------------------------------------------------------------------------------------------------*/
/*--------------------------------------------FIFOコンボ----------------------------------------------*/
/*---------------------------------------------------------------------------------------------------*/

#define COMBO_FIFO_LEN       30  // FIFOの長さ
#define COMBO_TIMEOUT_MS     100 // コンボ待機のタイムアウト時間(ms) ※ QMKコンボでいうところのCOMBO_TERM
#define HOLD_TIME_THRESHOLD_MS 200  // 長押し判定の閾値(ms)
```

ここで、`COMBO_TIMEOUT_MS`がコンボの同時押しとして認識される最大時間を表しています。

例えば、`COMBO_TIMEOUT_MS`を 150 に設定すると、 150 ms 以内に押されたキー同士がコンボとして認識されるようになります。

また、長押しの閾値もここで設定できます。`HOLD_TIME_THRESHOLD_MS`が長押しとして認識される最小時間を表しています。

例えば、`HOLD_TIME_THRESHOLD_MS`を 300 に設定すると、 300 ms 以上押されたキーが長押しとして認識されるようになります。

既存のコンボを変更したり、新しいコンボを追加したりするには 303 行目あたりの以下のコードを編集します。

```<keymaps/via/keymap.c>
// コンボ定義（順不同）
static const combo_pair_t combo_pairs[] PROGMEM = {
    // QWERTY
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

    // NUMBER
    {KC_1,    KC_7,    KC_4,     _NUMBER},
    {KC_2,    KC_8,    KC_5,     _NUMBER},
    {KC_3,    KC_9,    KC_6,     _NUMBER},
    {KC_DOT,  KC_MINS, KC_COMMA, _NUMBER},
    {KC_9,    KC_0,    KC_TAB,   _NUMBER},
    {KC_3,    KC_DZ,   KC_ESC,   _NUMBER},
    {KC_PGDN, KC_LEFT, KC_BSPC,  _NUMBER},
    {KC_PGUP, KC_HOME, KC_DEL,   _NUMBER},
};
```

例えば、 QWERTY レイヤーで V キーと M キーの同時押しで Enter キーを出力するコンボを追加したい場合は、以下のようにコードを追加します。

```<keymaps/via/keymap.c>
    {KC_V,    KC_M,    KC_ENT,  _QWERTY},
```

ただし、三キー同時押し以上のコンボは現在サポートされていないためご注意ください。

また、コンボの出力キーコードをコンボの要素として使うこともできません。例えば、 QWERTY レイヤーで F キーと J キーの同時押しで F キーを出力するコンボは定義できません。

## お問い合わせ

お問い合わせは`jeebis.iox@gmail.com`へお願いします。

[スタートページに戻る](../readme.md)
