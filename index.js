/**
 * @providesModule SendIntentAndroid
 */

var { Platform, NativeModules } = require("react-native");
var RNSendIntentAndroid = NativeModules.SendIntentAndroid || {};

var SendIntentAndroid = {
    TEXT_PLAIN: Platform.OS === "android" ? RNSendIntentAndroid.TEXT_PLAIN : "text/plain",
    TEXT_HTML: Platform.OS === "android" ? RNSendIntentAndroid.TEXT_HTML : "text/html",
    sendText(config) {
        if ("title" in config && config.title != null && config.title.length > 0) {
            RNSendIntentAndroid.sendTextWithTitle(config.title, config.text, config.type || "text/plain");
        } else {
            RNSendIntentAndroid.sendText(config.text, config.type || "text/plain");
        }
    },
    sendPhoneCall(phoneNumber, phoneAppOnly = false) {
        RNSendIntentAndroid.sendPhoneCall(phoneNumber, phoneAppOnly);
    },
    sendPhoneDial(phoneNumber, phoneAppOnly = false) {
        RNSendIntentAndroid.sendPhoneDial(phoneNumber, phoneAppOnly);
    },
    sendSms(phoneNumber, body = null) {
        RNSendIntentAndroid.sendSms(phoneNumber, body);
    },
    addCalendarEvent(config) {
        RNSendIntentAndroid.addCalendarEvent(
            config.title,
            config.description,
            config.startDate,
            config.endDate,
            config.recurrence,
            config.location,
            config.isAllDay || false
        );
    },
    isAppInstalled(packageName) {
        return RNSendIntentAndroid.isAppInstalled(packageName);
    },
    installRemoteApp(uri, saveAs) {
        return RNSendIntentAndroid.installRemoteApp(uri, saveAs);
    },
    openCalendar() {
        RNSendIntentAndroid.openCalendar();
    },
    sendMail(mail, subject = "", body = "") {
        RNSendIntentAndroid.sendMail(mail, subject, body);
    },
    openChooserWithOptions(options, title) {
        RNSendIntentAndroid.openChooserWithOptions(options, title);
    },
    openChooserWithMultipleOptions(options, title) {
        RNSendIntentAndroid.openChooserWithMultipleOptions(options, title);
    },
    openMaps(query) {
        RNSendIntentAndroid.openMaps(query);
    },
    openCamera() {
        RNSendIntentAndroid.openCamera();
    },
    openMapsWithRoute(query, mode) {
        RNSendIntentAndroid.openMapsWithRoute(query, mode);
    },
    shareTextToLine(options) {
        RNSendIntentAndroid.shareTextToLine(options);
    },
    shareImageToInstagram(type, mediaPath) {
        RNSendIntentAndroid.shareImageToInstagram(type, mediaPath);
    },
    openSettings(settingsName) {
        RNSendIntentAndroid.openSettings(settingsName);
    },
    getVoiceMailNumber() {
        return RNSendIntentAndroid.getVoiceMailNumber();
    },
    getPhoneNumber() {
        return RNSendIntentAndroid.getPhoneNumber();
    },
    openApp(packageName, extras) {
        return RNSendIntentAndroid.openApp(packageName, extras || {});
    },
    /** Creates an ACTION_VIEW Intent for the given package with the given data, optional mimetype and extras.
     *  The extras are an object containing String, or other objects of the following format:
     * { type: "int", value: 4 }
     * Other possible types are int, short, byte, char, long and float.
     */
    openAppWithData(packageName, dataUri, mimeType, extras) {
        return RNSendIntentAndroid.openAppWithData(packageName, dataUri, mimeType, extras || {});
    },
    openFileChooser(options, title) {
        return RNSendIntentAndroid.openFileChooser(options, title);
    },
    openEmailApp() {
        RNSendIntentAndroid.openEmailApp();
    }
};

module.exports = SendIntentAndroid;
