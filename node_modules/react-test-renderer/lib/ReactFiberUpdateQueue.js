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

var _assign = require('object-assign');

var _require = require('./ReactTypeOfSideEffect'),
    CallbackEffect = _require.Callback;

var _require2 = require('./ReactPriorityLevel'),
    NoWork = _require2.NoWork,
    SynchronousPriority = _require2.SynchronousPriority,
    TaskPriority = _require2.TaskPriority;

var invariant = require('fbjs/lib/invariant');
if (process.env.NODE_ENV !== 'production') {
  var warning = require('fbjs/lib/warning');
}

// Callbacks are not validated until invocation


// Singly linked-list of updates. When an update is scheduled, it is added to
// the queue of the current fiber and the work-in-progress fiber. The two queues
// are separate but they share a persistent structure.
//
// During reconciliation, updates are removed from the work-in-progress fiber,
// but they remain on the current fiber. That ensures that if a work-in-progress
// is aborted, the aborted updates are recovered by cloning from current.
//
// The work-in-progress queue is always a subset of the current queue.
//
// When the tree is committed, the work-in-progress becomes the current.


function comparePriority(a, b) {
  // When comparing update priorities, treat sync and Task work as equal.
  // TODO: Could we avoid the need for this by always coercing sync priority
  // to Task when scheduling an update?
  if ((a === TaskPriority || a === SynchronousPriority) && (b === TaskPriority || b === SynchronousPriority)) {
    return 0;
  }
  if (a === NoWork && b !== NoWork) {
    return -255;
  }
  if (a !== NoWork && b === NoWork) {
    return 255;
  }
  return a - b;
}

// Ensures that a fiber has an update queue, creating a new one if needed.
// Returns the new or existing queue.
function ensureUpdateQueue(fiber) {
  if (fiber.updateQueue !== null) {
    // We already have an update queue.
    return fiber.updateQueue;
  }

  var queue = void 0;
  if (process.env.NODE_ENV !== 'production') {
    queue = {
      first: null,
      last: null,
      hasForceUpdate: false,
      callbackList: null,
      isProcessing: false
    };
  } else {
    queue = {
      first: null,
      last: null,
      hasForceUpdate: false,
      callbackList: null
    };
  }

  fiber.updateQueue = queue;
  return queue;
}

// Clones an update queue from a source fiber onto its alternate.
function cloneUpdateQueue(current, workInProgress) {
  var currentQueue = current.updateQueue;
  if (currentQueue === null) {
    // The source fiber does not have an update queue.
    workInProgress.updateQueue = null;
    return null;
  }
  // If the alternate already has a queue, reuse the previous object.
  var altQueue = workInProgress.updateQueue !== null ? workInProgress.updateQueue : {};
  altQueue.first = currentQueue.first;
  altQueue.last = currentQueue.last;

  // These fields are invalid by the time we clone from current. Reset them.
  altQueue.hasForceUpdate = false;
  altQueue.callbackList = null;
  altQueue.isProcessing = false;

  workInProgress.updateQueue = altQueue;

  return altQueue;
}
exports.cloneUpdateQueue = cloneUpdateQueue;

function cloneUpdate(update) {
  return {
    priorityLevel: update.priorityLevel,
    partialState: update.partialState,
    callback: update.callback,
    isReplace: update.isReplace,
    isForced: update.isForced,
    isTopLevelUnmount: update.isTopLevelUnmount,
    next: null
  };
}

function insertUpdateIntoQueue(queue, update, insertAfter, insertBefore) {
  if (insertAfter !== null) {
    insertAfter.next = update;
  } else {
    // This is the first item in the queue.
    update.next = queue.first;
    queue.first = update;
  }

  if (insertBefore !== null) {
    update.next = insertBefore;
  } else {
    // This is the last item in the queue.
    queue.last = update;
  }
}

// Returns the update after which the incoming update should be inserted into
// the queue, or null if it should be inserted at beginning.
function findInsertionPosition(queue, update) {
  var priorityLevel = update.priorityLevel;
  var insertAfter = null;
  var insertBefore = null;
  if (queue.last !== null && comparePriority(queue.last.priorityLevel, priorityLevel) <= 0) {
    // Fast path for the common case where the update should be inserted at
    // the end of the queue.
    insertAfter = queue.last;
  } else {
    insertBefore = queue.first;
    while (insertBefore !== null && comparePriority(insertBefore.priorityLevel, priorityLevel) <= 0) {
      insertAfter = insertBefore;
      insertBefore = insertBefore.next;
    }
  }
  return insertAfter;
}

// The work-in-progress queue is a subset of the current queue (if it exists).
// We need to insert the incoming update into both lists. However, it's possible
// that the correct position in one list will be different from the position in
// the other. Consider the following case:
//
//     Current:             3-5-6
//     Work-in-progress:        6
//
// Then we receive an update with priority 4 and insert it into each list:
//
//     Current:             3-4-5-6
//     Work-in-progress:        4-6
//
// In the current queue, the new update's `next` pointer points to the update
// with priority 5. But in the work-in-progress queue, the pointer points to the
// update with priority 6. Because these two queues share the same persistent
// data structure, this won't do. (This can only happen when the incoming update
// has higher priority than all the updates in the work-in-progress queue.)
//
// To solve this, in the case where the incoming update needs to be inserted
// into two different positions, we'll make a clone of the update and insert
// each copy into a separate queue. This forks the list while maintaining a
// persistent structure, because the update that is added to the work-in-progress
// is always added to the front of the list.
//
// However, if incoming update is inserted into the same position of both lists,
// we shouldn't make a copy.
//
// If the update is cloned, it returns the cloned update.
function insertUpdate(fiber, update) {
  var queue1 = ensureUpdateQueue(fiber);
  var queue2 = fiber.alternate !== null ? ensureUpdateQueue(fiber.alternate) : null;

  // Warn if an update is scheduled from inside an updater function.
  if (process.env.NODE_ENV !== 'production') {
    if (queue1.isProcessing || queue2 !== null && queue2.isProcessing) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'An update (setState, replaceState, or forceUpdate) was scheduled ' + 'from inside an update function. Update functions should be pure, ' + 'with zero side-effects. Consider using componentDidUpdate or a ' + 'callback.') : void 0;
    }
  }

  // Find the insertion position in the first queue.
  var insertAfter1 = findInsertionPosition(queue1, update);
  var insertBefore1 = insertAfter1 !== null ? insertAfter1.next : queue1.first;

  if (queue2 === null) {
    // If there's no alternate queue, there's nothing else to do but insert.
    insertUpdateIntoQueue(queue1, update, insertAfter1, insertBefore1);
    return null;
  }

  // If there is an alternate queue, find the insertion position.
  var insertAfter2 = findInsertionPosition(queue2, update);
  var insertBefore2 = insertAfter2 !== null ? insertAfter2.next : queue2.first;

  // Now we can insert into the first queue. This must come after finding both
  // insertion positions because it mutates the list.
  insertUpdateIntoQueue(queue1, update, insertAfter1, insertBefore1);

  if (insertBefore1 !== insertBefore2) {
    // The insertion positions are different, so we need to clone the update and
    // insert the clone into the alternate queue.
    var update2 = cloneUpdate(update);
    insertUpdateIntoQueue(queue2, update2, insertAfter2, insertBefore2);
    return update2;
  } else {
    // The insertion positions are the same, so when we inserted into the first
    // queue, it also inserted into the alternate. All we need to do is update
    // the alternate queue's `first` and `last` pointers, in case they
    // have changed.
    if (insertAfter2 === null) {
      queue2.first = update;
    }
    if (insertBefore2 === null) {
      queue2.last = null;
    }
  }

  return null;
}

function addUpdate(fiber, partialState, callback, priorityLevel) {
  var update = {
    priorityLevel: priorityLevel,
    partialState: partialState,
    callback: callback,
    isReplace: false,
    isForced: false,
    isTopLevelUnmount: false,
    next: null
  };
  insertUpdate(fiber, update);
}
exports.addUpdate = addUpdate;

function addReplaceUpdate(fiber, state, callback, priorityLevel) {
  var update = {
    priorityLevel: priorityLevel,
    partialState: state,
    callback: callback,
    isReplace: true,
    isForced: false,
    isTopLevelUnmount: false,
    next: null
  };
  insertUpdate(fiber, update);
}
exports.addReplaceUpdate = addReplaceUpdate;

function addForceUpdate(fiber, callback, priorityLevel) {
  var update = {
    priorityLevel: priorityLevel,
    partialState: null,
    callback: callback,
    isReplace: false,
    isForced: true,
    isTopLevelUnmount: false,
    next: null
  };
  insertUpdate(fiber, update);
}
exports.addForceUpdate = addForceUpdate;

function getPendingPriority(queue) {
  return queue.first !== null ? queue.first.priorityLevel : NoWork;
}
exports.getPendingPriority = getPendingPriority;

function addTopLevelUpdate(fiber, partialState, callback, priorityLevel) {
  var isTopLevelUnmount = partialState.element === null;

  var update = {
    priorityLevel: priorityLevel,
    partialState: partialState,
    callback: callback,
    isReplace: false,
    isForced: false,
    isTopLevelUnmount: isTopLevelUnmount,
    next: null
  };
  var update2 = insertUpdate(fiber, update);

  if (isTopLevelUnmount) {
    // Drop all updates that are lower-priority, so that the tree is not
    // remounted. We need to do this for both queues.
    var queue1 = fiber.updateQueue;
    var queue2 = fiber.alternate !== null ? fiber.alternate.updateQueue : null;

    if (queue1 !== null && update.next !== null) {
      update.next = null;
      queue1.last = update;
    }
    if (queue2 !== null && update2 !== null && update2.next !== null) {
      update2.next = null;
      queue2.last = update;
    }
  }
}
exports.addTopLevelUpdate = addTopLevelUpdate;

function getStateFromUpdate(update, instance, prevState, props) {
  var partialState = update.partialState;
  if (typeof partialState === 'function') {
    var updateFn = partialState;
    return updateFn.call(instance, prevState, props);
  } else {
    return partialState;
  }
}

function beginUpdateQueue(workInProgress, queue, instance, prevState, props, priorityLevel) {
  if (process.env.NODE_ENV !== 'production') {
    // Set this flag so we can warn if setState is called inside the update
    // function of another setState.
    queue.isProcessing = true;
  }

  queue.hasForceUpdate = false;

  // Applies updates with matching priority to the previous state to create
  // a new state object.
  var state = prevState;
  var dontMutatePrevState = true;
  var callbackList = null;
  var update = queue.first;
  while (update !== null && comparePriority(update.priorityLevel, priorityLevel) <= 0) {
    // Remove each update from the queue right before it is processed. That way
    // if setState is called from inside an updater function, the new update
    // will be inserted in the correct position.
    queue.first = update.next;
    if (queue.first === null) {
      queue.last = null;
    }

    var _partialState = void 0;
    if (update.isReplace) {
      state = getStateFromUpdate(update, instance, state, props);
      dontMutatePrevState = true;
    } else {
      _partialState = getStateFromUpdate(update, instance, state, props);
      if (_partialState) {
        if (dontMutatePrevState) {
          state = _assign({}, state, _partialState);
        } else {
          state = _assign(state, _partialState);
        }
        dontMutatePrevState = false;
      }
    }
    if (update.isForced) {
      queue.hasForceUpdate = true;
    }
    // Second condition ignores top-level unmount callbacks if they are not the
    // last update in the queue, since a subsequent update will cause a remount.
    if (update.callback !== null && !(update.isTopLevelUnmount && update.next !== null)) {
      callbackList = callbackList || [];
      callbackList.push(update.callback);
      workInProgress.effectTag |= CallbackEffect;
    }
    update = update.next;
  }

  queue.callbackList = callbackList;

  if (queue.first === null && callbackList === null && !queue.hasForceUpdate) {
    // The queue is empty and there are no callbacks. We can reset it.
    workInProgress.updateQueue = null;
  }

  if (process.env.NODE_ENV !== 'production') {
    queue.isProcessing = false;
  }

  return state;
}
exports.beginUpdateQueue = beginUpdateQueue;

function commitCallbacks(finishedWork, queue, context) {
  var callbackList = queue.callbackList;
  if (callbackList === null) {
    return;
  }
  for (var i = 0; i < callbackList.length; i++) {
    var _callback = callbackList[i];
    invariant(typeof _callback === 'function', 'Invalid argument passed as callback. Expected a function. Instead ' + 'received: %s', _callback);
    _callback.call(context);
  }
}
exports.commitCallbacks = commitCallbacks;