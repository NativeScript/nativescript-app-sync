package com.tns;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.Resources;

import java.io.File;

class TNSCodePush {

    private static final String TNS_PREFERENCES_DB = "prefs.db";
    private static final String CODE_PUSH_APK_BUILD_TIME_KEY = "CODE_PUSH_APK_BUILD_TIME";
    private static final String CODEPUSH_CURRENT_HASH_KEY = "CODEPUSH_CURRENT_HASH";
    private static final String CODEPUSH_PENDING_HASH_KEY = "CODEPUSH_PENDING_HASH";
    private static final String CODEPUSH_CURRENT_APPVERSION_KEY = "CODEPUSH_CURRENT_APPVERSION";
    private static final String CODEPUSH_CURRENT_APPBUILDTIME_KEY = "CODEPUSH_CURRENT_APPBUILDTIME";

    static void activatePackage(final Context context) {
        System.out.println("--------- activatePackage A");
        final String newPackagePath = getCurrentPackagePath(context);
        if (newPackagePath == null) {
            return;
        }
        System.out.println("--------- activatePackage B");

        final File newPackage = new File(newPackagePath);
        if (!newPackage.exists()) {
            return;
        }

        // remove the backup folder
        final File appBackupFolder = new File(context.getFilesDir().getPath() + "/app_backup");
        if (appBackupFolder.exists()) {
            if (!appBackupFolder.delete()) {
                return;
            }
        }

        // move /app to /app_backup
        final File appFolder = new File(context.getFilesDir().getPath() + "/app");

        if (appFolder.renameTo(appBackupFolder)) {
            // move /<package> to /app
            if (newPackage.renameTo(appFolder)) {
                // as long as the app wasn't restarted after a code push update, this key would exist to control JS behavior
                removePendingHash(context);
            } else {
                // next to impossible, but just to be sure:
                System.out.println("--- rename package to app failed");
                appBackupFolder.renameTo(appFolder);
            }
        }
    }

    private static String getCurrentPackagePath(final Context context) {
        final String currentHash = getCurrentHash(context);
        System.out.println("--- currentHash: " + currentHash);

        if (currentHash == null) {
            return null;
        }

        final String appStoreAppVersion = getAppVersionName(context);
        final String appStoreAppBuildTime = getApkBuildTime(context);
        final String codePushAppVersion = getCurrentAppVersion(context);
        final String codePushAppBuildTime = getCurrentAppBuildTime(context);

        if (appStoreAppVersion == null || appStoreAppBuildTime == null || codePushAppBuildTime == null || codePushAppVersion == null) {
            // this shouldn't happen, let's revert back to the appstore version
            removeCurrentHash(context);
            return null;
        }

        final boolean codePushPackageIsNewerThanAppStoreVersion =
                codePushAppBuildTime.equals(appStoreAppBuildTime) && codePushAppVersion.equals(appStoreAppVersion);

        if (codePushPackageIsNewerThanAppStoreVersion) {
            return context.getFilesDir().getPath() + "/CodePush/" + currentHash + "/app";
        } else {
            // let's use the AppStore version
            removeCurrentHash(context);
            return null;
        }
    }

    private static String getApkBuildTime(Context context) {
        try {
            return context.getString(context.getResources().getIdentifier(CODE_PUSH_APK_BUILD_TIME_KEY, "string", context.getPackageName()));
        } catch (Resources.NotFoundException e) {
            return null;
        }
    }

    private static String getAppVersionName(final Context context)  {
        try {
            return context.getPackageManager().getPackageInfo(context.getPackageName(), 0).versionName;
        } catch (PackageManager.NameNotFoundException e) {
            // this is next to impossible
            e.printStackTrace();
            return null;
        }
    }

    private static String getCurrentHash(final Context context) {
        return getPreferences(context)
                .getString(CODEPUSH_CURRENT_HASH_KEY, null);
    }

    private static String getCurrentAppVersion(final Context context) {
        return getPreferences(context)
                .getString(CODEPUSH_CURRENT_APPVERSION_KEY, null);
    }

    private static String getCurrentAppBuildTime(final Context context) {
        return getPreferences(context)
                .getString(CODEPUSH_CURRENT_APPBUILDTIME_KEY, null);
    }

    private static void removeCurrentHash(final Context context) {
        getPreferences(context)
                .edit()
                .remove(CODEPUSH_CURRENT_HASH_KEY)
                .apply();
    }

    private static void removePendingHash(final Context context) {
        getPreferences(context)
                .edit()
                .remove(CODEPUSH_PENDING_HASH_KEY)
                .apply();
    }

    private static SharedPreferences getPreferences(final Context context) {
        return context.getSharedPreferences(TNS_PREFERENCES_DB, Context.MODE_PRIVATE);
    }
}