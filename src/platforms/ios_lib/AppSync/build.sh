echo "Set exit on simple errors"
set -e

rm -rf $(PWD)/build

echo "Build for iphonesimulator"
xcodebuild \
    -project AppSync.xcodeproj \
    -scheme AppSync \
    -sdk iphonesimulator \
    -destination "generic/platform=iOS Simulator" \
    -configuration Release \
    clean build \
    BUILD_DIR=$(PWD)/build \
    SKIP_INSTALL=NO \
    -quiet

echo "Build for iphoneos"
xcodebuild \
    -project AppSync.xcodeproj \
    -scheme AppSync \
    -sdk iphoneos \
    -destination "generic/platform=iOS" \
    -configuration Release \
    clean build \
    BUILD_DIR=$(PWD)/build \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    SKIP_INSTALL=NO \
    -quiet

echo "Creating XCFramework"
xcodebuild \
    -create-xcframework \
    -framework $(PWD)/build/Release-iphoneos/AppSync.framework \
    -debug-symbols $(PWD)/build/Release-iphoneos/AppSync.framework.dSYM \
    -framework $(PWD)/build/Release-iphonesimulator/AppSync.framework \
    -debug-symbols $(PWD)/build/Release-iphonesimulator/AppSync.framework.dSYM \
    -output $(PWD)/build/AppSync.xcframework
