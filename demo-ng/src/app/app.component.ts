import { Component } from "@angular/core";
import { CodePush, InstallMode, SyncStatus } from "nativescript-code-push";
import * as application from "tns-core-modules/application";
import { isIOS } from "tns-core-modules/platform";

@Component({
    selector: "ns-app",
    moduleId: module.id,
    templateUrl: "./app.component.html"
})
export class AppComponent {
    private static CODEPUSH_IOS_STAGING_KEY = "HnJO7RAlCf3KcEcJ71I2nlRbMKxT4ksvOXqog";
    private static CODEPUSH_IOS_PRODUCTION_KEY = "oCG3BNlt4r9YQrREMiXMT6vBpWIt4ksvOXqog";

    private static CODEPUSH_ANDROID_STAGING_KEY = "mwrmt9OadOm6YRQrHp25GfyUX6OW4ksvOXqog";
    private static CODEPUSH_ANDROID_PRODUCTION_KEY = "Qf12yqIIbNoKhL3JLNSHwtP0Bm994ksvOXqog";

    constructor() {
        // Check for updates when the app is loaded or resumed
        application.on(application.resumeEvent, () => {
            this.syncWithCodePushServer();
        });
    }

    private syncWithCodePushServer(): void {
        console.log("Querying CodePush..");
        CodePush.sync({
            deploymentKey: isIOS ? AppComponent.CODEPUSH_IOS_STAGING_KEY : AppComponent.CODEPUSH_ANDROID_STAGING_KEY,
            installMode: InstallMode.ON_NEXT_RESTART, // default InstallMode.ON_NEXT_RESTART
            mandatoryInstallMode: isIOS ? InstallMode.ON_NEXT_RESUME : InstallMode.IMMEDIATE, // default InstallMode.ON_NEXT_RESUME
            updateDialog: { // only used for InstallMode.IMMEDIATE
                optionalUpdateMessage: "Optional update msg",
                updateTitle: "Please restart the app",
                mandatoryUpdateMessage: "Mandatory update msg",
                optionalIgnoreButtonLabel: "Later",
                mandatoryContinueButtonLabel: isIOS ? "Exit now" : "Restart now",
                appendReleaseDescription: true // appends the description you (optionally) provided when releasing a new version to CodePush
            }
        }, (syncStatus: SyncStatus): void => {
            if (syncStatus === SyncStatus.UP_TO_DATE) {
                console.log("CodePush: up to date");
            } else if (syncStatus === SyncStatus.UPDATE_INSTALLED) {
                console.log("CodePush: update installed");
            }
        });
    }
}
