/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var emptyFunction = require('fbjs/lib/emptyFunction');
var invariant = require('fbjs/lib/invariant');

var showDialog = emptyFunction;

function logCapturedError(capturedError) {
  if (process.env.NODE_ENV !== 'production') {
    var componentName = capturedError.componentName,
        componentStack = capturedError.componentStack,
        error = capturedError.error,
        errorBoundaryName = capturedError.errorBoundaryName,
        errorBoundaryFound = capturedError.errorBoundaryFound,
        willRetry = capturedError.willRetry;
    var message = error.message,
        name = error.name,
        stack = error.stack;


    var errorSummary = message ? name + ': ' + message : name;

    var componentNameMessage = componentName ? 'React caught an error thrown by ' + componentName + '.' : 'React caught an error thrown by one of your components.';

    // Error stack varies by browser, eg:
    // Chrome prepends the Error name and type.
    // Firefox, Safari, and IE don't indent the stack lines.
    // Format it in a consistent way for error logging.
    var formattedCallStack = stack.slice(0, errorSummary.length) === errorSummary ? stack.slice(errorSummary.length) : stack;
    formattedCallStack = formattedCallStack.trim().split('\n').map(function (line) {
      return '\n    ' + line.trim();
    }).join();

    var errorBoundaryMessage = void 0;
    // errorBoundaryFound check is sufficient; errorBoundaryName check is to satisfy Flow.
    if (errorBoundaryFound && errorBoundaryName) {
      if (willRetry) {
        errorBoundaryMessage = 'React will try to recreate this component tree from scratch ' + ('using the error boundary you provided, ' + errorBoundaryName + '.');
      } else {
        errorBoundaryMessage = 'This error was initially handled by the error boundary ' + errorBoundaryName + '. ' + 'Recreating the tree from scratch failed so React will unmount the tree.';
      }
    } else {
      // TODO Link to unstable_handleError() documentation once it exists.
      errorBoundaryMessage = 'Consider adding an error boundary to your tree to customize error handling behavior.';
    }

    console.error(componentNameMessage + ' You should fix this error in your code. ' + errorBoundaryMessage + '\n\n' + (errorSummary + '\n\n') + ('The error is located at: ' + componentStack + '\n\n') + ('The error was thrown at: ' + formattedCallStack));
  }

  if (!(process.env.NODE_ENV !== 'production')) {
    var _error = capturedError.error;

    console.error('React caught an error thrown by one of your components.\n\n' + _error.stack);
  }

  showDialog(capturedError);
}

exports.injection = {
  injectDialog: function (fn) {
    invariant(showDialog === emptyFunction, 'The custom dialog was already injected.');
    invariant(typeof fn === 'function', 'Injected showDialog() must be a function.');
    showDialog = fn;
  }
};

exports.logCapturedError = logCapturedError;