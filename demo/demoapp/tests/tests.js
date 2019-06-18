var AppSync = require("nativescript-app-sync").AppSync;
var SyncStatus = require("nativescript-app-sync").SyncStatus;

describe("sync function", function() {
  it("exists", function() {
    expect(AppSync.sync).toBeDefined();
  });

  it("expects a deploymentKey to be passed in", function (done) {
    try {
      AppSync.sync({});
      fail("Should have thrown an errot due to a missing deploymentKey");
    } catch (error) {
      expect(error).toEqual(new Error("Missing deploymentKey, pass it as part of the first parameter of the 'sync' function: { deploymentKey: 'your-key' }"));
      done();
    }
  });

  it("expects a valid deploymentKey to be passed in", function (done) {
    AppSync.sync({deploymentKey: "invalid"}, function (syncStatus) {
      if (syncStatus === SyncStatus.ERROR) {
        // note that the details are logged to the console
        done();
      }
    });
  });

  it("reports both 'checking for update' and 'error'", function (done) {
    var feedbackCount = 0;
    AppSync.sync({deploymentKey: "abc"}, function (syncStatus) {
      if (syncStatus === SyncStatus.CHECKING_FOR_UPDATE || syncStatus === SyncStatus.ERROR) {
        if (++feedbackCount === 2) {
          done();
        }
      }
    });
  });

  it("ignores simultaneously being invoked", function (done) {
    var feedbackCount = 0;
    AppSync.sync({deploymentKey: "abc"}, function (syncStatus) {
      if (syncStatus === SyncStatus.CHECKING_FOR_UPDATE || syncStatus === SyncStatus.ERROR) {
        if (++feedbackCount === 3) {
          done();
        }
      }
    });
    AppSync.sync({deploymentKey: "abc"}, function (syncStatus) {
      if (syncStatus === SyncStatus.IN_PROGRESS) {
        if (++feedbackCount === 3) {
          done();
        }
      }
    });
  });
});