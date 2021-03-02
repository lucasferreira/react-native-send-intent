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
    gotoHomeScreen() {
        return RNSendIntentAndroid.gotoHomeScreen();
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
    /**
     * This method follows the chrome intent syntax: https://developer.chrome.com/multidevice/android/intents.
     *
     * Opens intent with package name defined in the dataUri field.
     * When intent cannot be resolved, open the URL in browser_fallback_url in the mobile's browser.
     * @param {string} dataUri - the intent url. Looks like: `intent://www.spm.com/qrlogin#Intent;scheme=https;package=example.package;S.browser_fallback_url=https://www.spm.com/download;end`.
     * @returns {Promise<boolean>} true if app or fallback URL is opened, false otherwise.
     */
    openChromeIntent(dataUri) {
        return RNSendIntentAndroid.openChromeIntent(dataUri);
    },
    openFileChooser(options, title) {
        return RNSendIntentAndroid.openFileChooser(options, title);
    },
    openFilePicker({ type = "*/*", title = "Choose File" }, callback) {
        return RNSendIntentAndroid.openFilePicker({ type, title }, callback);
    },
    openEmailApp() {
        RNSendIntentAndroid.openEmailApp();
    },
    openAllEmailApp() {
        RNSendIntentAndroid.openAllEmailApp();
    },
    openDownloadManager() {
        RNSendIntentAndroid.openDownloadManager();
    },
    requestIgnoreBatteryOptimizations() {
        return RNSendIntentAndroid.requestIgnoreBatteryOptimizations();
    },
    showIgnoreBatteryOptimizationsSettings() {
        RNSendIntentAndroid.showIgnoreBatteryOptimizationsSettings();
    },
    openAppWithUri(intentUri, extras) {
        return RNSendIntentAndroid.openAppWithUri(intentUri, extras || {});
    },
};

module.exports = SendIntentAndroid;
