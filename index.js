/**
 * @providesModule SendIntentAndroid
 */

'use strict';

var RNSendIntentAndroid = require('react-native').NativeModules.SendIntentAndroid;

var SendIntentAndroid = {
    TEXT_PLAIN: RNSendIntentAndroid.TEXT_PLAIN,
    TEXT_HTML: RNSendIntentAndroid.TEXT_HTML,
    sendText(config) {
        if("title" in config && config.title != null && config.title.length > 0)
        {
            RNSendIntentAndroid.sendTextWithTitle(config.title, config.text, (config.type||"text/plain"));
        }
        else
        {
            RNSendIntentAndroid.sendText(config.text, (config.type||"text/plain"));
        }
    },
    sendPhoneCall(phoneNumber) {
        RNSendIntentAndroid.sendPhoneCall(phoneNumber);
    },
    sendPhoneDial(phoneNumber) {
        RNSendIntentAndroid.sendPhoneDial(phoneNumber);
    },
    sendSms(phoneNumber, body) {
        RNSendIntentAndroid.sendSms(phoneNumber, (body||null));
    },
    addCalendarEvent(config) {
        RNSendIntentAndroid.addCalendarEvent(config.title, config.description, config.startDate, config.endDate, config.recurrence, config.location);
    },
    openCalendar() {
        RNSendIntentAndroid.openCalendar();
    }
};

module.exports = SendIntentAndroid;
