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
project(':RNSendIntentModule').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-send-intent')
```

* In `android/app/build.gradle`

```gradle
...
dependencies {
    ...
    compile project(':RNSendIntentModule')
}
```

* Register Module >= 0.18 (in MainActivity.java)

```java
import com.burnweb.rnsendintent.RNSendIntentPackage;  // <--- import

public class MainActivity extends ReactActivity {
  ......

  @Override
  protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
            new MainReactPackage(),
            new RNSendIntentPackage()); // <------ add this line to your MainActivity class
  }

  ......

}
```

* Register Module <= 0.17 (in MainActivity.java)

```java
import com.burnweb.rnsendintent.RNSendIntentPackage;  // <--- import

public class MainActivity extends Activity implements DefaultHardwareBackBtnHandler {
  ......

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    mReactRootView = new ReactRootView(this);

    mReactInstanceManager = ReactInstanceManager.builder()
      .setApplication(getApplication())
      .setBundleAssetName("index.android.bundle")
      .setJSMainModuleName("index.android")
      .addPackage(new MainReactPackage())
      .addPackage(new RNSendIntentPackage()) // <------ add this line to your MainActivity class
      .setUseDeveloperSupport(BuildConfig.DEBUG)
      .setInitialLifecycleState(LifecycleState.RESUMED)
      .build();

    mReactRootView.startReactApplication(mReactInstanceManager, "AndroidRNSample", null);

    setContentView(mReactRootView);
  }

  ......

}
```

## Example / Usage of Text
```javascript
var SendIntentAndroid = require('react-native-send-intent');

SendIntentAndroid.sendText({
  title: 'Please share this text',
  text: 'Lorem ipsum dolor sit amet, per error erant eu, antiopam intellegebat ne sed',
  type: SendIntentAndroid.TEXT_PLAIN
});
```

## Example / Usage of SMS
Thanks to @pedro ;)

```javascript
var SendIntentAndroid = require('react-native-send-intent');

SendIntentAndroid.sendSms('+55 48 9999-9999', 'SMS body text here');

```

You can now also send an array of numbers to send a sms to multiple recipients:

```javascript

//Or pass sendSms and array of numbers/recipients and don´t forget the join(',')
const recipients = ['+55 48 9999-9999','+55 48 8888-8888'];

SendIntentAndroid.sendSms(recipients.join(','), 'SMS body text here');

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
  recurrence: 'weekly'
});
```

## Example / Open Calendar

```javascript
SendIntentAndroid.openCalendar();
```

## License
MIT
