#include QMK_KEYBOARD_H

// レイヤー定義（enumの値を0から連番で確保する）
enum layer_names {
    _QWERTY = 0,
    _GEMINI,
    _NUMBER,
    _FUNCTION,
};
enum custom_keycodes {
    KC_DZ = SAFE_RANGE,  // 00キー
    MT_TGL,  // タップで_GEMINIレイヤーをトグル、ホールドで_NUMBERレイヤーをモーメンタリにアクティブ
};

#define MT_SPC MT(MOD_LSFT, KC_SPC)  // タップでSpace、ホールドでControl
#define MT_ENT MT(MOD_LSFT, KC_ENT)  // タップでEnter、ホールドでShift
#define MT_ESC MT(MOD_LCTL, KC_ESC)  // タップでEscape、ホールドでControl
#define PSCR LGUI(LSFT(KC_S))  // Print Screenキー (Windows: Win + Shift + S)
#define RSCR LGUI(LALT(KC_R)) // Record Screenキー (Windows: Win + Alt + R)

// 押下時に_NUMBERレイヤーをオンにしたいという状態を保持する静的変数
static bool mt_tgl_number_active = false; 
// MT_TGLがホールドとして確定したかどうかを保持する静的変数
static bool mt_tgl_is_held = false;

// タイムアウト処理のための静的変数
static uint16_t mt_tgl_timer;

// このキーが押されているかどうかの追跡
static bool mt_tgl_pressed = false;

bool process_record_user(uint16_t keycode, keyrecord_t *record) {
    switch (keycode) {
        case MT_TGL:
            if (record->event.pressed) {
                // 押された瞬間
                mt_tgl_pressed = true;
                mt_tgl_number_active = true;
                mt_tgl_is_held = false; // フラグをリセット
                mt_tgl_timer = timer_read(); // タイマー開始

            } else {
                // 離された瞬間
                mt_tgl_pressed = false;
                mt_tgl_number_active = false; // フラグを解除

                if (mt_tgl_is_held) {
                    // ホールド済みの場合: _NUMBERレイヤーをオフに戻す
                    layer_off(_NUMBER);
                } else if (timer_elapsed(mt_tgl_timer) < TAPPING_TERM) {
                    // タップが確定した場合 (Tap Action: _GEMINIレイヤーをトグル)
                    layer_invert(_GEMINI);
                }
            }
            return false;
        case KC_DZ:
            if (record->event.pressed) {
                // 押された瞬間に0を2回送信
                SEND_STRING("00");
            }
            return true;
        default:
            // 他のキーが押されたとき (Permissive Hold ロジック)
            if (record->event.pressed && mt_tgl_pressed && !mt_tgl_is_held) {
                // 1. 他のキーが押された
                // 2. MT_TGLが押されている（mt_tgl_pressed == true）
                // 3. まだホールドが確定していない（mt_tgl_is_held == false）
                
                // TAPPING_TERM 内であっても、ホールドとして確定させる
                mt_tgl_is_held = true;
                
                // _NUMBERレイヤーを強制的にONにする（matrix_scan_userの処理を待たずに即座に）
                layer_on(_NUMBER); 

                // ホールド確定後は、TAPPING_TERM経過判定を不要にするためフラグを降ろす
                mt_tgl_number_active = false;
                // 以降、MT_TGLはホールドとして振る舞う
            }
            return true;
    }
}
void matrix_scan_user(void) {
    if (mt_tgl_number_active && !mt_tgl_is_held) {
        // MT_TGLが押されていて、まだホールドが確定していない場合
        
        if (timer_elapsed(mt_tgl_timer) >= TAPPING_TERM) {
            // TAPPING_TERMを超えたらホールド確定
            mt_tgl_is_held = true;
            
            // _NUMBERレイヤーを強制的にONにする
            layer_on(_NUMBER); 
        }
    }
}

// ..................................................................... Keymaps
//
const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
    // QWERTY
    // ┌─────┬─────┬─────┬─────┬─────┬─────┐             ┌─────┬─────┬─────┬─────┬─────┬─────┐
    // │  `  │  q  │  w  │  e  │  r  │  t  │             │  y DEL u  │  i  │  o  │  p  │  -  │
    // ├─────┼──a──┼──s──┼──d──┼──f──┼──g──┤             ├──h──┼──j──┼──k──┼──l──┼──;──┼──'──┤
    // │ ESC │  z  │  x  │  c  │  v TAB b  │             │  n BSP m  │  ,  │  .  │  /  │  \  │
    // └─────┴─────┴─────┴─────┴─────┴─────┘             └─────┴─────┴─────┴─────┴─────┴─────┘
    //                         ┌───────────┐             ┌───────────┐
    //                         │   SandS   │             │   EandS   │
    //                         ├─────┬─────┤   ┌─────┐   ├─────┬─────┤
    //                         │ WIN │ ALT │   │MT_TG│   │  [  =  ]  │
    //                         └─────┴─────┘   └─────┘   └─────┴─────┘
    [_QWERTY] = LAYOUT(
        KC_GRV,  KC_Q,    KC_W,    KC_E,    KC_R,    KC_T,    KC_Y,    KC_U,    KC_I,    KC_O,    KC_P,    KC_MINS,
        MT_ESC,  KC_Z,    KC_X,    KC_C,    KC_V,    KC_B,    KC_N,    KC_M,    KC_COMM, KC_DOT,  KC_SLSH, KC_BSLS,
                                            MT_SPC , MT_TGL,  MT_ENT,
                                            KC_LGUI, KC_LALT, KC_LBRC, KC_RBRC
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
    [_GEMINI] = LAYOUT(
        STN_N1, STN_S1,  STN_TL,  STN_PL,  STN_HL,  STN_ST1, STN_ST3, STN_FR,  STN_PR,  STN_LR,  STN_TR,  STN_DR,
        STN_N2, STN_S2,  STN_KL,  STN_WL,  STN_RL,  STN_ST2, STN_ST4, STN_RR,  STN_BR,  STN_GR,  STN_SR,  STN_ZR,
                                           STN_N3,  KC_TRNS, STN_N4,
                                           STN_A,   STN_O,   STN_E,   STN_U
    ),
    // NUMBER
    // ┌─────┬─────┬─────┬─────┬─────┬─────┐             ┌─────┬─────┬─────┬─────┬─────┬─────┐
    // │  `  │  -  │  1  │  2  │  3  │ 00  │             │ PGU │ HOM │  ↑  │ END │ CAP │ JIS │
    // ├─────┼─────┼──4──┼──5──┼──6──┼─────┤             ├─────┼─────┼─────┼─────┼─────┼─────┤
    // │ ESC │  .  │  7  │  8  │  9  │  0  │             │ PGD │  ←  │  ↓  │  →  │ SFT │MO_FN│
    // └─────┴─────┴─────┴─────┴─────┴─────┘             └─────┴─────┴─────┴─────┴─────┴─────┘
    //                         ┌───────────┐             ┌───────────┐
    //                         │   SandS   │             │   EandS   │
    //                         ├─────┬─────┤   ┌─────┐   ├─────┬─────┤
    //                         │ ALT │ CTL │   │MT_TG│   │INT5 │INT4 │
    //                         └─────┴─────┘   └─────┘   └─────┴─────┘
    [_NUMBER] = LAYOUT(
        KC_GRV, KC_MINS, KC_1,  KC_2,  KC_3,  KC_DZ,   KC_PGUP, KC_HOME, KC_UP,   KC_END,   KC_CAPS, TG_JIS,
        MT_ESC, KC_DOT,  KC_7,  KC_8,  KC_9,  KC_0,    KC_PGDN, KC_LEFT, KC_DOWN, KC_RIGHT, KC_LSFT, MO_FUN,
                                              MT_SPC,  KC_TRNS, MT_ENT,
                                              KC_LALT, KC_LCTL, KC_INT5, KC_INT4
    ),
    // FUNCTION
    // ┌─────┬─────┬─────┬─────┬─────┬─────┐             ┌─────┬─────┬─────┬─────┬─────┬─────┐
    // │ F1  │ F2  │ F3  │ F4  │ F5  │ F11 │             │ VLU │ MUT │ x|| │ PSC │ BRU │ PWR │
    // ├─────┼─────┼─────┼─────┼─────┼─────┤             ├─────┼─────┼─────┼─────┼─────┼─────┤
    // │ WIN │ F6  │ F7  │ F8  │ F9  │ F10 │             │ VLD │ |<< │ >|| │ >>| │ BRD │MO_FN│
    // └─────┴─────┴─────┴─────┴─────┴─────┘             └─────┴─────┴─────┴─────┴─────┴─────┘
    //                         ┌───────────┐             ┌───────────┐
    //                         │   SandS   │             │   EandS   │
    //                         ├─────┬─────┤   ┌─────┐   ├─────┬─────┤
    //                         │ ALT │ CTL │   │MT_TG│   │ F12 │ F13 │
    //                         └─────┴─────┘   └─────┘   └─────┴─────┘
    [_FUNCTION] = LAYOUT(
        KC_F1,   KC_F2,  KC_F3,  KC_F4, KC_F5,   KC_F11,  KC_VOLU, KC_MUTE, KC_MSTP, KC_PSCR, KC_BRIU, KC_PWR,
        KC_LGUI, KC_F6,  KC_F7,  KC_F8, KC_F9,   KC_F10,  KC_VOLD, KC_MPRV, KC_MPLY, KC_MNXT, KC_BRID, KC_TRNS,
                                        KC_TRNS, KC_TRNS, KC_TRNS,
                                        KC_TRNS, KC_TRNS, KC_F12, KC_F13
    ),
};
// ..................................................................... Keymaps

// Combos
const uint16_t PROGMEM qwerty_combo1[] = {KC_Q, KC_Z, COMBO_END};
const uint16_t PROGMEM qwerty_combo2[] = {KC_W, KC_X, COMBO_END};
const uint16_t PROGMEM qwerty_combo3[] = {KC_E, KC_C, COMBO_END};
const uint16_t PROGMEM qwerty_combo4[] = {KC_R, KC_V, COMBO_END};
const uint16_t PROGMEM qwerty_combo5[] = {KC_T, KC_B, COMBO_END};
const uint16_t PROGMEM qwerty_combo6[] = {KC_V, KC_B, COMBO_END};
const uint16_t PROGMEM qwerty_combo7[] = {KC_Y, KC_N, COMBO_END};
const uint16_t PROGMEM qwerty_combo8[] = {KC_U, KC_M, COMBO_END};
const uint16_t PROGMEM qwerty_combo9[] = {KC_I, KC_COMM, COMBO_END};
const uint16_t PROGMEM qwerty_combo10[] = {KC_O, KC_DOT, COMBO_END};
const uint16_t PROGMEM qwerty_combo11[] = {KC_P, KC_SLSH, COMBO_END};
const uint16_t PROGMEM qwerty_combo12[] = {KC_MINS, KC_BSLS, COMBO_END};
const uint16_t PROGMEM qwerty_combo13[] = {KC_N, KC_M, COMBO_END};
const uint16_t PROGMEM qwerty_combo14[] = {KC_Y, KC_U, COMBO_END};
const uint16_t PROGMEM qwerty_combo15[] = {KC_LBRC, KC_RBRC, COMBO_END};
const uint16_t PROGMEM qwerty_combo16[] = {KC_PGDN, KC_LEFT, COMBO_END};
const uint16_t PROGMEM qwerty_combo17[] = {KC_PGUP, KC_HOME, COMBO_END};
const uint16_t PROGMEM qwerty_combo18[] = {KC_9, KC_0, COMBO_END};
const uint16_t PROGMEM qwerty_combo19[] = {KC_1, KC_7, COMBO_END};
const uint16_t PROGMEM qwerty_combo20[] = {KC_2, KC_8, COMBO_END};
const uint16_t PROGMEM qwerty_combo21[] = {KC_3, KC_9, COMBO_END};


combo_t key_combos[] = {
    COMBO(qwerty_combo1, KC_A),
    COMBO(qwerty_combo2, KC_S),
    COMBO(qwerty_combo3, KC_D),
    COMBO(qwerty_combo4, KC_F),
    COMBO(qwerty_combo5, KC_G),
    COMBO(qwerty_combo6, KC_TAB),
    COMBO(qwerty_combo7, KC_H),
    COMBO(qwerty_combo8, KC_J),
    COMBO(qwerty_combo9, KC_K),
    COMBO(qwerty_combo10, KC_L),
    COMBO(qwerty_combo11, KC_SCLN),
    COMBO(qwerty_combo12, KC_QUOT),
    COMBO(qwerty_combo13, KC_BSPC),
    COMBO(qwerty_combo14, KC_DEL),
    COMBO(qwerty_combo15, KC_EQL),
    COMBO(qwerty_combo16, KC_BSPC),
    COMBO(qwerty_combo17, KC_DEL),
    COMBO(qwerty_combo18, KC_TAB),
    COMBO(qwerty_combo19, KC_4),
    COMBO(qwerty_combo20, KC_5),
    COMBO(qwerty_combo21, KC_6),
};

// Initialize the steno protocol
void eeconfig_init_user(void) {
    steno_set_mode(STENO_MODE_GEMINI);  // or STENO_MODE_BOLT
}
