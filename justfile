set shell := ["bash", "-euc"]
set positional-arguments

# コマンド一覧
default:
    @"{{just_executable()}}" --list

# ローカル開発サーバーを起動
dev:
    npm run dev

# Nodeのテスト
test:
    npm test
    PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-sync-firmware.py

# 通常の開発チェック
check: test

# キーボード定義データを再生成
generate:
    npm run generate

# QMKの検証済みQWERTY JP/ENをサイト配布用に取り込む
sync source='../qmk_firmware/.build':
    python3 scripts/sync-firmware.py "$1"
