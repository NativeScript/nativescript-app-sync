Custom AppSync framework for Android apps.

Using this wrapper to more easily copy some files around and (optionally) move stuff to a background thread.

### Building the framework
- Clone this repo
- Start Android Studio and pick "Open an existing Android Studio project" ➡️ `{this repo}/src/platforms/android_lib`
- Update the `/src/main` folder as needed
- Open the Gradle toolwindow
- Run tnsappsync > Tasks > build > build
- The (release) .aar will be generated in tnsappsync/build/outputs/aar
- Copy that to the platforms/android folder, replacing the old .aar
- Commit and push the changes as usual