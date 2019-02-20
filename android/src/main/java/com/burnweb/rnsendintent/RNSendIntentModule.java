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
import android.os.Build;
import android.support.v4.content.FileProvider;
import android.telephony.TelephonyManager;
import android.content.Context;

import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
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
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableType;
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

    @ReactMethod
    public void getPhoneNumber(final Promise promise) {
      TelephonyManager tm =(TelephonyManager)this.reactContext.getSystemService(Context.TELEPHONY_SERVICE);
      promise.resolve(tm.getLine1Number());
    }

    private Intent getSendIntent(String text, String type) {
      Intent sendIntent = new Intent();
      sendIntent.setAction(Intent.ACTION_SEND);
      sendIntent.putExtra(Intent.EXTRA_TEXT, text);
      sendIntent.setType(type);
      sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

      return sendIntent;
    }

    private boolean parseExtras(ReadableMap extras, Intent intent) {
        ReadableMapKeySetIterator it = extras.keySetIterator();

        while(it.hasNextKey()) {
            String key = it.nextKey();
            ReadableType type = extras.getType(key);
            
            switch (type) {
                case Boolean:
                    intent.putExtra(key, extras.getBoolean(key));
                    break;
                case Map:
                    //because in js, there is no distinction between double, int, short, etc. we use an object indicating the type
                    ReadableMap map = extras.getMap(key);
                    if (map.hasKey("type")) {
                        String actualType = map.getString("type").toLowerCase();
                        switch (actualType) {
                            case "int":
                                intent.putExtra(key, map.getInt("value"));
                                break;
                            case "short":
                                intent.putExtra(key, (short)map.getInt("value"));
                                break;
                            case "byte":
                                intent.putExtra(key, (byte)map.getInt("value"));
                                break;
                            case "char":
                                intent.putExtra(key, (char)map.getInt("value"));
                                break;
                            case "long":
                                intent.putExtra(key, (long)map.getDouble("value"));
                                break;
                            case "float":
                                intent.putExtra(key, (float)map.getDouble("value"));
                                break;
                            case "double":
                                intent.putExtra(key, map.getDouble("value"));
                                break;
                        }
                    }
                    else { //not parsing real maps for now
                        return false;
                    }
                    break;
                case Number:
                    intent.putExtra(key, (double) extras.getDouble(key));
                    break;
                case String:
                    intent.putExtra(key, extras.getString(key));
                    break;
                case Array:
                    ReadableArray array = extras.getArray(key);
                    if (array.size() == 0) { //cannot guess the type of an empty array
                        return false;
                    }

                    //try to infer the type of the array from the first element
                    ReadableType arrayType = array.getType(0);
                    switch (arrayType) {
                        case Boolean:
                            boolean[] bArray = new boolean[array.size()];
                            for (int i = 0; i < array.size(); ++i)
                                bArray[i] = array.getBoolean(i);
                            intent.putExtra(key, bArray);
                            break;
                        case Map:
                            ReadableMap aMap = extras.getMap(key);
                            if (aMap.hasKey("type")) {
                                String actualType = aMap.getString("type").toLowerCase();
                                switch (actualType) {
                                    case "int":
                                        int[] iArray = new int[array.size()];
                                        for (int i = 0; i < array.size(); ++i)
                                            iArray[i] = array.getInt(i);
                                        intent.putExtra(key, iArray);
                                        break;
                                    case "short":
                                        short[] shArray = new short[array.size()];
                                        for (int i = 0; i < array.size(); ++i)
                                            shArray[i] = (short)array.getInt(i);
                                        intent.putExtra(key, shArray);
                                        break;
                                    case "byte":
                                        byte[] byArray = new byte[array.size()];
                                        for (int i = 0; i < array.size(); ++i)
                                            byArray[i] = (byte)array.getInt(i);
                                        intent.putExtra(key, byArray);
                                        break;
                                    case "char":
                                        char[] cArray = new char[array.size()];
                                        for (int i = 0; i < array.size(); ++i)
                                            cArray[i] = (char)array.getInt(i);
                                        intent.putExtra(key, cArray);
                                        break;
                                    case "long":
                                        long[] lArray = new long[array.size()];
                                        for (int i = 0; i < array.size(); ++i)
                                            lArray[i] = (long)array.getInt(i);
                                        intent.putExtra(key, lArray);
                                        break;
                                    case "float":
                                        float[] fArray = new float[array.size()];
                                        for (int i = 0; i < array.size(); ++i)
                                            fArray[i] = (float)array.getDouble(i);
                                        intent.putExtra(key, fArray);
                                        break;
                                    case "double":
                                        double[] doArray = new double[array.size()];
                                        for (int i = 0; i < array.size(); ++i)
                                            doArray[i] = array.getDouble(i);
                                        intent.putExtra(key, doArray);
                                        break;
                                }
                            }
                            else { //not parsing real maps for now
                                return false;
                            }
                            break;
                        case Number:
                            double[] dArray = new double[array.size()];
                            for (int i = 0; i < array.size(); ++i)
                                dArray[i] = array.getDouble(i);
                            intent.putExtra(key, dArray);
                            break;
                        case String:
                            String[] sArray = new String[array.size()];
                            for (int i = 0; i < array.size(); ++i)
                                sArray[i] = array.getString(i);
                            intent.putExtra(key, sArray);
                            break;
                    }

                    break;
                  //ignore everything else
            }
        }

        return true;
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
    public void sendPhoneCall(String phoneNumberString, Boolean phoneAppOnly) {
      //Needs permission "android.permission.CALL_PHONE"
      Intent sendIntent = new Intent(Intent.ACTION_CALL, Uri.parse("tel:" + phoneNumberString.replaceAll("#", "%23").trim()));
      sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      if (phoneAppOnly) {
          sendIntent.setPackage("com.android.server.telecom");
      }

      //Check that an app exists to receive the intent
      if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
        try {
          this.reactContext.startActivity(sendIntent);
        } catch(SecurityException ex) {
          Log.d(TAG, ex.getMessage());

          this.sendPhoneDial(phoneNumberString, phoneAppOnly);
        }
      }
    }

    @ReactMethod
    public void sendPhoneDial(String phoneNumberString, Boolean phoneAppOnly) {
      Intent sendIntent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + phoneNumberString.trim()));
      sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      if (phoneAppOnly) {
          sendIntent.setPackage("com.android.server.telecom");
      }

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

        if (!parseExtras(extras, sendIntent)) {
            promise.resolve(false);
            return;
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
    public void openChooserWithMultipleOptions(ReadableArray option, String title) {

        ArrayList<Object> readable = option.toArrayList();
        Intent intent = new Intent(Intent.ACTION_SEND_MULTIPLE);
 
          String name = Intent.EXTRA_TEXT;
          ArrayList<Object> values = new ArrayList<>();

          for(int i = 0; i < option.size(); i++){
            ReadableMap options = option.getMap(i);

            if (options.hasKey("subject")) {
                intent.putExtra(Intent.EXTRA_SUBJECT, options.getString("subject"));
            }
            if (options.hasKey("text")) {
                intent.putExtra(Intent.EXTRA_TEXT, options.getString("text"));
            }

            if (options.hasKey("imageUrl")) {
                Uri uri = Uri.parse(options.getString("imageUrl"));
                name = Intent.EXTRA_STREAM;
                values.add(uri);
                intent.setType("image/*");
            } else if (options.hasKey("videoUrl")) {
                File media = new File(options.getString("videoUrl"));
                Uri uri = Uri.fromFile(media);
                if(!options.hasKey("subject")) {
                  intent.putExtra(Intent.EXTRA_SUBJECT,"Untitled_Video");
                }
                name = Intent.EXTRA_STREAM;
                values.add(uri);
                intent.setType("video/*");
            } else {
                intent.setType("text/plain");
            }
        }

        intent.putExtra(name, values);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        Activity currentActivity = getCurrentActivity();
        if (currentActivity != null) {
            currentActivity.startActivity(Intent.createChooser(intent, title));
        }
    }

    @ReactMethod
    public void openAppWithData(String packageName, String dataUri, String mimeType, ReadableMap extras, final Promise promise) {
        Uri uri = Uri.parse(dataUri);
        Intent sendIntent = new Intent(Intent.ACTION_VIEW);
        if (mimeType != null)
            sendIntent.setDataAndType(uri, mimeType);
        else
            sendIntent.setData(uri);
        
        sendIntent.setPackage(packageName);
        
        if (!parseExtras(extras, sendIntent)) {
            promise.resolve(false);
            return;
        }

        //sendIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        this.reactContext.startActivity(sendIntent);
        promise.resolve(true);
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

    @ReactMethod
    public void openFileChooser(ReadableMap options, String title) {
        Intent intent = new Intent(Intent.ACTION_VIEW);

        if (options.hasKey("subject")) {
            intent.putExtra(Intent.EXTRA_SUBJECT, options.getString("subject"));
        }

        File fileUrl = new File(options.getString("fileUrl"));
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.M) {
            Uri uri = FileProvider.getUriForFile(this.reactContext, this.reactContext.getPackageName() + ".fileprovider", fileUrl);
            intent.setDataAndType(uri, options.getString("type"));
        } else {
            intent.setDataAndType(Uri.fromFile(fileUrl), options.getString("type"));
        }

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        Activity currentActivity = getCurrentActivity();
        if (currentActivity != null) {
            currentActivity.startActivity(Intent.createChooser(intent, title));
        }
    }

    @ReactMethod
    public void openEmailApp() {
      Intent sendIntent = new Intent(Intent.ACTION_MAIN);
      sendIntent.addCategory(Intent.CATEGORY_APP_EMAIL);
      if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
          this.reactContext.startActivity(sendIntent);
      }
    }

}
