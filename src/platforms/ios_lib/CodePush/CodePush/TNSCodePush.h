#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

@interface TNSCodePush : NSObject

+ (NSString *_Nonnull)applicationPathWithDefault:(NSString *_Nonnull) defaultPath;

+ (void)unzipFileAtPath:(NSString *_Nonnull)path toDestination:(NSString *_Nullable)destination onProgress:(void (^_Nullable)(long entryNumber, long totalNumber))progressHandler onComplete:(void(^_Nullable)(NSString * _Nonnull path, BOOL succeeded, NSError * _Nullable error))completionHandler;

@end
