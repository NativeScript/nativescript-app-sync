#import "TNSAppSync.h"
#import "SSZipArchive.h"

@implementation TNSAppSync

+ (NSString *_Nonnull)applicationPathWithDefault:(NSString *_Nonnull) defaultPath {

    NSString* pack = [NSUserDefaults.standardUserDefaults stringForKey:@"APPSYNC_CURRENT_HASH"];
    if (pack != nil) {
        NSString* appSyncAppVersion = [NSUserDefaults.standardUserDefaults stringForKey:@"APPSYNC_CURRENT_APPVERSION"];
        NSString* appSyncAppBuildTime = [NSUserDefaults.standardUserDefaults stringForKey:@"APPSYNC_CURRENT_APPBUILDTIME"];
        
        if (appSyncAppBuildTime == nil || appSyncAppVersion == nil) {
            // this shouldn't happen, let's remove the hash and use the appstore version
            [NSUserDefaults.standardUserDefaults removeObjectForKey:@"APPSYNC_CURRENT_HASH"];
            
        } else {
            NSString* appStoreAppVersion = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
            NSString *appPlistPath = [[NSBundle mainBundle] pathForResource:nil ofType:@"plist"];
            NSDictionary *executableAttributes = [[NSFileManager defaultManager] attributesOfItemAtPath:appPlistPath error:nil];
            NSDate *applicationBuildTime = [executableAttributes objectForKey:@"NSFileModificationDate"];
            NSNumber* timestamp = [[NSNumber alloc] initWithDouble: floor([applicationBuildTime timeIntervalSince1970] * 1000)];
            NSString* appStoreAppBuildTime = timestamp.stringValue;
            
            BOOL appSyncPackageIsNewerThanAppStoreVersion =
                [appSyncAppBuildTime isEqualToString: appStoreAppBuildTime] && ([appSyncAppVersion isEqualToString: appStoreAppVersion] || [appSyncAppVersion compare:appStoreAppVersion options:NSNumericSearch] == NSOrderedDescending);
            
            if (appSyncPackageIsNewerThanAppStoreVersion) {
                NSString* docPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
                NSString* packageLocaction = [docPath stringByAppendingString:[@"/AppSync/" stringByAppendingString:pack]];
                
                // make sure the path exists before we assign it
                if ([[NSFileManager defaultManager] fileExistsAtPath:packageLocaction]) {
                    // as long as the app wasn't restarted after an AppSync update, this key would exist to control JS behavior
                    [NSUserDefaults.standardUserDefaults removeObjectForKey:@"APPSYNC_PENDING_HASH"];
                    return packageLocaction;
                }
            } else {
                // mark AppSync folder for cleanup and use the AppStore version
                [NSUserDefaults.standardUserDefaults setValue:@(YES) forKey:@"APPSYNC_CLEAN"];
                // let's do this here to make sure next time we don't get here in case the app cleanup doesn't run
                [NSUserDefaults.standardUserDefaults removeObjectForKey:@"APPSYNC_CURRENT_HASH"];
            }
        }
    }
    return defaultPath;
}

+ (void)unzipFileAtPath:(NSString *)path toDestination:(NSString *)destination onProgress:(void (^_Nullable)(long entryNumber, long totalNumber))progressHandler onComplete:(void(^)(NSString * _Nonnull path, BOOL succeeded, NSError * _Nullable error))completionHandler {

    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        [SSZipArchive unzipFileAtPath:(NSString *)path
                        toDestination:(NSString *)destination
                      progressHandler:^(NSString *entry, unz_file_info zipInfo, long entryNr, long totalNr) {
                          progressHandler(entryNr, totalNr);
                      }
                    completionHandler:completionHandler];
    });
}

+ (BOOL)copyEntriesInFolder:(NSString *)sourceFolder
                 destFolder:(NSString *)destFolder
                      error:(NSError **)error {

    NSArray *files = [[NSFileManager defaultManager]
                      contentsOfDirectoryAtPath:sourceFolder
                      error:error];
    if (!files) {
        return NO;
    }
    
    for (NSString *fileName in files) {
        NSString * fullFilePath = [sourceFolder stringByAppendingPathComponent:fileName];
        BOOL isDir = NO;
        if ([[NSFileManager defaultManager] fileExistsAtPath:fullFilePath
                                                 isDirectory:&isDir] && isDir) {
            NSString *nestedDestFolder = [destFolder stringByAppendingPathComponent:fileName];
            BOOL result = [self copyEntriesInFolder:fullFilePath
                                         destFolder:nestedDestFolder
                                              error:error];
            
            if (!result) {
                return NO;
            }
            
        } else {
            NSString *destFileName = [destFolder stringByAppendingPathComponent:fileName];
            if ([[NSFileManager defaultManager] fileExistsAtPath:destFileName]) {
                BOOL result = [[NSFileManager defaultManager] removeItemAtPath:destFileName error:error];
                if (!result) {
                    return NO;
                }
            }
            if (![[NSFileManager defaultManager] fileExistsAtPath:destFolder]) {
                BOOL result = [[NSFileManager defaultManager] createDirectoryAtPath:destFolder
                                                        withIntermediateDirectories:YES
                                                                         attributes:nil
                                                                              error:error];
                if (!result) {
                    return NO;
                }
            }
            
            BOOL result = [[NSFileManager defaultManager] copyItemAtPath:fullFilePath toPath:destFileName error:error];
            if (!result) {
                return NO;
            }
        }
    }
    return YES;
}

@end
