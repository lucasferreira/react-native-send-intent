# react-native-send-intent
React Native Android module to use Android's Intent actions for send text to shareable apps or make phone calls.

[![npm version](http://img.shields.io/npm/v/react-native-send-intent.svg?style=flat-square)](https://npmjs.org/package/react-native-send-intent "View this project on npm")
[![npm downloads](http://img.shields.io/npm/dm/react-native-send-intent.svg?style=flat-square)](https://npmjs.org/package/react-native-send-intent "View this project on npm")
[![npm licence](http://img.shields.io/npm/l/react-native-send-intent.svg?style=flat-square)](https://npmjs.org/package/react-native-send-intent "View this project on npm")


This module is useful when you need to share some text between apps in Android device and if you have a valid phone number make some call directly (if you ask for permission in AndroidManifest.xml).

E.g.: You have and short text and want to share in a SMS or Whatsapp.

### Installation

```bash
npm install react-native-send-intent --save
```

### Add it to your android project

* In `android/setting.gradle`

```gradle
...
include ':RNSendIntentModule', ':app'
project(':RNSendIntentModule').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-send-intent/android')
```

* In `android/app/build.gradle`

```gradle
...
dependencies {
    ...
    compile project(':RNSendIntentModule')
}
```

* Register Module >= 0.29 (in MainApplication.java)

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

If you need to see the install instructions for older React Native versions [look here](https://github.com/lucasferreira/react-native-send-intent/blob/react-native-older/README.md).


## Example / Usage of Text (Share)
```javascript
var SendIntentAndroid = require('react-native-send-intent');

SendIntentAndroid.sendText({
  title: 'Please share this text',
  text: 'Lorem ipsum dolor sit amet, per error erant eu, antiopam intellegebat ne sed',
  type: SendIntentAndroid.TEXT_PLAIN
});
```

## Example / Usage of Send Mail (text/plain only)
```javascript
var SendIntentAndroid = require('react-native-send-intent');

SendIntentAndroid.sendMail("your@address.com", "Subject test", "Test body");

## Example / Usage of SMS
Thanks to @pedro ;)

```javascript
var SendIntentAndroid = require('react-native-send-intent');

SendIntentAndroid.sendSms('+55 48 9999-9999', 'SMS body text here');
```

## Example / Usage of Phone Calls
It's very important ask for permission in your AndroidManifest.xml file if you need to use Phone Calls directly.

Please add this line to your XML before using this example:

```xml
<uses-permission android:name="android.permission.CALL_PHONE" />
```

And them you can call in your JavaScript files:

```javascript
var SendIntentAndroid = require('react-native-send-intent');

SendIntentAndroid.sendPhoneCall('+55 48 9999-9999');
```

## Example / Usage of Phone Dial Screen
For this use you doesn't need to ask any permission.

```javascript
var SendIntentAndroid = require('react-native-send-intent');

SendIntentAndroid.sendPhoneDial('+55 48 9999-9999');
```

## Example / Create Calendar Event

According to [Google](http://developer.android.com/guide/topics/providers/calendar-provider.html#intents) using Intents for
 inserting, updating, and viewing calendar events is the preferred method.  At this time only simple **recurrence** is
 supported ['daily'|'weekly'|'monthly'|'yearly'].

Create a Calendar Event:

```javascript
// Create the Calendar Intent.
SendIntentAndroid.addCalendarEvent({
  title: 'Go To The Park',
  description: "It's fun to play at the park.",
  startDate: '2016-01-25 10:00',
  endDate: '2016-01-25 11:00',
  recurrence: 'weekly',
  location: 'The Park'
});
```

## Example / Open Calendar

```javascript
SendIntentAndroid.openCalendar();
```

## Example / Open Share With dialog

Opens Androids default share tray
```javascript
  // Create Share With dialog.
  SendIntentAndroid.openChooserWithOptions({
    subject: 'Story Title',
    text: 'Message Body'
  }, 'Share Story');
```

## License
MIT
