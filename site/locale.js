export const english = typeof location !== "undefined" &&
  new URLSearchParams(location.search).get("lang") === "en";

const translations = new Map(`
メジロ式=Mejiro
機能=Navigation
サイドバーをたたむ=Collapse sidebar
サイドバーを開く=Expand sidebar
ページ内を検索=Search this page
RMKファームウェア（試験版）=RMK firmware preview
実機検証向けです。書き込む前に、現在のキーマップと辞書を設定スタジオからJSONに書き出してください。=For hardware testing. Export your current keymap and dictionary as JSON before flashing.
試験版の設定変更には、RMK対応の試験用スタジオが必要です。=Use the RMK-compatible preview of Studio to edit these firmware settings.
試験版 ENのUF2=English preview UF2
ショートカットの互換設定=Shortcut compatibility
Home／Endの動作=Home and End behavior
OSに合わせる=Follow the host OS
Home／Endを送る=Send Home and End
Command＋矢印を送る=Send Command + arrow
Command＋矢印を選ぶと、Home／Endで行頭・行末に移動します。=With Command + arrow selected, Home and End move to the beginning and end of the line.
修飾キーの入れ替え=Modifier remapping
修飾キーの動作=Modifier behavior
個別に設定=Customize
Alt／Option=Alt / Option
GUI／Command=GUI / Command
各キーが送る修飾キーを指定します。左右のキーに同じ入れ替えを適用します。=Choose which modifier each key sends. The mapping applies to both sides.
本体に保存するには対応ファームウェアが必要です。=Saving to the keyboard requires compatible firmware.
サイト同梱版=Bundled firmware
試作ファームウェア=Preview firmware
キーマップ=Keymap
キーボード設定=Keyboard settings
サイトの設定=Site settings
保存=Saving
オートセーブ=Autosave
接続したキーボードのロックを解除すると、設定の変更を自動で本体に保存します。=Automatically save changes to the connected keyboard when it is unlocked.
ロックを解除しました。変更は自動で保存されます。=Keyboard unlocked. Changes will be saved automatically.
編集中の設定に反映しました。接続中のキーボードのロックを解除すると自動で保存されます。=Assignment updated. Changes are saved automatically while the connected keyboard is unlocked.
ファームウェア=Firmware
入力テスト=Input test
ヘルプ=Help
ダークモード=Dark mode
ライトモード=Light mode
未接続=Disconnected
接続済み=Connected
キーボードを接続=Connect keyboard
接続を終了=Disconnect keyboard
JavaScriptを有効にしてください。=Please enable JavaScript.
オフライン編集=Offline editing
読み込み中…=Loading…
プロファイル=Profile
英語=English
設定をリセット=Reset settings
設定を読み込む=Import settings
設定を書き出す=Export settings
キーを選択してTap／Holdを編集。小さいキーは隣接2キーの同時押しです。表示は配列変換前の割り当てです。=Select a key to edit Tap and Hold. Small keys represent adjacent-key combos. Assignments are shown before layout conversion.
キーマップの操作説明=Keymap help
編集レイヤー=Layers
現在のレイヤーをPNGで保存=Save this layer as a PNG
キーの色=Key color
黒=Black
白=White
物理キーと同時押しキー=Physical keys and combos
短く押す=Tap
短く押すときのキーを検索・選択=Choose a tap key
短く押したときのキーを検索・選択=Choose a tap key
長押し=Hold
長押し時の修飾キー・レイヤーを検索・選択=Choose a hold modifier or layer
選択したキーに割り当てる=Apply key assignment
押しているキー=Keys held
入力ログを保存=Save input log
テスト結果を消去=Clear input log
ここをクリックして入力=Click here and type
ブラウザーに届いた入力を表示します。IMEの確定文字は入力欄で確認できます。OSが使うショートカットや物理スイッチ自体は検査できません。=Shows input received by the browser. OS-reserved shortcuts and physical switches cannot be tested here.
継続時間=Duration
キー入力=Key events
0 件=0 events
キー入力履歴=Key event history
配列と出力=Layout and output
英数入力の配列=English layout
PC側の配列=Host layout
代替配列を有効にする=Enable alternative layout
入力の判定時間=Input timing
コンボ受付時間（ms）=Combo window (ms)
標準：150ms=Default 150 ms
2つのキーを同時押しとみなす時間。=Window in which two keys count as a combo.
連続入力の猶予時間（ms）=Continuation window (ms)
標準：50ms=Default 50 ms
前のキーが残った連続入力を判定する時間。=Window for successive input while a previous key is still held.
長押し判定時間（ms）=Hold threshold (ms)
標準：300ms=Default 300 ms
TapからHoldに切り替わる時間。連続入力の猶予時間より長くします。=Time before a tap becomes a hold. Set it above the continuation window.
判定時間の変更には最新のUF2を書き込んでください。=Install the latest UF2 to change timing.
UF2 ダウンロード=Firmware download
書き込み方法=Flashing instructions
基本プロファイル=Profile
英語 — 記号キーを優先=English
UF2をダウンロード=Download UF2
選択したプロファイルのUF2をダウンロード=Download the English UF2
配布UF2の初期配列はQWERTYです。代替配列は書き込み後、このサイトの設定から選択して保存できます。=The UF2 starts with QWERTY. After flashing, choose and save an alternative layout in Keyboard settings.
Vial対応リリースを確認中…=Checking for firmware…
接続と保存=Connect and save
UF2を書き込む=Flash the UF2
BOOTSELを押しながら接続し、RPI-RP2へUF2をコピーします。=Connect while holding BOOTSEL and copy the UF2 to the RPI-RP2 drive.
USBを再接続し、右上の接続アイコンを押します。WebHID対応のChrome／Edgeを使用してください。=Reconnect USB and select the plug icon in Chrome or Edge with WebHID.
編集して保存=Edit and save
キーを選び、Tap／Holdを設定してチェックを押します。下部でロックを解除して本体へ保存します。=Select a key, choose Tap and Hold assignments, and apply them with the check button. Unlock the keyboard and save from the bottom bar.
コンボ・配列について=Combos and layouts
小さいキーは隣接2キーのコンボです。Stenoではコンボは使いません。表示されるキーは代替配列による変換前です。=Small keys represent adjacent-key combos. Combos are unavailable on the Steno layer. Key labels show assignments before layout conversion.
接続できない場合=Connection troubleshooting
このサイトに対応した最新UF2を使用してください。Linuxでは=Use the latest UF2. On Linux, check
USBアクセス設定=USB access settings
も確認してください。=as well.
保存中…=Saving…
オフライン=Offline
本体のロックを解除=Unlock keyboard
キーボードに保存=Save to keyboard
通信進行状況=Transfer progress
編集中の設定があります=Unsaved changes
キャンセル=Cancel
続ける=Continue
閉じる=Close
ロック解除=Unlock
キーボード上段のいちばん左といちばん右を、=Press the leftmost and rightmost keys in the top row
そのまま約7秒間押し続けてください。=and hold them for about seven seconds.
キーが押されるのを待っています…=Waiting for keys…
キー選択を閉じる=Close key picker
キーを選択=Choose a key
キーを入力=Capture a key
入力したキーを使う=Use captured key
名前で検索=Search by name
例: #、Hash、シャープ、Enter、左Alt=Example: #, Hash, Enter, Left Alt
割り当て候補=Available keys
本体への接続にはWebHID対応のChrome／Edgeを使用してください。=Connect your keyboard using Chrome or Edge with WebHID.
Mejiro31 接続済み=Mejiro31 connected
キーボードと通信中…=Communicating with keyboard…
未保存=Unsaved
保存済み=Saved
変更内容を確認して、本体に保存してください。=Review the changes and save them to the keyboard.
設定の保存にはキーボードを接続してください。=Connect the keyboard to save settings.
本体をロック=Lock keyboard
ロックを解除=Unlock keyboard
長押し — キー・レイヤーを選択=Hold — choose a key or layer
短く押す — キーを選択=Tap — choose a key
割り当てたいキーやショートカットを押してください。=Press the key or shortcut you want to assign.
一致するキーがありません。検索語を変えてください。=No matching keys. Try another search.
未割り当て=Unassigned
下のレイヤーを使用=Use lower layer
設定値がこのファームウェアに対応していません。=The firmware does not support these settings.
Mejiro31用の設定ファイルではありません。=This is not a Mejiro31 settings file.
キーマップ・入力設定・メジロ式の辞書を標準設定に戻します。よろしいですか？=Reset the keymap and input settings to their defaults?
現在の編集内容を読み込んだ設定で置き換えますか？=Replace your current edits with the imported settings?
接続するとキーボードの現在の設定を読み込み、編集中の内容を置き換えます。必要なら先に「書き出す」で保存してください。=Connecting loads the keyboard settings and replaces your edits. Export your current settings first if you want to keep them.
編集中の設定に反映しました。本体へ反映するには「キーボードに保存」を押してください。=Assignment updated. Select Save to keyboard to apply it to the device.
設定を読み込みました。キーボードへの書き込みはまだ行っていません。=Settings imported. Save to keyboard to apply them to the device.
Mejiro31の設定を読み込みました。変更後はロックを解除して保存してください。=Mejiro31 settings loaded. Unlock and save after making changes.
接続をキャンセルしました。=Connection canceled.
キーボードに保存し、読み戻して内容を確認しました。=Settings saved and verified on the keyboard.
デバイスが切断されました=Keyboard disconnected.
本体をロックしました。=Keyboard locked.
ロック解除をキャンセルしました。=Unlock canceled.
ロックを解除しました。変更内容を確認して「キーボードに保存」を押してください。=Keyboard unlocked. Review your changes and select Save to keyboard.
時間内にロックを解除できませんでした。もう一度お試しください。=Unlock timed out. Try again.
このプロファイルのUF2はまだ用意されていません。配布UF2はQWERTYです。代替配列は書き込み後、このサイトの設定から変更できます。=The English UF2 is currently unavailable.
この組み合わせのUF2はまだ用意されていません。=The English UF2 is currently unavailable.
UF2を取得できませんでした。再読み込みしてお試しください。=Could not fetch the UF2. Reload and try again.
UF2の検証に失敗しました。書き込まず、ファイルを再配置してください。=UF2 verification failed. Reload and download it again before flashing.
設定ファイルが大きすぎます。=The settings file is too large.
設定データを読み込めません。=Could not load configuration data.
オートセーブを開始するには本体のロックを解除してください。=Unlock the keyboard to start autosave.
同時押し=Combo
キー=Key
押す=Press
離す=Release
`.trim().split("\n").map((line) => line.split("=")));

export function t(message) {
  return english ? translations.get(message) ?? message : message;
}

export function localizePage(doc) {
  if (!english) return;
  doc.documentElement.lang = "en";
  doc.querySelector('meta[name="description"]').content =
    "Configure your Mejiro31 keymap and download English firmware.";
  doc.querySelector('[data-view="mejiro"]').hidden = true;
  doc.querySelector("#japanese-layout").closest("label").hidden = true;
  for (const id of ["edit-profile", "download-profile"]) {
    const select = doc.getElementById(id);
    select.querySelector('[value="jp"]').remove();
    select.value = "en";
  }
  doc.querySelector("#firmware .download-actions a").hidden = true;
  for (const link of doc.querySelectorAll("[data-japanese-download]")) link.hidden = true;
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const message = node.textContent.trim().replace(/\s+/g, " ");
    const translated = t(message);
    if (translated !== message) node.textContent = node.textContent.replace(node.textContent.trim(), translated);
  }
  for (const element of doc.querySelectorAll("[aria-label], [data-tip], [placeholder], img[alt]")) {
    for (const attr of ["aria-label", "data-tip", "placeholder", "alt"]) {
      if (element.hasAttribute(attr)) element.setAttribute(attr, t(element.getAttribute(attr)));
    }
  }
}
