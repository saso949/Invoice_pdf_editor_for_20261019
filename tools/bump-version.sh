#!/bin/sh
# 公開ファイルのバージョン番号を更新する（キャッシュ対策）
# index.html の ?v=… / APP_VERSION と version.json を同じ値に書き換える
set -e
cd "$(dirname "$0")/.."
V=$(date +%Y%m%d%H%M%S)
sed -i -E "s/\?v=[0-9]+/?v=$V/g; s/APP_VERSION = '[0-9]+'/APP_VERSION = '$V'/" index.html
printf '{ "version": "%s" }\n' "$V" > version.json
echo "version: $V"
