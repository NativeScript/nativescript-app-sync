#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

@interface TNSAppSync : NSObject

+ (NSString *_Nonnull)applicationPathWithDefault:(NSString *_Nonnull) defaultPath;

+ (void)unzipFileAtPath:(NSString *_Nonnull)path toDestination:(NSString *_Nullable)destination onProgress:(void (^_Nullable)(long entryNumber, long totalNumber))progressHandler onComplete:(void(^_Nullable)(NSString * _Nonnull path, BOOL succeeded, NSError * _Nullable error))completionHandler;

+ (BOOL)copyEntriesInFolder:(NSString *_Nonnull)sourceFolder
                 destFolder:(NSString *_Nonnull)destFolder
                      error:(NSError *_Nullable*_Nullable)error;

@end
