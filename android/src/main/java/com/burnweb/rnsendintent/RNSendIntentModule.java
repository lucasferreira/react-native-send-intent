package com.burnweb.rnsendintent;

import android.app.Activity;
import android.content.Intent;
import android.content.ComponentName;
import android.provider.CalendarContract;
import android.provider.CalendarContract.Calendars;
import android.provider.CalendarContract.Events;
import android.os.Environment;
import android.util.Log;
import android.net.Uri;
import android.telephony.TelephonyManager;
import android.content.Context;

import java.util.Map;
import java.util.HashMap;
import java.util.Calendar;
import java.util.Arrays;
import java.lang.SecurityException;
import java.text.SimpleDateFormat;
import java.text.ParseException;
import java.io.File;
import java.io.IOException;
import java.io.FileNotFoundException;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;

import okhttp3.OkHttpClient;
import okhttp3.Call;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

import okio.Okio;
import okio.BufferedSink;
import okio.BufferedSource;

public class RNSendIntentModule extends ReactContextBaseJavaModule {

    private static final String TAG = RNSendIntentModule.class.getSimpleName();

    private static final String TEXT_PLAIN = "text/plain";
    private static final String TEXT_HTML = "text/html";
    private static final String[] VALID_RECURRENCE = { "DAILY", "WEEKLY", "MONTHLY", "YEARLY"};


    private ReactApplicationContext reactContext;

    public RNSendIntentModule(ReactApplicationContext reactContext) {
      super(reactContext);
      this.reactContext = reactContext;
    }

    @Override
    public String getName() {
      return "SendIntentAndroid";
    }

    @Override
    public Map<String, Object> getConstants() {
      final Map<String, Object> constants = new HashMap<>();
      constants.put("TEXT_PLAIN", TEXT_PLAIN);
      constants.put("TEXT_HTML", TEXT_HTML);
      return constants;
    }

    @ReactMethod
    public void getVoiceMailNumber(final Promise promise) {
      TelephonyManager tm =(TelephonyManager)this.reactContext.getSystemService(Context.TELEPHONY_SERVICE);
      promise.resolve(tm.getVoiceMailNumber());
    }

    private Intent getSendIntent(String text, String type) {
      Intent sendIntent = new Intent();
      sendIntent.setAction(Intent.ACTION_SEND);
      sendIntent.putExtra(Intent.EXTRA_TEXT, text);
      sendIntent.setType(type);
      sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

      return sendIntent;
    }

    @ReactMethod
    public void openCamera() {
      //Needs permission "android.permission.CAMERA"
      Intent sendIntent = new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);
      sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
          this.reactContext.startActivity(sendIntent);
      }
    }

    @ReactMethod
    public void sendPhoneCall(String phoneNumberString) {
      //Needs permission "android.permission.CALL_PHONE"
      Intent sendIntent = new Intent(Intent.ACTION_CALL, Uri.parse("tel:" + phoneNumberString.replaceAll("#", "%23").trim()));
      sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

      //Check that an app exists to receive the intent
      if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
        try {
          this.reactContext.startActivity(sendIntent);
        } catch(SecurityException ex) {
          Log.d(TAG, ex.getMessage());

          this.sendPhoneDial(phoneNumberString);
        }
      }
    }

    @ReactMethod
    public void sendPhoneDial(String phoneNumberString) {
      Intent sendIntent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + phoneNumberString.trim()));
      sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

      //Check that an app exists to receive the intent
      if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
        this.reactContext.startActivity(sendIntent);
      }
    }

    @ReactMethod
    public void sendSms(String phoneNumberString, String body) {
      Intent sendIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("sms:" + phoneNumberString.trim()));
      sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

      if (body != null) {
        sendIntent.putExtra("sms_body", body);
      }

      //Check that an app exists to receive the intent
      if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
        this.reactContext.startActivity(sendIntent);
      }
    }

    @ReactMethod
    public void sendMail(String recepientString, String subject, String body) {
      String uriText = "mailto:" + Uri.encode(recepientString) +
            "?body=" + Uri.encode(body) +
            "&subject=" + Uri.encode(subject);

      Intent sendIntent = new Intent(Intent.ACTION_SENDTO, Uri.parse(uriText));
      sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

      //Check that an app exists to receive the intent
      if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
        this.reactContext.startActivity(sendIntent);
      }
    }

    @ReactMethod
    public void sendText(String text, String type) {
      final Intent sendIntent = this.getSendIntent(text, type);
      //Check that an app exists to receive the intent
      if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
        this.reactContext.runOnUiQueueThread(new Runnable(){
            public void run(){
                reactContext.startActivity(sendIntent);
            }
        });
      }
    }

    @ReactMethod
    public void sendTextWithTitle(final String title, String text, String type) {
      final Intent sendIntent = this.getSendIntent(text, type);

      //Check that an app exists to receive the intent
      if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
        this.reactContext.runOnUiQueueThread(new Runnable(){
            public void run(){
                Intent ni = Intent.createChooser(sendIntent, title);
                ni.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(ni);
            }
        });
      }
    }

    @ReactMethod
    public void addCalendarEvent(String title, String description, String startDate, String endDate, String recurrence, String location, Boolean isAllDay) {

      Calendar startCal = Calendar.getInstance();
      SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");
      try {
          startCal.setTime(sdf.parse(startDate));
      } catch (ParseException e) {
          e.printStackTrace();
      }

      Calendar endCal = Calendar.getInstance();
      try {
          endCal.setTime(sdf.parse(endDate));
      } catch (ParseException e) {
          e.printStackTrace();
      }

      Intent sendIntent = new Intent(Intent.ACTION_INSERT)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          .setData(Events.CONTENT_URI)
          .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, startCal.getTimeInMillis())
          .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, endCal.getTimeInMillis())
          .putExtra(CalendarContract.EXTRA_EVENT_ALL_DAY, isAllDay)
          .putExtra(Events.TITLE, title)
          .putExtra(Events.DESCRIPTION, description)
          .putExtra(Events.EVENT_LOCATION, location);

      if (Arrays.asList(VALID_RECURRENCE).contains(recurrence.toUpperCase())) {
          sendIntent.putExtra(Events.RRULE, "FREQ=" + recurrence.toUpperCase());
      }

      if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
          this.reactContext.startActivity(sendIntent);
      }
    }

    @ReactMethod
    public void isAppInstalled(String packageName, final Promise promise) {
        Intent sendIntent = this.reactContext.getPackageManager().getLaunchIntentForPackage(packageName);
        if (sendIntent == null) {
            promise.resolve(false);
            return;
        }

        promise.resolve(true);
    }

    @ReactMethod
    public void installRemoteApp(final String uri, final String saveAs, final Promise promise) {
      final File file = new File(this.reactContext.getExternalFilesDir(null), saveAs);

      final Request request = new Request.Builder().url(uri).build();
      new OkHttpClient()
      .newCall(request)
      .enqueue(new okhttp3.Callback() {
        @Override
        public void onFailure(final Call call, final IOException e) {
          e.printStackTrace();
          promise.resolve(false);
        }

        private void saveFile(final ResponseBody body) throws IOException, FileNotFoundException {
          final BufferedSource source = body.source();
          final BufferedSink sink = Okio.buffer(Okio.sink(file));

          sink.writeAll(source);

          sink.flush();
          sink.close();
          source.close();
        }

        @Override
        public void onResponse(final Call call, final Response response) {
          if(!response.isSuccessful()) {
            promise.resolve(false);
            return;
          }

          try (final ResponseBody body = response.body()) {
            saveFile(body);

            final Intent intent = new Intent(Intent.ACTION_VIEW)
                                  .setDataAndType(Uri.fromFile(file), "application/vnd.android.package-archive");
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);

            reactContext.startActivity(intent);

            promise.resolve(true);
          }
          catch (final Exception e) {
            e.printStackTrace();
            promise.resolve(false);
          }
        }
      });
    }

    @ReactMethod
    public void openApp(String packageName, ReadableMap extras, final Promise promise) {
        Intent sendIntent = this.reactContext.getPackageManager().getLaunchIntentForPackage(packageName);
        if (sendIntent == null) {
            promise.resolve(false);
            return;
        }

        final ReadableMapKeySetIterator it = extras.keySetIterator();
        while(it.hasNextKey()) {
          final String key = it.nextKey();
          final String value = extras.getString(key);
          sendIntent.putExtra(key, value);
        }

        sendIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        this.reactContext.startActivity(sendIntent);
        promise.resolve(true);
    }

    @ReactMethod
    public void openCalendar() {
      ComponentName cn = new ComponentName("com.android.calendar", "com.android.calendar.LaunchActivity");

      Intent sendIntent = new Intent()
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          .setType("vnd.android.cursor.item/event");

      if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
          this.reactContext.startActivity(sendIntent);
      }
    }

    @ReactMethod
    public void openChooserWithOptions(ReadableMap options, String title) {

        Intent intent = new Intent(Intent.ACTION_SEND);

        if (options.hasKey("subject")) {
            intent.putExtra(Intent.EXTRA_SUBJECT, options.getString("subject"));
        }

        if (options.hasKey("text")) {
            intent.putExtra(Intent.EXTRA_TEXT, options.getString("text"));
        }

        if (options.hasKey("imageUrl")) {
            Uri uri = Uri.parse(options.getString("imageUrl"));
            intent.putExtra(Intent.EXTRA_STREAM, uri);
            intent.setType("image/*");
        } else if (options.hasKey("videoUrl")) {
            File media = new File(options.getString("videoUrl"));
            Uri uri = Uri.fromFile(media);
            if(!options.hasKey("subject")) {
              intent.putExtra(Intent.EXTRA_SUBJECT,"Untitled_Video");
            }
            intent.putExtra(Intent.EXTRA_STREAM, uri);
            intent.setType("video/*");
        } else {
            intent.setType("text/plain");
        }

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        Activity currentActivity = getCurrentActivity();
        if (currentActivity != null) {
            currentActivity.startActivity(Intent.createChooser(intent, title));
        }
    }

    @ReactMethod
    public void openMaps(String query) {
      Uri gmmIntentUri = Uri.parse("geo:0,0?q="+query);
      Intent sendIntent = new Intent(android.content.Intent.ACTION_VIEW, gmmIntentUri);
      sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

      //Check that an app exists to receive the intent
      if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
        this.reactContext.startActivity(sendIntent);
      }
    }

    @ReactMethod
    public void openMapsWithRoute(String query, String mode) {
        Uri gmmIntentUri = Uri.parse("google.navigation:q="+query+"&mode="+mode);

        Intent sendIntent = new Intent(android.content.Intent.ACTION_VIEW, gmmIntentUri);
        sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        //Check that an app exists to receive the intent
        if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
            this.reactContext.startActivity(sendIntent);
        }
    }


    @ReactMethod
    public void shareTextToLine(ReadableMap options) {

        ComponentName cn = new ComponentName("jp.naver.line.android"
                , "jp.naver.line.android.activity.selectchat.SelectChatActivity");
        Intent shareIntent = new Intent();
        shareIntent.setAction(Intent.ACTION_SEND);
        shareIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        shareIntent.setType("text/plain");

        if (options.hasKey("text")) {
            shareIntent.putExtra(Intent.EXTRA_TEXT, options.getString("text"));
        }

        shareIntent.setComponent(cn);
        this.reactContext.startActivity(shareIntent);

    }


    @ReactMethod
    public void shareImageToInstagram(String mineType, String mediaPath) {

        Intent sendIntent = new Intent();
        sendIntent.setPackage("com.instagram.android");
        sendIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        sendIntent.setAction(Intent.ACTION_SEND);
        sendIntent.setType(mineType);

        Uri uri = Uri.parse(mediaPath);
        sendIntent.putExtra(Intent.EXTRA_STREAM, uri);

        this.reactContext.startActivity(sendIntent);

    }

    @ReactMethod
    public void openSettings(String screenName) {
        Intent settingsIntent = new Intent(screenName);
        settingsIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        if (settingsIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
            this.reactContext.startActivity(settingsIntent);
        }
    }

}
