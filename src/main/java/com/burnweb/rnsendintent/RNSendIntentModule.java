package com.burnweb.rnsendintent;

import android.content.Intent;
import android.content.ComponentName;
import android.provider.CalendarContract;
import android.provider.CalendarContract.Calendars;
import android.provider.CalendarContract.Events;
import android.util.Log;
import android.net.Uri;

import java.util.Map;
import java.util.HashMap;
import java.util.Calendar;
import java.util.Arrays;
import java.lang.SecurityException;
import java.text.SimpleDateFormat;
import java.text.ParseException;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

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

    private Intent getSendIntent(String text, String type) {
      Intent sendIntent = new Intent();
      sendIntent.setAction(Intent.ACTION_SEND);
      sendIntent.putExtra(Intent.EXTRA_TEXT, text);
      sendIntent.setType(type);
      sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

      return sendIntent;
    }

    @ReactMethod
    public void sendPhoneCall(String phoneNumberString) {
      //Needs permission "android.permission.CALL_PHONE"
      Intent sendIntent = new Intent(Intent.ACTION_CALL, Uri.parse("tel:" + phoneNumberString.trim()));
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
    public void sendSms(String phoneNumbers, String body) {

         StringBuilder uri = new StringBuilder("sms:");
         uri.append(phoneNumbers);

         Intent sendIntent = new Intent(Intent.ACTION_VIEW);
         //sendIntent.setType("vnd.android-dir/mms-sms");
         sendIntent = sendIntent.setData(Uri.parse(uri.toString()));
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
    public void addCalendarEvent(String title, String description, String startDate, String endDate, String recurrence) {

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
          .putExtra(Events.TITLE, title)
          .putExtra(Events.DESCRIPTION, description);

      if (Arrays.asList(VALID_RECURRENCE).contains(recurrence.toUpperCase())) {
          sendIntent.putExtra(Events.RRULE, "FREQ=" + recurrence.toUpperCase());
      }

      if (sendIntent.resolveActivity(this.reactContext.getPackageManager()) != null) {
          this.reactContext.startActivity(sendIntent);
      }
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
}
