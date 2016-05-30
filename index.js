/**
 * @providesModule SendIntentAndroid
 */

'use strict';

var { Platform, NativeModules } = require('react-native');
var RNSendIntentAndroid = NativeModules.SendIntentAndroid;

var SendIntentAndroid = {
    TEXT_PLAIN: (Platform.OS === 'android') ? RNSendIntentAndroid.TEXT_PLAIN : 'text/plain',
    TEXT_HTML: (Platform.OS === 'android') ? RNSendIntentAndroid.TEXT_HTML : 'text/html',
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
