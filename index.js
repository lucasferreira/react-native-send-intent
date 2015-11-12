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
    }
};

module.exports = SendIntentAndroid;
