/*
Copyright 2025 JEEBIS <jeebis.iox@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*---------------------------------------------------------------------------------------------------*/
/*----------------------------------------------初期設定----------------------------------------------*/
/*---------------------------------------------------------------------------------------------------*/

#include QMK_KEYBOARD_H
#include "os_detection.h"
#include "keymap_japanese.h"

enum layer_names {
    _QWERTY = 0,
    _GEMINI,
    _NUMBER,
    _FUNCTION,
};

enum custom_keycodes {
    KC_DZ = SAFE_RANGE,  // 00キー
    TG_JIS,              // JISモード切替キー
};

#define MT_SPC MT(MOD_LSFT, KC_SPC)  // タップでSpace、ホールドでShift
#define MT_ENT MT(MOD_LSFT, KC_ENT)  // タップでEnter、ホールドでShift
#define MT_ESC MT(MOD_LGUI, KC_ESC)  // タップでEscape、ホールドでGUI
#define MO_FUN MO(_FUNCTION)  // ホールドで_FUNCTIONレイヤー
#define MT_TGL LT(_NUMBER, KC_F24)  // タップで_QWERTY・_GEMINIレイヤー切替、ホールドで_NUMBERレイヤー

static uint16_t default_layer = 0; // デフォルトレイヤー状態を保存する変数 (0:_QWERTY, 1: _GEMINI)
static bool is_jis_mode = true;    // JISモード状態を保存する変数

// ユーザー設定の永続化用
typedef union {
    uint32_t raw;
    struct {
        bool jis_mode : 1; // JISモードの永続フラグ
    };
} user_config_t;

static user_config_t user_config;

void eeconfig_init_user(void) {
    // 初期EEPROM値のセット（デフォルトはJISモードON）
    user_config.raw = 0;
    user_config.jis_mode = true;
    eeconfig_update_user(user_config.raw);

    // STENOモードの初期化
    steno_set_mode(STENO_MODE_GEMINI);
}

void keyboard_post_init_user(void) {
    // JISモードの復元
    user_config.raw = eeconfig_read_user();
    is_jis_mode = (user_config.jis_mode);

    // 起動時は必ずQWERTYをデフォルトに設定
    default_layer_set((layer_state_t)1UL << _QWERTY);
    layer_clear();
    layer_move(_QWERTY);
    default_layer = 0;
}

/*---------------------------------------------------------------------------------------------------*/
/*--------------------------------------------JIS×US変換---------------------------------------------*/
/*---------------------------------------------------------------------------------------------------*/

#define JP_TRANSFORM_ENABLED 1

// JIS×US変換
static inline uint16_t jis_transform(uint16_t kc, bool shifted) {
    if (!is_jis_mode) return kc;
    switch (kc) {
        case KC_1: return shifted ? JP_EXLM : KC_1;   // ! / 1
        case KC_2: return shifted ? JP_AT   : KC_2;   // @ / 2
        case KC_3: return shifted ? JP_HASH : KC_3;   // # / 3
        case KC_4: return shifted ? JP_DLR  : KC_4;   // $ / 4
        case KC_5: return shifted ? JP_PERC : KC_5;   // % / 5
        case KC_6: return shifted ? JP_CIRC : KC_6;   // ^ / 6
        case KC_7: return shifted ? JP_AMPR : KC_7;   // & / 7
        case KC_8: return shifted ? JP_ASTR : KC_8;   // * / 8
        case KC_9: return shifted ? JP_LPRN : KC_9;   // ( / 9
        case KC_0: return shifted ? JP_RPRN : KC_0;   // ) / 0

        case KC_GRV:  return shifted ? JP_TILD : JP_GRV;   // ~ / `
        case KC_MINS: return shifted ? JP_UNDS : JP_MINS;  // _ / -
        case KC_EQL:  return shifted ? JP_PLUS : JP_EQL;   // + / =
        case KC_LBRC: return shifted ? JP_LCBR : JP_LBRC;  // { / [
        case KC_RBRC: return shifted ? JP_RCBR : JP_RBRC;  // } / ]
        case KC_BSLS: return shifted ? JP_PIPE : JP_BSLS;  // | / ￥
        case KC_SCLN: return shifted ? JP_COLN : JP_SCLN;  // : / ;
        case KC_QUOT: return shifted ? JP_DQUO : JP_QUOT;  // " / '
        case KC_COMM: return shifted ? JP_LABK : JP_COMM;  // < / ,
        case KC_DOT:  return shifted ? JP_RABK : JP_DOT;   // > / .
        case KC_SLSH: return shifted ? JP_QUES : JP_SLSH;  // ? / /
        default: return kc;
    }
}

// JISモード時にShift を一時的に無効化
static void tap_code16_unshifted(uint16_t kc) {
    uint8_t saved_mods      = get_mods();
    uint8_t saved_weak_mods = get_weak_mods();
    uint8_t saved_osm       = get_oneshot_mods();

    del_mods(MOD_MASK_SHIFT);
    del_weak_mods(MOD_MASK_SHIFT);
    clear_oneshot_mods();
    send_keyboard_report();

    tap_code16(kc);

    set_mods(saved_mods);
    set_weak_mods(saved_weak_mods);
    set_oneshot_mods(saved_osm);
    send_keyboard_report();
}

// JIS変換対象でシフト解除が必要なキーか判定
static bool is_jis_shift_target(uint16_t kc, bool shifted) {
    if (!is_jis_mode || !shifted) return false;
    switch (kc) {
        case KC_1: case KC_2: case KC_3: case KC_4: case KC_5:
        case KC_6: case KC_7: case KC_8: case KC_9: case KC_0:
        case KC_GRV: case KC_MINS: case KC_EQL:
        case KC_LBRC: case KC_RBRC: case KC_BSLS:
        case KC_SCLN: case KC_QUOT: case KC_COMM: case KC_DOT: case KC_SLSH:
            return true;
        default:
            return false;
    }
}

/*---------------------------------------------------------------------------------------------------*/
/*--------------------------------------------FIFOコンボ----------------------------------------------*/
/*---------------------------------------------------------------------------------------------------*/

#define COMBO_FIFO_LEN       30  // FIFOの長さ
#define COMBO_TIMEOUT_MS     100 // コンボ待機のタイムアウト時間(ms) ※ QMKコンボでいうところのCOMBO_TERM
#define HOLD_TIME_THRESHOLD_MS 200  // 長押し判定の閾値(ms)

typedef struct {
    uint16_t keycode;
    uint16_t orig_keycode;   // 押下したオリジナルのキーコード
    uint16_t time_pressed;
    uint8_t  layer;       // 押下時のレイヤー
} combo_event_t;

typedef struct {
    uint16_t a;
    uint16_t b;
    uint16_t out;
    uint8_t  layer;       // 対応レイヤー
} combo_pair_t;

// 長押し状態管理
typedef struct {
    uint16_t keycode;              // 長押し中のキーコード（0なら未設定）
    uint16_t time_confirmed;       // キーが確定した時刻
    bool     is_held;              // 長押し中フラグ
    uint16_t source_key_a;         // コンボを構成した物理キーA
    uint16_t source_key_b;         // コンボを構成した物理キーB
    bool     source_a_pressed;     // 物理キーAが押されているか
    bool     source_b_pressed;     // 物理キーBが押されているか
} hold_state_t;

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
#define COMBO_PAIR_COUNT (sizeof(combo_pairs) / sizeof(combo_pairs[0]))

static combo_event_t combo_fifo[COMBO_FIFO_LEN];
static uint8_t combo_fifo_len = 0;
static hold_state_t hold_state = {0, 0, false, 0, 0, false, false};  // 長押し状態の初期化

// コンボ候補キーか判定する関数
static bool is_combo_candidate(uint16_t keycode) {
    // 特殊キーはコンボ対象外
    if (keycode == KC_DZ) return false;
    // GRV はコンボ外でも JIS 変換する
    if (keycode == KC_GRV) return true;

    uint16_t base = keycode;
    for (uint8_t i = 0; i < COMBO_PAIR_COUNT; i++) {
        combo_pair_t pair;
        memcpy_P(&pair, &combo_pairs[i], sizeof(pair));
        if (pair.a == base || pair.b == base) {
            return true;
        }
    }
    return false;
}

// コンボ定義を検索する関数
static const combo_pair_t *find_combo(uint16_t a, uint16_t b, uint8_t layer) {
    for (uint8_t i = 0; i < COMBO_PAIR_COUNT; i++) {
        combo_pair_t pair;
        memcpy_P(&pair, &combo_pairs[i], sizeof(pair));
        if (pair.layer != layer) continue;
        if ((pair.a == a && pair.b == b) || (pair.a == b && pair.b == a)) {
            return &combo_pairs[i];
        }
    }
    return NULL;
}

// 指定インデックスの要素を削除する関数
static void fifo_remove(uint8_t idx) {
    if (idx >= combo_fifo_len) return;
    for (uint8_t i = idx; i + 1 < combo_fifo_len; i++) {
        combo_fifo[i] = combo_fifo[i + 1];
    }
    combo_fifo_len--;
}

// 先頭要素とそれ以外のペアを探索し、コンボがあれば発射して削除
static bool resolve_combo_head(void) {
    if (combo_fifo_len < 2) return false;

    uint16_t head_kc    = combo_fifo[0].keycode;
    uint8_t  head_layer = combo_fifo[0].layer;

    for (uint8_t i = 1; i < combo_fifo_len; i++) {
        uint16_t other_kc    = combo_fifo[i].keycode;
        uint8_t  other_layer = combo_fifo[i].layer;

        if (other_layer != head_layer) continue;

        const combo_pair_t *hit = find_combo(head_kc, other_kc, head_layer);
        if (hit) {
            combo_pair_t pair;
            memcpy_P(&pair, hit, sizeof(pair));

            // JIS×US変換
            uint8_t mods = get_mods();
            bool shifted = (mods & MOD_MASK_SHIFT);
            uint16_t orig_out = pair.out;
            uint16_t out = jis_transform(orig_out, shifted);

            // 新しいキーを確定（物理キー情報も記録）
            // コンボも長押し対応
            hold_state.keycode = out;
            hold_state.time_confirmed = timer_read();
            hold_state.is_held = true;  // 長押し状態にする
            hold_state.source_key_a = head_kc;
            hold_state.source_key_b = other_kc;
            hold_state.source_a_pressed = true;
            hold_state.source_b_pressed = true;

                if (is_jis_shift_target(orig_out, shifted)) {
                    tap_code16_unshifted(out);  // 長押しではなくタップ扱い（Shift無効で出力）
                    hold_state.is_held = false;
                } else {
                    register_code16(out);
                }
            fifo_remove(i); // 後ろから削除
            fifo_remove(0); // 先頭を削除
            return true;    // 呼び出し側で再試行
        }
    }
    return false;
}

// タイムアウト処理とコンボ解決を行う
static void combo_fifo_service(void) {
    while (combo_fifo_len > 0) {
        // タイムアウトチェック
        // キューに複数要素がある場合はコンボ待機を優先し、タイムアウト確定を延期
        // キューが1つだけの場合、タイムアウト時はタップで確定
        if (combo_fifo_len == 1 && timer_elapsed(combo_fifo[0].time_pressed) > COMBO_TIMEOUT_MS) {
            uint16_t base_kc = combo_fifo[0].keycode;
            uint8_t mods = get_mods();
            bool shifted = (mods & MOD_MASK_SHIFT);
            uint16_t out = jis_transform(base_kc, shifted);
            bool unshift = is_jis_shift_target(base_kc, shifted);
            // タイムアウト確定：長押し状態にする（ただしShiftキャンセル時はタップ扱い）
            hold_state.keycode = out;
            hold_state.time_confirmed = timer_read();
            hold_state.is_held = !unshift;
            hold_state.source_key_a = base_kc;
            hold_state.source_key_b = 0;
            hold_state.source_a_pressed = true;
            hold_state.source_b_pressed = false;
            if (unshift) {
                tap_code16_unshifted(out);
            } else {
                register_code16(out);  // キーを押し続ける
            }
            fifo_remove(0);  // FIFOから削除
            continue;
        }
        // 先頭と他要素のペア探索
        if (combo_fifo_len >= 2) {
            if (resolve_combo_head()) {
                continue; // コンボが解決されたので再ループ
            } else {
                // コンボペアが見つからない場合、先行キーを「タップで確定」
                // 複数キー存在時は長押しをキャンセル
                if (hold_state.is_held) {
                    unregister_code16(hold_state.keycode);
                    hold_state.is_held = false;
                }
                uint16_t base_kc = combo_fifo[0].keycode;
                uint8_t mods = get_mods();
                bool shifted = (mods & MOD_MASK_SHIFT);
                uint16_t out = jis_transform(base_kc, shifted);
                bool unshift = is_jis_shift_target(base_kc, shifted);
                // タップで確定
                fifo_remove(0);  // まずFIFOから削除
                if (unshift) {
                    tap_code16_unshifted(out);
                } else {
                    tap_code16(out);
                }
                continue; // 再ループで次の要素をチェック
            }
        }
        break;
    }
}

/*---------------------------------------------------------------------------------------------------*/
/*--------------------------------------------キーマップ----------------------------------------------*/
/*---------------------------------------------------------------------------------------------------*/

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {


    // QWERTY
    // ┌─────┬─────┬─────┬─────┬─────┬─────┐             ┌─────┬─────┬─────┬─────┬─────┬─────┐
    // │  `  │  q  │  w  │  e  │  r ESC t  │             │  y DEL u  │  i  │  o  │  p  │  -  │
    // ├─────┼──a──┼──s──┼──d──┼──f──┼──g──┤             ├──h──┼──j──┼──k──┼──l──┼──;──┼──'──┤
    // │ ESC │  z  │  x  │  c  │  v TAB b  │             │  n BSP m  │  ,  │  .  │  /  │  \  │
    // └─────┴─────┴─────┴─────┴─────┴─────┘             └─────┴─────┴─────┴─────┴─────┴─────┘
    //                         ┌───────────┐             ┌───────────┐
    //                         │   SandS   │             │   EandS   │
    //                         ├─────┬─────┤   ┌─────┐   ├─────┬─────┤
    //                         │ ALT │ CTL │   │MT_TG│   │  [  =  ]  │
    //                         └─────┴─────┘   └─────┘   └─────┴─────┘
    // QWERTY
    [_QWERTY] = LAYOUT(
        KC_GRV, KC_Q, KC_W, KC_E, KC_R,    KC_T,    KC_Y,    KC_U,    KC_I,    KC_O,   KC_P,    KC_MINS,
        KC_ESC, KC_Z, KC_X, KC_C, KC_V,    KC_B,    KC_N,    KC_M,    KC_COMM, KC_DOT, KC_SLSH, KC_BSLS,
                                  MT_SPC , MT_TGL,  MT_ENT,
                                  KC_LALT, KC_LCTL, KC_LBRC, KC_RBRC
    ),

    // GEMINI
    // ┌─────┬─────┬─────┬─────┬─────┬─────┐             ┌─────┬─────┬─────┬─────┬─────┬─────┐
    // │  #  │  S  │  T  │  P  │  H  │  *  │             │  *  │  F  │  P  │  L  │  T  │  D  │
    // ├─────┼─────┼─────┼─────┼─────┼─────┤             ├─────┼─────┼─────┼─────┼─────┼─────┤
    // │  #  │  S  │  K  │  W  │  R  │  *  │             │  *  │  R  │  B  │  G  │  S  │  Z  │
    // └─────┴─────┴─────┴─────┴─────┴─────┘             └─────┴─────┴─────┴─────┴─────┴─────┘
    //                         ┌───────────┐             ┌───────────┐
    //                         │     #     │             │     #     │
    //                         ├─────┬─────┤   ┌─────┐   ├─────┬─────┤
    //                         │  A  │  O  │   │MT_TG│   │  E  │  U  │
    //                         └─────┴─────┘   └─────┘   └─────┴─────┘
    // GEMINI
    [_GEMINI] = LAYOUT(
        STN_N1, STN_S1, STN_TL, STN_PL, STN_HL, STN_ST1, STN_ST3, STN_FR, STN_PR, STN_LR, STN_TR, STN_DR,
        STN_N2, STN_S2, STN_KL, STN_WL, STN_RL, STN_ST2, STN_ST4, STN_RR, STN_BR, STN_GR, STN_SR, STN_ZR,
                                        STN_N3, MT_TGL,  STN_N4,
                                        STN_A,  STN_O,   STN_E,   STN_U
    ),

    // NUMBER
    // ┌─────┬─────┬─────┬─────┬─────┬─────┐             ┌─────┬─────┬─────┬─────┬─────┬─────┐
    // │  `  │  -  │  1  │  2  │  3  │ 00  │             │ PGU │ HOM │  ↑  │ END │ CAP │ JIS │
    // ├─────┼──,──┼──4──┼──5──┼──6──┼─────┤             ├─────┼─────┼─────┼─────┼─────┼─────┤
    // │ ESC │  .  │  7  │  8  │  9  │  0  │             │ PGD │  ←  │  ↓  │  →  │ GUI │MO_FN│
    // └─────┴─────┴─────┴─────┴─────┴─────┘             └─────┴─────┴─────┴─────┴─────┴─────┘
    //                         ┌───────────┐             ┌───────────┐
    //                         │   SandS   │             │   EandS   │
    //                         ├─────┬─────┤   ┌─────┐   ├─────┬─────┤
    //                         │ ALT │ CTL │   │MT_TG│   │INT5 │INT4 │
    //                         └─────┴─────┘   └─────┘   └─────┴─────┘
    // NUMBER
    [_NUMBER] = LAYOUT(
        KC_GRV, KC_MINS, KC_1, KC_2, KC_3,    KC_DZ,   KC_PGUP, KC_HOME, KC_UP,   KC_END,   KC_CAPS, TG_JIS,
        KC_ESC, KC_DOT,  KC_7, KC_8, KC_9,    KC_0,    KC_PGDN, KC_LEFT, KC_DOWN, KC_RIGHT, KC_LGUI, MO_FUN,
                                     MT_SPC,  KC_TRNS, MT_ENT,
                                     KC_LALT, KC_LCTL, KC_INT5, KC_INT4
    ),

    // FUNCTION
    // ┌─────┬─────┬─────┬─────┬─────┬─────┐             ┌─────┬─────┬─────┬─────┬─────┬─────┐
    // │ F1  │ F2  │ F3  │ F4  │ F5  │ F11 │             │ BRU │ VL0 │ VL- │ VL+ │ PSC │ SLP │
    // ├─────┼─────┼─────┼─────┼─────┼─────┤             ├─────┼─────┼─────┼─────┼─────┼─────┤
    // │ ESC │ F6  │ F7  │ F8  │ F9  │ F10 │             │ BRD │ |<< │ >|| │ >>| │ INS │MO_FN│
    // └─────┴─────┴─────┴─────┴─────┴─────┘             └─────┴─────┴─────┴─────┴─────┴─────┘
    //                         ┌───────────┐             ┌───────────┐
    //                         │   SandS   │             │   EandS   │
    //                         ├─────┬─────┤   ┌─────┐   ├─────┬─────┤
    //                         │ ALT │ CTL │   │MT_TG│   │ F12 │ F13 │
    //                         └─────┴─────┘   └─────┘   └─────┴─────┘
    // FUNCTION
    [_FUNCTION] = LAYOUT(
        KC_F1,  KC_F2, KC_F3, KC_F4, KC_F5,   KC_F11,  KC_BRIU, KC_MUTE, KC_VOLD, KC_VOLU, KC_PSCR, KC_SLEP,
        KC_ESC, KC_F6, KC_F7, KC_F8, KC_F9,   KC_F10,  KC_BRID, KC_MPRV, KC_MPLY, KC_MNXT, KC_LGUI, KC_TRNS,
                                     KC_TRNS, KC_TRNS, KC_TRNS,
                                     KC_TRNS, KC_TRNS, KC_F12,  KC_F13
    ),
};

/*---------------------------------------------------------------------------------------------------*/
/*--------------------------------------------メイン処理----------------------------------------------*/
/*---------------------------------------------------------------------------------------------------*/


bool process_record_user(uint16_t keycode, keyrecord_t *record) {

    if (is_combo_candidate(keycode)) {
        if (keycode == KC_GRV) {
            uint8_t mods = get_mods();
            if (is_jis_mode && (mods & MOD_MASK_ALT)) {
                if (record->event.pressed) {
                    tap_code16(KC_GRV); // 全角半角キーを出力
                }
                return false;
            }
        }

        if (record->event.pressed) {
            if (combo_fifo_len < COMBO_FIFO_LEN) {
                uint16_t base = keycode;
                // 新しいキーが追加される場合、既存の長押しをキャンセル
                if (hold_state.is_held && combo_fifo_len > 0) {
                    unregister_code16(hold_state.keycode);
                    hold_state.is_held = false;
                }
                combo_fifo[combo_fifo_len].keycode = base;
                combo_fifo[combo_fifo_len].orig_keycode = keycode;
                combo_fifo[combo_fifo_len].layer   = get_highest_layer(layer_state | default_layer_state);
                combo_fifo[combo_fifo_len].time_pressed = timer_read();
                combo_fifo_len++;
            } else {
                // キューがいっぱいのときは失われないよう即時送信
                tap_code16(keycode);
            }
        } else {
            // キーが離された時：長押し中なら解放
            uint16_t base = keycode;

            // 長押し中のキーが離されたかチェック
            if (hold_state.is_held) {
                // タイムアウト確定後（長押し中）の解放処理
                if (base == hold_state.source_key_a) {
                    hold_state.source_a_pressed = false;
                }
                if (base == hold_state.source_key_b) {
                    hold_state.source_b_pressed = false;
                }

                // どちらかのキーが離された時点で長押しをキャンセル
                if (!hold_state.source_a_pressed || !hold_state.source_b_pressed) {
                    unregister_code16(hold_state.keycode);
                    hold_state.is_held = false;
                    hold_state.keycode = 0;
                }
            } else {
                // タイムアウト前にキーが離された場合タップで出力
                // FIFOから削除して、タップ送信
                for (uint8_t i = 0; i < combo_fifo_len; i++) {
                    if (combo_fifo[i].keycode == base) {
                        uint8_t mods = get_mods();
                        bool shifted = (mods & MOD_MASK_SHIFT);
                        uint16_t out = jis_transform(base, shifted);
                        bool unshift = is_jis_shift_target(base, shifted);
                        if (unshift) {
                            tap_code16_unshifted(out);
                        } else {
                            tap_code16(out);
                        }
                        fifo_remove(i);
                        break;
                    }
                }
            }
        }
        return false; // 通常処理を抑止
    }

    os_variant_t os = detected_host_os();
    bool is_mac = (os == OS_MACOS || os == OS_IOS);

    switch (keycode) {
        case MT_TGL:  // MT_TGLキー
            if (record->tap.count > 0) {
                if (record->event.pressed) {
                    // _QWERTY と _GEMINI の間でトグル切り替えを行う
                    if (default_layer == 0) {
                        default_layer_set((layer_state_t)1UL << _GEMINI);
                        layer_move(_GEMINI);
                        tap_code16(is_mac ? KC_LNG1 : KC_INT4); // Mac: かな / Win: 変換
                        default_layer = 1;
                    } else {
                        default_layer_set((layer_state_t)1UL << _QWERTY);
                        layer_move(_QWERTY);
                        tap_code16(is_mac ? KC_LNG2 : KC_INT5); // Mac: 英数 / Win: 無変換
                        default_layer = 0;
                    }
                }
                return false;
            }
            return true;
        case TG_JIS:  // JISモード切替キー
            if (record->event.pressed) {
                is_jis_mode = !is_jis_mode;
                // EEPROMへ保存
                user_config.jis_mode = is_jis_mode;
                eeconfig_update_user(user_config.raw);
            }
            return true;
        case KC_DZ:
            if (record->event.pressed) {
                // 押された瞬間に0を2回送信
                SEND_STRING("00");
            }
            return false;
        case KC_LCTL:
            if (is_mac) {
                // Macの場合はCommandとして振る舞わせる
                if (record->event.pressed) {
                    register_code(KC_LGUI);
                } else {
                    unregister_code(KC_LGUI);
                }
                return false;
            }
            return true;
        case KC_LGUI:
            if (is_mac) {
                // Macの場合はControlとして振る舞わせる
                if (record->event.pressed) {
                    register_code(KC_LCTL);
                } else {
                    unregister_code(KC_LCTL);
                }
                return false;
            }
            return true;
        case KC_INT4:
            if (is_mac) {
                // Macの場合は「英数」キーとして振る舞わせる
                if (record->event.pressed) {
                    register_code(KC_LNG2);
                } else {
                    unregister_code(KC_LNG2);
                }
                return false;
            }
            return true;
        case KC_INT5:
            if (is_mac) {
                // Macの場合は「かな」キーとして振る舞わせる
                if (record->event.pressed) {
                    register_code(KC_LNG1);
                } else {
                    unregister_code(KC_LNG1);
                }
                return false;
            }
            return true;
        default:
            break;
    }
    // Mod-Tapキーのホールド時にLCTL・LGUIが割り当てられている場合の処理
    if ((keycode >= QK_MOD_TAP && keycode <= QK_MOD_TAP_MAX)) {
    // ホールド時の修飾キーが LCTL であるか確認
        if (QK_MOD_TAP_GET_MODS(keycode) == MOD_LCTL) {
            if (is_mac) {
                if (record->event.pressed) {
                    if (record->tap.count > 0) {
                        return true; // タップ時は通常のキーを送信
                    } else {
                        register_code(KC_LGUI); // Macなら Command を送信
                        return false;
                    }
                } else {
                    unregister_code(KC_LGUI);
                    return true; // 離した時のタップ処理は QMK 本体に任せる
                }
            }
        }
        // ホールド時の修飾キーが LGUI であるか確認
        else if (QK_MOD_TAP_GET_MODS(keycode) == MOD_LGUI) {
            if (is_mac) {
                if (record->event.pressed) {
                    if (record->tap.count > 0) {
                        return true; // タップ時は通常のキーを送信
                    } else {
                        register_code(KC_LCTL); // Macなら Control を送信
                        return false;
                    }
                } else {
                    unregister_code(KC_LCTL);
                    return true; // 離した時のタップ処理は QMK 本体に任せる
                }
            }
        }
    }
    return true;
}

// 毎スキャンでFIFOコンボの処理を行う
void matrix_scan_user(void) {
    combo_fifo_service();
}
