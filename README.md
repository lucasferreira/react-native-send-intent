# react-native-send-intent

React Native Android module to use Android's Intent actions for send text to shareable apps or make phone calls or opening third party apps.

[![npm version](http://img.shields.io/npm/v/react-native-send-intent.svg?style=flat-square)](https://npmjs.org/package/react-native-send-intent "View this project on npm")
[![npm downloads](http://img.shields.io/npm/dm/react-native-send-intent.svg?style=flat-square)](https://npmjs.org/package/react-native-send-intent "View this project on npm")
[![npm licence](http://img.shields.io/npm/l/react-native-send-intent.svg?style=flat-square)](https://npmjs.org/package/react-native-send-intent "View this project on npm")
[![donate](https://img.shields.io/badge/Donate-PayPal-green.svg?style=flat-square)](https://www.paypal.com/donate?business=ZMAJTXD5HYWCQ&item_name=open-source+dev+react+native&currency_code=USD "If this project help you reduce time to develop, you can give me a cup of coffee ;)")

This module is useful when you need to share some text between apps in Android device and if you have a valid phone number make some call directly (if you ask for permission in AndroidManifest.xml).

E.g.: You have and short text and want to share in a SMS or Whatsapp.

### Installation

```bash
npm install react-native-send-intent --save
```

### Add it to your android project

- Automatically with:

```bash
react-native link react-native-send-intent
```

#### Manually

- In `android/setting.gradle`

```gradle
...
include ':RNSendIntentModule', ':app'
project(':RNSendIntentModule').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-send-intent/android')
```

- In `android/app/build.gradle`

```gradle
...
dependencies {
    ...
    compile project(':RNSendIntentModule')
}
```

- Register Module (in MainApplication.java)

```java
import com.burnweb.rnsendintent.RNSendIntentPackage;  // <--- import

public class MainApplication extends Application implements ReactApplication {
  ......

  @Override
  protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
            new MainReactPackage(),
            new RNSendIntentPackage()); // <------ add this line to your MainApplication class
  }

  ......

}
```

## Example / Usage of Text (Share)

```javascript
var SendIntentAndroid = require("react-native-send-intent");

SendIntentAndroid.sendText({
  title: "Please share this text",
  text: "Lorem ipsum dolor sit amet, per error erant eu, antiopam intellegebat ne sed",
  type: SendIntentAndroid.TEXT_PLAIN,
});
```

## Example / Usage of Send Mail (text/plain only)

```javascript
var SendIntentAndroid = require("react-native-send-intent");

SendIntentAndroid.sendMail("your@address.com", "Subject test", "Test body");
```

## Example / Usage of SMS

Thanks to @pedro ;)

```javascript
var SendIntentAndroid = require("react-native-send-intent");

SendIntentAndroid.sendSms("+55 48 9999-9999", "SMS body text here");
```

## Example / Usage of Phone Calls

It's very important ask for permission in your AndroidManifest.xml file if you need to use Phone Calls directly.
You can add an optional second parameter, to fix the default phone app.

Please add this line to your AndroidManifest.xml before using this example:

```xml
<uses-permission android:name="android.permission.CALL_PHONE" />
```

And them you can call in your JavaScript files:

```javascript
var SendIntentAndroid = require("react-native-send-intent");

SendIntentAndroid.sendPhoneCall("+55 48 9999-9999", true);
```

## Example / Usage of Phone Dial Screen

For this use you doesn't need to ask any permission.
You can add an optional second parameter, to fix the default phone app.

```javascript
var SendIntentAndroid = require("react-native-send-intent");

SendIntentAndroid.sendPhoneDial("+55 48 9999-9999", false);
```

## Example / Create Calendar Event

According to [Google](http://developer.android.com/guide/topics/providers/calendar-provider.html#intents) using Intents for
inserting, updating, and viewing calendar events is the preferred method. At this time only simple **recurrence** is
supported ['daily'|'weekly'|'monthly'|'yearly'].

Create a Calendar Event:

```javascript
// Create the Calendar Intent.
SendIntentAndroid.addCalendarEvent({
  title: "Go To The Park",
  description: "It's fun to play at the park.",
  startDate: "2016-01-25 10:00",
  endDate: "2016-01-25 11:00",
  recurrence: "weekly",
  location: "The Park",
});
```

## Example / Check if an application is installed

Check if Gmail app is intalled. Returns a promise with a boolean telling if the app is installed or not.

```javascript
SendIntentAndroid.isAppInstalled("com.google.android.gm").then(isInstalled => {});
```

## Example / Install a remote APK

This can be used to upgrade your APK from a custom source or install other apps.
No additional permissions are required.

```javascript
SendIntentAndroid.installRemoteApp("https://example.com/my-app.apk", "my-saved-app.apk").then(installWasStarted => {});
```

## Example / Open App

Open Gmail app. Returns a promise with a boolean telling if the app was opened or not:

```javascript
SendIntentAndroid.openApp("com.google.android.gm").then(wasOpened => {});

// You can also specify arbitrary intent extras to be passed to the app
SendIntentAndroid.openApp("com.mycorp.myapp", {
  "com.mycorp.myapp.reason": "just because",
  "com.mycorp.myapp.data": "must be a string",
}).then(wasOpened => {});
```

## Example / Open App with Data

Opens MX Player (Free) app and starts a video at the 1 minute mark.
Returns a promise with a boolean telling if the app was opened or not:

```javascript
SendIntentAndroid.openAppWithData(
  "com.mxtech.videoplayer.ad",
  "http://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_480p_surround-fix.avi",
  "video/*",
  {
    position: { type: "int", value: 60 },
  }
).then(wasOpened => {});
```

## Example / Open Chrome Intent

Opens Chrome intent as defined in https://developer.chrome.com/multidevice/android/intents

Returns a promise with a boolean.

True if: the intent was handled by an activity or the browser opened the `browser_fallback_url`

False if both conditions are not fulfilled

```javascript
SendIntentAndroid.openChromeIntent("intent://www.spm.com/qrlogin#Intent;scheme=https;package=example.package;S.browser_fallback_url=https://www.spm.com/download;end",
  }
).then((wasOpened) => {});
```

## Example / Open Calendar

```javascript
SendIntentAndroid.openCalendar();
```

## Example / Open Camera Intent

```javascript
SendIntentAndroid.openCamera();
```

## Example / Open Email Application

Will open default Email application

```javascript
SendIntentAndroid.openEmailApp();
```

Will open all the Email app's that available in device

```javascript
SendIntentAndroid.openAllEmailApp();
```

## Example / Open Download Manager

```javascript
SendIntentAndroid.openDownloadManager();
```

## Example / Open Share With dialog

Opens Androids default share tray:

```javascript
// Create Share With dialog.
SendIntentAndroid.openChooserWithOptions(
  {
    subject: "Story Title",
    text: "Message Body",
  },
  "Share Story"
);

SendIntentAndroid.openChooserWithOptions(
  {
    subject: "Video Title",
    videoUrl: "/path_or_url/to/video.mp4",
  },
  "Share video to"
);
```

## Example / Open Multiple Files Share With dialog

Opens Androids default share tray:

```javascript
// Create Multiple Files Share With dialog.
SendIntentAndroid.openChooserWithMultipleOptions(
  [
    {
      subject: "Video One Title",
      videoUrl: "/path_or_url/to/video.mp4",
    },
    {
      subject: "Video Two Title",
      videoUrl: "/path_or_url/to/video2.mp4",
    },
  ],
  "Share videos to"
);

SendIntentAndroid.openChooserWithMultipleOptions(
  [
    {
      subject: "Video Title",
      text: "Test shared with video",
    },
    {
      subject: "Video Title",
      videoUrl: "/path_or_url/to/video.mp4",
    },
  ],
  "Share video to"
);
```

## Example / Open Maps

Opens Androids default maps app with location:

```javascript
// Open Maps App
SendIntentAndroid.openMaps("Piccadilly Circus Station, London, United Kingdom");
```

## Example / Open Maps With Route

Opens Androids default maps app, and route path between your location and **address**:

mode: d,w,b

- d: drive car
- w: walking
- b: bicycle

```javascript
SendIntentAndroid.openMapsWithRoute("Piccadilly Circus Station, London, United Kingdom", "w");
```

## Example / Share text to line

```javascript
SendIntentAndroid.isAppInstalled("jp.naver.line.android").then(function (isInstalled) {
  if (!isInstalled) {
    //LINE has not install, you need to install it!
    return;
  }

  SendIntentAndroid.shareTextToLine({ text: "txt message that you want to share" });
});
```

When you call SendIntentAndroid.shareTextToLine this method, app will bring txt message to LINE, and you can select one or multiple friends to share.

## Example / Share Image to Instagram

```javascript
import { CameraRoll } from "react-native";

//get frist image from CameraRoll
CameraRoll.getPhotos({ first: 1 }).then(
  function (data) {
    const assets = data.edges;

    SendIntentAndroid.isAppInstalled("com.instagram.android").then(function (isInstalled) {
      if (!isInstalled) {
        //Instagram has not install
        return;
      }

      SendIntentAndroid.shareImageToInstagram("image/*", encodeURI(assets[0].node.image.uri));
    });
  },
  function (err) {
    console.error("An error occurred", err);
  }
);
```

Share your first image from CameraRoll to Instagram.

## Example / Open Settings

Opens a specified settings screen when passed one of the constant values available in `android.provider.settings` (use the constant value found [here](https://developer.android.com/reference/android/provider/Settings.html#ACTION_SECURITY_SETTINGS) to open the Security Settings screen).

```javascript
SendIntentAndroid.openSettings("android.settings.SECURITY_SETTINGS");
```

## Example / Get voiceMail number

Please add this line to your AndroidManifest.xml file before using next example:

```xml
  <uses-permission android:name="android.permission.READ_PHONE_STATE" />
```

```javascript
SendIntentAndroid.getVoiceMailNumber().then(voiceMailNumber => {
  if (!voiceMailNumber) {
    return console.error("Can`t get voiceMailNumber");
  }

  //if u want to use next line, u need to add CALL_PHONE permission
  SendIntentAndroid.sendPhoneCall(voiceMailNumber);
});
```

## Example / Open File Chooser

Opens Android chooser so the user can select which app will handle the file.

```javascript
SendIntentAndroid.openFileChooser(
  {
    subject: "File subject", //optional,
    fileUrl: "/path_or_url/to/file",
    type: "file_mimetype",
  },
  "Open file with:"
);
```

## Example / Open File Picker

Opens Android own file selector to get the selected file and callback path from Uri

```javascript
SendIntentAndroid.openFilePicker(
  {
    type: "file_mimetype", //default is "*/*"
    title: "selector title", //default is "Choose File"
  },
  filePath => {}
);
```

## Example / Get phone number

Please add these lines to your AndroidManifest.xml file before using next example:

```xml
  <uses-permission android:name="android.permission.READ_PHONE_STATE" />
  <uses-permission android:name="android.permission.READ_PHONE_NUMBERS" />
```

```javascript
SendIntentAndroid.getPhoneNumber().then(phoneNumber => {
  if (!phoneNumber) {
    return console.error("Can`t get phoneNumber");
  }

  //do something with number
});
```

## Example / Request 'ignore battery optimizations'

Please add this line to your AndroidManifest.xml file before using next example:

```xml
  <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"/>
```

Prompts the user to add your app to the Doze and App Standby optimizations exception white-list. Returns true if running on Android version M and greater, if the app is not on the white-list, and the intent was successfully shown. Will only show on Android version M and greater. For more details [look here](https://developer.android.com/training/monitoring-device-state/doze-standby#support_for_other_use_cases).

```javascript
SendIntentAndroid.requestIgnoreBatteryOptimizations().then(intentShown => {});
```

## Example / Show battery optimizations settings

Will only show on Android version M and greater. For more details [look here](https://developer.android.com/training/monitoring-device-state/doze-standby#support_for_other_use_cases).

```javascript
SendIntentAndroid.showIgnoreBatteryOptimizationsSettings();
```

## Donation

If this project help you reduce time to develop, you can give me a cup of coffee :)

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/donate?business=ZMAJTXD5HYWCQ&item_name=open-source+dev+react+native&currency_code=USD)

## License

MIT
