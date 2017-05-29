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

var _require = require('./ReactFiberUpdateQueue'),
    addTopLevelUpdate = _require.addTopLevelUpdate;

var _require2 = require('./ReactFiberContext'),
    findCurrentUnmaskedContext = _require2.findCurrentUnmaskedContext,
    isContextProvider = _require2.isContextProvider,
    processChildContext = _require2.processChildContext;

var _require3 = require('./ReactFiberRoot'),
    createFiberRoot = _require3.createFiberRoot;

var ReactFiberScheduler = require('./ReactFiberScheduler');

if (process.env.NODE_ENV !== 'production') {
  var warning = require('fbjs/lib/warning');
  var ReactFiberInstrumentation = require('./ReactFiberInstrumentation');
  var ReactDebugCurrentFiber = require('./ReactDebugCurrentFiber');
  var getComponentName = require('./getComponentName');
}

var _require4 = require('./ReactFiberTreeReflection'),
    findCurrentHostFiber = _require4.findCurrentHostFiber;

var getContextForSubtree = require('./getContextForSubtree');

getContextForSubtree._injectFiber(function (fiber) {
  var parentContext = findCurrentUnmaskedContext(fiber);
  return isContextProvider(fiber) ? processChildContext(fiber, parentContext, false) : parentContext;
});

module.exports = function (config) {
  var _ReactFiberScheduler = ReactFiberScheduler(config),
      scheduleUpdate = _ReactFiberScheduler.scheduleUpdate,
      getPriorityContext = _ReactFiberScheduler.getPriorityContext,
      performWithPriority = _ReactFiberScheduler.performWithPriority,
      batchedUpdates = _ReactFiberScheduler.batchedUpdates,
      unbatchedUpdates = _ReactFiberScheduler.unbatchedUpdates,
      syncUpdates = _ReactFiberScheduler.syncUpdates,
      deferredUpdates = _ReactFiberScheduler.deferredUpdates;

  function scheduleTopLevelUpdate(current, element, callback) {
    if (process.env.NODE_ENV !== 'production') {
      if (ReactDebugCurrentFiber.phase === 'render' && ReactDebugCurrentFiber.current !== null) {
        process.env.NODE_ENV !== 'production' ? warning(false, 'Render methods should be a pure function of props and state; ' + 'triggering nested component updates from render is not allowed. ' + 'If necessary, trigger nested updates in componentDidUpdate.\n\n' + 'Check the render method of %s.', getComponentName(ReactDebugCurrentFiber.current) || 'Unknown') : void 0;
      }
    }

    var priorityLevel = getPriorityContext();
    var nextState = { element: element };
    callback = callback === undefined ? null : callback;
    if (process.env.NODE_ENV !== 'production') {
      process.env.NODE_ENV !== 'production' ? warning(callback === null || typeof callback === 'function', 'render(...): Expected the last optional `callback` argument to be a ' + 'function. Instead received: %s.', callback) : void 0;
    }
    addTopLevelUpdate(current, nextState, callback, priorityLevel);
    scheduleUpdate(current, priorityLevel);
  }

  return {
    createContainer: function (containerInfo) {
      return createFiberRoot(containerInfo);
    },
    updateContainer: function (element, container, parentComponent, callback) {
      // TODO: If this is a nested container, this won't be the root.
      var current = container.current;

      if (process.env.NODE_ENV !== 'production') {
        if (ReactFiberInstrumentation.debugTool) {
          if (current.alternate === null) {
            ReactFiberInstrumentation.debugTool.onMountContainer(container);
          } else if (element === null) {
            ReactFiberInstrumentation.debugTool.onUnmountContainer(container);
          } else {
            ReactFiberInstrumentation.debugTool.onUpdateContainer(container);
          }
        }
      }

      var context = getContextForSubtree(parentComponent);
      if (container.context === null) {
        container.context = context;
      } else {
        container.pendingContext = context;
      }

      scheduleTopLevelUpdate(current, element, callback);
    },


    performWithPriority: performWithPriority,

    batchedUpdates: batchedUpdates,

    unbatchedUpdates: unbatchedUpdates,

    syncUpdates: syncUpdates,

    deferredUpdates: deferredUpdates,

    getPublicRootInstance: function (container) {
      var containerFiber = container.current;
      if (!containerFiber.child) {
        return null;
      }
      return containerFiber.child.stateNode;
    },
    findHostInstance: function (fiber) {
      var hostFiber = findCurrentHostFiber(fiber);
      if (hostFiber === null) {
        return null;
      }
      return hostFiber.stateNode;
    }
  };
};