declare class TNSAppSync extends NSObject {

  static alloc(): TNSAppSync; // inherited from NSObject

  static applicationPathWithDefault(defaultPath: string): string;

  static copyEntriesInFolderDestFolderError(sourceFolder: string, destFolder: string): boolean;

  static new(): TNSAppSync; // inherited from NSObject

  static unzipFileAtPathToDestinationOnProgressOnComplete(path: string, destination: string, progressHandler: (p1: number, p2: number) => void, completionHandler: (p1: string, p2: boolean, p3: NSError) => void): void;
}