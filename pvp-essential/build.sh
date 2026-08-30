#!/bin/sh
# pack 폴더를 배포용 zip 으로 묶는다.
set -e
cd "$(dirname "$0")"
rm -f pvp_essential.zip
cd pack
zip -qr ../pvp_essential.zip . -x '.*'
cd ..
echo "built pvp_essential.zip"
