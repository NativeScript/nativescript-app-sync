import { Component } from "@angular/core";
import { AppSync, InstallMode, SyncStatus } from "nativescript-app-sync";
import * as application from "tns-core-modules/application";
import { isIOS } from "tns-core-modules/platform";

@Component({
    selector: "ns-app",
    moduleId: module.id,
    templateUrl: "./app.component.html"
})
export class AppComponent {

    private static APPSYNC_IOS_STAGING_KEY = "XongXpPmtsKt7WFmnKmHOK1b9M7H4ksvOXqog";
    private static APPSYNC_IOS_PRODUCTION_KEY = "4KnhNcAwzwPR3rePHtf9guBsUF5W4ksvOXqog";

    private static APPSYNC_ANDROID_STAGING_KEY = "4XoWtNu9usFBjrZv7CUtL8RNdbX44ksvOXqog";
    private static APPSYNC_ANDROID_PRODUCTION_KEY = "jjQhiRNQO1zj2i2flmkIlXtbnB7q4ksvOXqog";

    constructor() {
        // Check for updates when the app is loaded or resumed
        application.on(application.resumeEvent, () => {
            this.syncWithAppSyncServer();
        });
    }

    private syncWithAppSyncServer(): void {
        console.log("Querying AppSync..");
        AppSync.sync({
            deploymentKey: isIOS ? AppComponent.APPSYNC_IOS_STAGING_KEY : AppComponent.APPSYNC_ANDROID_STAGING_KEY,
            installMode: InstallMode.ON_NEXT_RESTART, // default InstallMode.ON_NEXT_RESTART
            mandatoryInstallMode: isIOS ? InstallMode.ON_NEXT_RESUME : InstallMode.IMMEDIATE, // default InstallMode.ON_NEXT_RESUME
            updateDialog: { // only used for InstallMode.IMMEDIATE
                optionalUpdateMessage: "Optional update msg",
                updateTitle: "Please restart the app",
                mandatoryUpdateMessage: "Mandatory update msg",
                optionalIgnoreButtonLabel: "Later",
                mandatoryContinueButtonLabel: isIOS ? "Exit now" : "Restart now",
                appendReleaseDescription: true // appends the description you (optionally) provided when releasing a new version to AppSync
            }
        }, (syncStatus: SyncStatus): void => {
            if (syncStatus === SyncStatus.UP_TO_DATE) {
                console.log("AppSync: up to date");
            } else if (syncStatus === SyncStatus.UPDATE_INSTALLED) {
                console.log("AppSync: update installed");
            } else {
                console.log("AppSync: sync status: " + syncStatus);
            }
        });
    }
}
