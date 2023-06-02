#!/bin/sh

echo "Set exit on simple errors"
set -e

echo "Use dumb terminal"
export TERM=dumb

rm -rf ../ios || true
mkdir -p ../ios

echo "Build iOS"

cd AppSync
./build.sh
cd ..
echo "Copy AppSync/build/*.xcframework ../ios"

cp -R AppSync/build/AppSync.xcframework ../ios

# cp AppSync/build/*.framework.dSYM.zip dist/package/platforms/ios
