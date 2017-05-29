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

var _require = require('./ReactFiberContext'),
    popContextProvider = _require.popContextProvider;

var _require2 = require('./ReactFiberStack'),
    reset = _require2.reset;

var _require3 = require('./ReactFiberComponentTreeHook'),
    getStackAddendumByWorkInProgressFiber = _require3.getStackAddendumByWorkInProgressFiber;

var _require4 = require('./ReactFiberErrorLogger'),
    logCapturedError = _require4.logCapturedError;

var _require5 = require('./ReactErrorUtils'),
    invokeGuardedCallback = _require5.invokeGuardedCallback;

var ReactFiberBeginWork = require('./ReactFiberBeginWork');
var ReactFiberCompleteWork = require('./ReactFiberCompleteWork');
var ReactFiberCommitWork = require('./ReactFiberCommitWork');
var ReactFiberHostContext = require('./ReactFiberHostContext');
var ReactCurrentOwner = require('react/lib/ReactCurrentOwner');
var ReactFeatureFlags = require('./ReactFeatureFlags');
var getComponentName = require('./getComponentName');

var _require6 = require('./ReactFiber'),
    cloneFiber = _require6.cloneFiber;

var _require7 = require('./ReactFiberDevToolsHook'),
    onCommitRoot = _require7.onCommitRoot;

var _require8 = require('./ReactPriorityLevel'),
    NoWork = _require8.NoWork,
    SynchronousPriority = _require8.SynchronousPriority,
    TaskPriority = _require8.TaskPriority,
    AnimationPriority = _require8.AnimationPriority,
    HighPriority = _require8.HighPriority,
    LowPriority = _require8.LowPriority,
    OffscreenPriority = _require8.OffscreenPriority;

var _require9 = require('./ReactTypeOfSideEffect'),
    NoEffect = _require9.NoEffect,
    Placement = _require9.Placement,
    Update = _require9.Update,
    PlacementAndUpdate = _require9.PlacementAndUpdate,
    Deletion = _require9.Deletion,
    ContentReset = _require9.ContentReset,
    Callback = _require9.Callback,
    Err = _require9.Err,
    Ref = _require9.Ref;

var _require10 = require('./ReactTypeOfWork'),
    HostRoot = _require10.HostRoot,
    HostComponent = _require10.HostComponent,
    HostPortal = _require10.HostPortal,
    ClassComponent = _require10.ClassComponent;

var _require11 = require('./ReactFiberUpdateQueue'),
    getPendingPriority = _require11.getPendingPriority;

var _require12 = require('./ReactFiberContext'),
    resetContext = _require12.resetContext;

var invariant = require('fbjs/lib/invariant');

if (process.env.NODE_ENV !== 'production') {
  var warning = require('fbjs/lib/warning');
  var ReactFiberInstrumentation = require('./ReactFiberInstrumentation');
  var ReactDebugCurrentFiber = require('./ReactDebugCurrentFiber');

  var _require13 = require('./ReactDebugFiberPerf'),
      recordEffect = _require13.recordEffect,
      recordScheduleUpdate = _require13.recordScheduleUpdate,
      startWorkTimer = _require13.startWorkTimer,
      stopWorkTimer = _require13.stopWorkTimer,
      startWorkLoopTimer = _require13.startWorkLoopTimer,
      stopWorkLoopTimer = _require13.stopWorkLoopTimer,
      startCommitTimer = _require13.startCommitTimer,
      stopCommitTimer = _require13.stopCommitTimer,
      startCommitHostEffectsTimer = _require13.startCommitHostEffectsTimer,
      stopCommitHostEffectsTimer = _require13.stopCommitHostEffectsTimer,
      startCommitLifeCyclesTimer = _require13.startCommitLifeCyclesTimer,
      stopCommitLifeCyclesTimer = _require13.stopCommitLifeCyclesTimer;

  var warnAboutUpdateOnUnmounted = function (instance) {
    var ctor = instance.constructor;
    process.env.NODE_ENV !== 'production' ? warning(false, 'Can only update a mounted or mounting component. This usually means ' + 'you called setState, replaceState, or forceUpdate on an unmounted ' + 'component. This is a no-op.\n\nPlease check the code for the ' + '%s component.', ctor && (ctor.displayName || ctor.name) || 'ReactClass') : void 0;
  };

  var warnAboutInvalidUpdates = function (instance) {
    switch (ReactDebugCurrentFiber.phase) {
      case 'getChildContext':
        process.env.NODE_ENV !== 'production' ? warning(false, 'setState(...): Cannot call setState() inside getChildContext()') : void 0;
        break;
      case 'render':
        process.env.NODE_ENV !== 'production' ? warning(false, 'Cannot update during an existing state transition (such as within ' + "`render` or another component's constructor). Render methods should " + 'be a pure function of props and state; constructor side-effects are ' + 'an anti-pattern, but can be moved to `componentWillMount`.') : void 0;
        break;
    }
  };
}

var timeHeuristicForUnitOfWork = 1;

module.exports = function (config) {
  var hostContext = ReactFiberHostContext(config);
  var popHostContainer = hostContext.popHostContainer,
      popHostContext = hostContext.popHostContext,
      resetHostContainer = hostContext.resetHostContainer;

  var _ReactFiberBeginWork = ReactFiberBeginWork(config, hostContext, scheduleUpdate, getPriorityContext),
      beginWork = _ReactFiberBeginWork.beginWork,
      beginFailedWork = _ReactFiberBeginWork.beginFailedWork;

  var _ReactFiberCompleteWo = ReactFiberCompleteWork(config, hostContext),
      completeWork = _ReactFiberCompleteWo.completeWork;

  var _ReactFiberCommitWork = ReactFiberCommitWork(config, captureError),
      commitPlacement = _ReactFiberCommitWork.commitPlacement,
      commitDeletion = _ReactFiberCommitWork.commitDeletion,
      commitWork = _ReactFiberCommitWork.commitWork,
      commitLifeCycles = _ReactFiberCommitWork.commitLifeCycles,
      commitAttachRef = _ReactFiberCommitWork.commitAttachRef,
      commitDetachRef = _ReactFiberCommitWork.commitDetachRef;

  var hostScheduleAnimationCallback = config.scheduleAnimationCallback,
      hostScheduleDeferredCallback = config.scheduleDeferredCallback,
      useSyncScheduling = config.useSyncScheduling,
      prepareForCommit = config.prepareForCommit,
      resetAfterCommit = config.resetAfterCommit;

  // The priority level to use when scheduling an update.
  // TODO: Should we change this to an array? Might be less confusing.

  var priorityContext = useSyncScheduling ? SynchronousPriority : LowPriority;

  // Keep track of this so we can reset the priority context if an error
  // is thrown during reconciliation.
  var priorityContextBeforeReconciliation = NoWork;

  // Keeps track of whether we're currently in a work loop.
  var isPerformingWork = false;

  // Keeps track of whether the current deadline has expired.
  var deadlineHasExpired = false;

  // Keeps track of whether we should should batch sync updates.
  var isBatchingUpdates = false;

  // The next work in progress fiber that we're currently working on.
  var nextUnitOfWork = null;
  var nextPriorityLevel = NoWork;

  // The next fiber with an effect that we're currently committing.
  var nextEffect = null;

  var pendingCommit = null;

  // Linked list of roots with scheduled work on them.
  var nextScheduledRoot = null;
  var lastScheduledRoot = null;

  // Keep track of which host environment callbacks are scheduled.
  var isAnimationCallbackScheduled = false;
  var isDeferredCallbackScheduled = false;

  // Keep track of which fibers have captured an error that need to be handled.
  // Work is removed from this collection after unstable_handleError is called.
  var capturedErrors = null;
  // Keep track of which fibers have failed during the current batch of work.
  // This is a different set than capturedErrors, because it is not reset until
  // the end of the batch. This is needed to propagate errors correctly if a
  // subtree fails more than once.
  var failedBoundaries = null;
  // Error boundaries that captured an error during the current commit.
  var commitPhaseBoundaries = null;
  var firstUncaughtError = null;
  var fatalError = null;

  var isCommitting = false;
  var isUnmounting = false;

  function scheduleAnimationCallback(callback) {
    if (!isAnimationCallbackScheduled) {
      isAnimationCallbackScheduled = true;
      hostScheduleAnimationCallback(callback);
    }
  }

  function scheduleDeferredCallback(callback) {
    if (!isDeferredCallbackScheduled) {
      isDeferredCallbackScheduled = true;
      hostScheduleDeferredCallback(callback);
    }
  }

  function resetContextStack() {
    // Reset the stack
    reset();
    // Reset the cursors
    resetContext();
    resetHostContainer();
  }

  // findNextUnitOfWork mutates the current priority context. It is reset after
  // after the workLoop exits, so never call findNextUnitOfWork from outside
  // the work loop.
  function findNextUnitOfWork() {
    // Clear out roots with no more work on them, or if they have uncaught errors
    while (nextScheduledRoot !== null && nextScheduledRoot.current.pendingWorkPriority === NoWork) {
      // Unschedule this root.
      nextScheduledRoot.isScheduled = false;
      // Read the next pointer now.
      // We need to clear it in case this root gets scheduled again later.
      var next = nextScheduledRoot.nextScheduledRoot;
      nextScheduledRoot.nextScheduledRoot = null;
      // Exit if we cleared all the roots and there's no work to do.
      if (nextScheduledRoot === lastScheduledRoot) {
        nextScheduledRoot = null;
        lastScheduledRoot = null;
        nextPriorityLevel = NoWork;
        return null;
      }
      // Continue with the next root.
      // If there's no work on it, it will get unscheduled too.
      nextScheduledRoot = next;
    }

    var root = nextScheduledRoot;
    var highestPriorityRoot = null;
    var highestPriorityLevel = NoWork;
    while (root !== null) {
      if (root.current.pendingWorkPriority !== NoWork && (highestPriorityLevel === NoWork || highestPriorityLevel > root.current.pendingWorkPriority)) {
        highestPriorityLevel = root.current.pendingWorkPriority;
        highestPriorityRoot = root;
      }
      // We didn't find anything to do in this root, so let's try the next one.
      root = root.nextScheduledRoot;
    }
    if (highestPriorityRoot !== null) {
      nextPriorityLevel = highestPriorityLevel;
      priorityContext = nextPriorityLevel;

      // Before we start any new work, let's make sure that we have a fresh
      // stack to work from.
      // TODO: This call is buried a bit too deep. It would be nice to have
      // a single point which happens right before any new work and
      // unfortunately this is it.
      resetContextStack();

      return cloneFiber(highestPriorityRoot.current, highestPriorityLevel);
    }

    nextPriorityLevel = NoWork;
    return null;
  }

  function commitAllHostEffects() {
    while (nextEffect !== null) {
      if (process.env.NODE_ENV !== 'production') {
        ReactDebugCurrentFiber.current = nextEffect;
        recordEffect();
      }

      var effectTag = nextEffect.effectTag;
      if (effectTag & ContentReset) {
        config.resetTextContent(nextEffect.stateNode);
      }

      if (effectTag & Ref) {
        var current = nextEffect.alternate;
        if (current !== null) {
          commitDetachRef(current);
        }
      }

      // The following switch statement is only concerned about placement,
      // updates, and deletions. To avoid needing to add a case for every
      // possible bitmap value, we remove the secondary effects from the
      // effect tag and switch on that value.
      var primaryEffectTag = effectTag & ~(Callback | Err | ContentReset | Ref);
      switch (primaryEffectTag) {
        case Placement:
          {
            commitPlacement(nextEffect);
            // Clear the "placement" from effect tag so that we know that this is inserted, before
            // any life-cycles like componentDidMount gets called.
            // TODO: findDOMNode doesn't rely on this any more but isMounted
            // does and isMounted is deprecated anyway so we should be able
            // to kill this.
            nextEffect.effectTag &= ~Placement;
            break;
          }
        case PlacementAndUpdate:
          {
            // Placement
            commitPlacement(nextEffect);
            // Clear the "placement" from effect tag so that we know that this is inserted, before
            // any life-cycles like componentDidMount gets called.
            nextEffect.effectTag &= ~Placement;

            // Update
            var _current = nextEffect.alternate;
            commitWork(_current, nextEffect);
            break;
          }
        case Update:
          {
            var _current2 = nextEffect.alternate;
            commitWork(_current2, nextEffect);
            break;
          }
        case Deletion:
          {
            isUnmounting = true;
            commitDeletion(nextEffect);
            isUnmounting = false;
            break;
          }
      }
      nextEffect = nextEffect.nextEffect;
    }

    if (process.env.NODE_ENV !== 'production') {
      ReactDebugCurrentFiber.current = null;
    }
  }

  function commitAllLifeCycles() {
    while (nextEffect !== null) {
      var effectTag = nextEffect.effectTag;

      // Use Task priority for lifecycle updates
      if (effectTag & (Update | Callback)) {
        if (process.env.NODE_ENV !== 'production') {
          recordEffect();
        }
        var current = nextEffect.alternate;
        commitLifeCycles(current, nextEffect);
      }

      if (effectTag & Ref) {
        if (process.env.NODE_ENV !== 'production') {
          recordEffect();
        }
        commitAttachRef(nextEffect);
      }

      if (effectTag & Err) {
        if (process.env.NODE_ENV !== 'production') {
          recordEffect();
        }
        commitErrorHandling(nextEffect);
      }

      var next = nextEffect.nextEffect;
      // Ensure that we clean these up so that we don't accidentally keep them.
      // I'm not actually sure this matters because we can't reset firstEffect
      // and lastEffect since they're on every node, not just the effectful
      // ones. So we have to clean everything as we reuse nodes anyway.
      nextEffect.nextEffect = null;
      // Ensure that we reset the effectTag here so that we can rely on effect
      // tags to reason about the current life-cycle.
      nextEffect = next;
    }
  }

  function commitAllWork(finishedWork) {
    // We keep track of this so that captureError can collect any boundaries
    // that capture an error during the commit phase. The reason these aren't
    // local to this function is because errors that occur during cWU are
    // captured elsewhere, to prevent the unmount from being interrupted.
    isCommitting = true;
    if (process.env.NODE_ENV !== 'production') {
      startCommitTimer();
    }

    pendingCommit = null;
    var root = finishedWork.stateNode;
    invariant(root.current !== finishedWork, 'Cannot commit the same tree as before. This is probably a bug ' + 'related to the return field. This error is likely caused by a bug ' + 'in React. Please file an issue.');

    // Reset this to null before calling lifecycles
    ReactCurrentOwner.current = null;

    // Updates that occur during the commit phase should have Task priority
    var previousPriorityContext = priorityContext;
    priorityContext = TaskPriority;

    var firstEffect = void 0;
    if (finishedWork.effectTag !== NoEffect) {
      // A fiber's effect list consists only of its children, not itself. So if
      // the root has an effect, we need to add it to the end of the list. The
      // resulting list is the set that would belong to the root's parent, if
      // it had one; that is, all the effects in the tree including the root.
      if (finishedWork.lastEffect !== null) {
        finishedWork.lastEffect.nextEffect = finishedWork;
        firstEffect = finishedWork.firstEffect;
      } else {
        firstEffect = finishedWork;
      }
    } else {
      // There is no effect on the root.
      firstEffect = finishedWork.firstEffect;
    }

    var commitInfo = prepareForCommit();

    // Commit all the side-effects within a tree. We'll do this in two passes.
    // The first pass performs all the host insertions, updates, deletions and
    // ref unmounts.
    nextEffect = firstEffect;
    if (process.env.NODE_ENV !== 'production') {
      startCommitHostEffectsTimer();
    }
    while (nextEffect !== null) {
      var _error = null;
      if (process.env.NODE_ENV !== 'production') {
        _error = invokeGuardedCallback(null, commitAllHostEffects, null, finishedWork);
      } else {
        try {
          commitAllHostEffects(finishedWork);
        } catch (e) {
          _error = e;
        }
      }
      if (_error !== null) {
        invariant(nextEffect !== null, 'Should have next effect. This error is likely caused by a bug ' + 'in React. Please file an issue.');
        captureError(nextEffect, _error);
        // Clean-up
        if (nextEffect !== null) {
          nextEffect = nextEffect.nextEffect;
        }
      }
    }
    if (process.env.NODE_ENV !== 'production') {
      stopCommitHostEffectsTimer();
    }

    resetAfterCommit(commitInfo);

    // The work-in-progress tree is now the current tree. This must come after
    // the first pass of the commit phase, so that the previous tree is still
    // current during componentWillUnmount, but before the second pass, so that
    // the finished work is current during componentDidMount/Update.
    root.current = finishedWork;

    // In the second pass we'll perform all life-cycles and ref callbacks.
    // Life-cycles happen as a separate pass so that all placements, updates,
    // and deletions in the entire tree have already been invoked.
    // This pass also triggers any renderer-specific initial effects.
    nextEffect = firstEffect;
    if (process.env.NODE_ENV !== 'production') {
      startCommitLifeCyclesTimer();
    }
    while (nextEffect !== null) {
      var _error2 = null;
      if (process.env.NODE_ENV !== 'production') {
        _error2 = invokeGuardedCallback(null, commitAllLifeCycles, null, finishedWork);
      } else {
        try {
          commitAllLifeCycles(finishedWork);
        } catch (e) {
          _error2 = e;
        }
      }
      if (_error2 !== null) {
        invariant(nextEffect !== null, 'Should have next effect. This error is likely caused by a bug ' + 'in React. Please file an issue.');
        captureError(nextEffect, _error2);
        if (nextEffect !== null) {
          nextEffect = nextEffect.nextEffect;
        }
      }
    }

    isCommitting = false;
    if (process.env.NODE_ENV !== 'production') {
      stopCommitLifeCyclesTimer();
      stopCommitTimer();
    }
    if (typeof onCommitRoot === 'function') {
      onCommitRoot(finishedWork.stateNode);
    }
    if (process.env.NODE_ENV !== 'production' && ReactFiberInstrumentation.debugTool) {
      ReactFiberInstrumentation.debugTool.onCommitWork(finishedWork);
    }

    // If we caught any errors during this commit, schedule their boundaries
    // to update.
    if (commitPhaseBoundaries) {
      commitPhaseBoundaries.forEach(scheduleErrorRecovery);
      commitPhaseBoundaries = null;
    }

    priorityContext = previousPriorityContext;
  }

  function resetWorkPriority(workInProgress) {
    var newPriority = NoWork;

    // Check for pending update priority. This is usually null so it shouldn't
    // be a perf issue.
    var queue = workInProgress.updateQueue;
    var tag = workInProgress.tag;
    if (queue !== null && (
    // TODO: Revisit once updateQueue is typed properly to distinguish between
    // update payloads for host components and update queues for composites
    tag === ClassComponent || tag === HostRoot)) {
      newPriority = getPendingPriority(queue);
    }

    // TODO: Coroutines need to visit stateNode

    // progressedChild is going to be the child set with the highest priority.
    // Either it is the same as child, or it just bailed out because it choose
    // not to do the work.
    var child = workInProgress.progressedChild;
    while (child !== null) {
      // Ensure that remaining work priority bubbles up.
      if (child.pendingWorkPriority !== NoWork && (newPriority === NoWork || newPriority > child.pendingWorkPriority)) {
        newPriority = child.pendingWorkPriority;
      }
      child = child.sibling;
    }
    workInProgress.pendingWorkPriority = newPriority;
  }

  function completeUnitOfWork(workInProgress) {
    while (true) {
      // The current, flushed, state of this fiber is the alternate.
      // Ideally nothing should rely on this, but relying on it here
      // means that we don't need an additional field on the work in
      // progress.
      var current = workInProgress.alternate;
      var next = completeWork(current, workInProgress);

      var returnFiber = workInProgress['return'];
      var siblingFiber = workInProgress.sibling;

      resetWorkPriority(workInProgress);

      if (next !== null) {
        if (process.env.NODE_ENV !== 'production') {
          stopWorkTimer(workInProgress);
        }
        if (process.env.NODE_ENV !== 'production' && ReactFiberInstrumentation.debugTool) {
          ReactFiberInstrumentation.debugTool.onCompleteWork(workInProgress);
        }
        // If completing this work spawned new work, do that next. We'll come
        // back here again.
        return next;
      }

      if (returnFiber !== null) {
        // Append all the effects of the subtree and this fiber onto the effect
        // list of the parent. The completion order of the children affects the
        // side-effect order.
        if (returnFiber.firstEffect === null) {
          returnFiber.firstEffect = workInProgress.firstEffect;
        }
        if (workInProgress.lastEffect !== null) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
          }
          returnFiber.lastEffect = workInProgress.lastEffect;
        }

        // If this fiber had side-effects, we append it AFTER the children's
        // side-effects. We can perform certain side-effects earlier if
        // needed, by doing multiple passes over the effect list. We don't want
        // to schedule our own side-effect on our own list because if end up
        // reusing children we'll schedule this effect onto itself since we're
        // at the end.
        if (workInProgress.effectTag !== NoEffect) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress;
          } else {
            returnFiber.firstEffect = workInProgress;
          }
          returnFiber.lastEffect = workInProgress;
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        stopWorkTimer(workInProgress);
      }
      if (process.env.NODE_ENV !== 'production' && ReactFiberInstrumentation.debugTool) {
        ReactFiberInstrumentation.debugTool.onCompleteWork(workInProgress);
      }

      if (siblingFiber !== null) {
        // If there is more work to do in this returnFiber, do that next.
        return siblingFiber;
      } else if (returnFiber !== null) {
        // If there's no more work in this returnFiber. Complete the returnFiber.
        workInProgress = returnFiber;
        continue;
      } else {
        // We've reached the root. Unless we're current performing deferred
        // work, we should commit the completed work immediately. If we are
        // performing deferred work, returning null indicates to the caller
        // that we just completed the root so they can handle that case correctly.
        if (nextPriorityLevel < HighPriority) {
          // Otherwise, we should commit immediately.
          commitAllWork(workInProgress);
        } else {
          pendingCommit = workInProgress;
        }
        return null;
      }
    }
  }

  function performUnitOfWork(workInProgress) {
    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.
    var current = workInProgress.alternate;

    // See if beginning this work spawns more work.
    if (process.env.NODE_ENV !== 'production') {
      startWorkTimer(workInProgress);
    }
    var next = beginWork(current, workInProgress, nextPriorityLevel);
    if (process.env.NODE_ENV !== 'production' && ReactFiberInstrumentation.debugTool) {
      ReactFiberInstrumentation.debugTool.onBeginWork(workInProgress);
    }

    if (next === null) {
      // If this doesn't spawn new work, complete the current work.
      next = completeUnitOfWork(workInProgress);
    }

    ReactCurrentOwner.current = null;
    if (process.env.NODE_ENV !== 'production') {
      ReactDebugCurrentFiber.current = null;
    }

    return next;
  }

  function performFailedUnitOfWork(workInProgress) {
    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.
    var current = workInProgress.alternate;

    // See if beginning this work spawns more work.
    if (process.env.NODE_ENV !== 'production') {
      startWorkTimer(workInProgress);
    }
    var next = beginFailedWork(current, workInProgress, nextPriorityLevel);
    if (process.env.NODE_ENV !== 'production' && ReactFiberInstrumentation.debugTool) {
      ReactFiberInstrumentation.debugTool.onBeginWork(workInProgress);
    }

    if (next === null) {
      // If this doesn't spawn new work, complete the current work.
      next = completeUnitOfWork(workInProgress);
    }

    ReactCurrentOwner.current = null;
    if (process.env.NODE_ENV !== 'production') {
      ReactDebugCurrentFiber.current = null;
    }

    return next;
  }

  function performDeferredWork(deadline) {
    // We pass the lowest deferred priority here because it acts as a minimum.
    // Higher priorities will also be performed.
    isDeferredCallbackScheduled = false;
    performWork(OffscreenPriority, deadline);
  }

  function performAnimationWork() {
    isAnimationCallbackScheduled = false;
    performWork(AnimationPriority, null);
  }

  function clearErrors() {
    if (nextUnitOfWork === null) {
      nextUnitOfWork = findNextUnitOfWork();
    }
    // Keep performing work until there are no more errors
    while (capturedErrors !== null && capturedErrors.size && nextUnitOfWork !== null && nextPriorityLevel !== NoWork && nextPriorityLevel <= TaskPriority) {
      if (hasCapturedError(nextUnitOfWork)) {
        // Use a forked version of performUnitOfWork
        nextUnitOfWork = performFailedUnitOfWork(nextUnitOfWork);
      } else {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      }
      if (nextUnitOfWork === null) {
        // If performUnitOfWork returns null, that means we just committed
        // a root. Normally we'd need to clear any errors that were scheduled
        // during the commit phase. But we're already clearing errors, so
        // we can continue.
        nextUnitOfWork = findNextUnitOfWork();
      }
    }
  }

  function workLoop(priorityLevel, deadline) {
    // Clear any errors.
    clearErrors();

    if (nextUnitOfWork === null) {
      nextUnitOfWork = findNextUnitOfWork();
    }

    var hostRootTimeMarker = void 0;
    if (ReactFeatureFlags.logTopLevelRenders && nextUnitOfWork !== null && nextUnitOfWork.tag === HostRoot && nextUnitOfWork.child !== null) {
      var _componentName = getComponentName(nextUnitOfWork.child) || '';
      hostRootTimeMarker = 'React update: ' + _componentName;
      console.time(hostRootTimeMarker);
    }

    // If there's a deadline, and we're not performing Task work, perform work
    // using this loop that checks the deadline on every iteration.
    if (deadline !== null && priorityLevel > TaskPriority) {
      // The deferred work loop will run until there's no time left in
      // the current frame.
      while (nextUnitOfWork !== null && !deadlineHasExpired) {
        if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
          // In a deferred work batch, iff nextUnitOfWork returns null, we just
          // completed a root and a pendingCommit exists. Logically, we could
          // omit either of the checks in the following condition, but we need
          // both to satisfy Flow.
          if (nextUnitOfWork === null && pendingCommit !== null) {
            // If we have time, we should commit the work now.
            if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
              commitAllWork(pendingCommit);
              nextUnitOfWork = findNextUnitOfWork();
              // Clear any errors that were scheduled during the commit phase.
              clearErrors();
            } else {
              deadlineHasExpired = true;
            }
            // Otherwise the root will committed in the next frame.
          }
        } else {
          deadlineHasExpired = true;
        }
      }
    } else {
      // If there's no deadline, or if we're performing Task work, use this loop
      // that doesn't check how much time is remaining. It will keep running
      // until we run out of work at this priority level.
      while (nextUnitOfWork !== null && nextPriorityLevel !== NoWork && nextPriorityLevel <= priorityLevel) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        if (nextUnitOfWork === null) {
          nextUnitOfWork = findNextUnitOfWork();
          // performUnitOfWork returned null, which means we just committed a
          // root. Clear any errors that were scheduled during the commit phase.
          clearErrors();
        }
      }
    }

    if (hostRootTimeMarker) {
      console.timeEnd(hostRootTimeMarker);
    }
  }

  function performWork(priorityLevel, deadline) {
    if (process.env.NODE_ENV !== 'production') {
      startWorkLoopTimer();
    }

    invariant(!isPerformingWork, 'performWork was called recursively. This error is likely caused ' + 'by a bug in React. Please file an issue.');
    isPerformingWork = true;
    var isPerformingDeferredWork = !!deadline;

    // This outer loop exists so that we can restart the work loop after
    // catching an error. It also lets us flush Task work at the end of a
    // deferred batch.
    while (priorityLevel !== NoWork && !fatalError) {
      invariant(deadline !== null || priorityLevel < HighPriority, 'Cannot perform deferred work without a deadline. This error is ' + 'likely caused by a bug in React. Please file an issue.');

      // Before starting any work, check to see if there are any pending
      // commits from the previous frame.
      if (pendingCommit !== null && !deadlineHasExpired) {
        commitAllWork(pendingCommit);
      }

      // Nothing in performWork should be allowed to throw. All unsafe
      // operations must happen within workLoop, which is extracted to a
      // separate function so that it can be optimized by the JS engine.
      priorityContextBeforeReconciliation = priorityContext;
      var _error3 = null;
      if (process.env.NODE_ENV !== 'production') {
        _error3 = invokeGuardedCallback(null, workLoop, null, priorityLevel, deadline);
      } else {
        try {
          workLoop(priorityLevel, deadline);
        } catch (e) {
          _error3 = e;
        }
      }
      // Reset the priority context to its value before reconcilation.
      priorityContext = priorityContextBeforeReconciliation;

      if (_error3 !== null) {
        // We caught an error during either the begin or complete phases.
        var failedWork = nextUnitOfWork;

        if (failedWork !== null) {
          // "Capture" the error by finding the nearest boundary. If there is no
          // error boundary, the nearest host container acts as one. If
          // captureError returns null, the error was intentionally ignored.
          var maybeBoundary = captureError(failedWork, _error3);
          if (maybeBoundary !== null) {
            var boundary = maybeBoundary;

            // Complete the boundary as if it rendered null. This will unmount
            // the failed tree.
            beginFailedWork(boundary.alternate, boundary, priorityLevel);

            // The next unit of work is now the boundary that captured the error.
            // Conceptually, we're unwinding the stack. We need to unwind the
            // context stack, too, from the failed work to the boundary that
            // captured the error.
            // TODO: If we set the memoized props in beginWork instead of
            // completeWork, rather than unwind the stack, we can just restart
            // from the root. Can't do that until then because without memoized
            // props, the nodes higher up in the tree will rerender unnecessarily.
            unwindContexts(failedWork, boundary);
            nextUnitOfWork = completeUnitOfWork(boundary);
          }
          // Continue performing work
          continue;
        } else if (fatalError === null) {
          // There is no current unit of work. This is a worst-case scenario
          // and should only be possible if there's a bug in the renderer, e.g.
          // inside resetAfterCommit.
          fatalError = _error3;
        }
      }

      // Stop performing work
      priorityLevel = NoWork;

      // If have we more work, and we're in a deferred batch, check to see
      // if the deadline has expired.
      if (nextPriorityLevel !== NoWork && isPerformingDeferredWork && !deadlineHasExpired) {
        // We have more time to do work.
        priorityLevel = nextPriorityLevel;
        continue;
      }

      // There might be work left. Depending on the priority, we should
      // either perform it now or schedule a callback to perform it later.
      switch (nextPriorityLevel) {
        case SynchronousPriority:
        case TaskPriority:
          // Perform work immediately by switching the priority level
          // and continuing the loop.
          priorityLevel = nextPriorityLevel;
          break;
        case AnimationPriority:
          scheduleAnimationCallback(performAnimationWork);
          // Even though the next unit of work has animation priority, there
          // may still be deferred work left over as well. I think this is
          // only important for unit tests. In a real app, a deferred callback
          // would be scheduled during the next animation frame.
          scheduleDeferredCallback(performDeferredWork);
          break;
        case HighPriority:
        case LowPriority:
        case OffscreenPriority:
          scheduleDeferredCallback(performDeferredWork);
          break;
      }
    }

    var errorToThrow = fatalError || firstUncaughtError;

    // We're done performing work. Time to clean up.
    isPerformingWork = false;
    deadlineHasExpired = false;
    fatalError = null;
    firstUncaughtError = null;
    capturedErrors = null;
    failedBoundaries = null;
    if (process.env.NODE_ENV !== 'production') {
      stopWorkLoopTimer();
    }

    // It's safe to throw any unhandled errors.
    if (errorToThrow !== null) {
      throw errorToThrow;
    }
  }

  // Returns the boundary that captured the error, or null if the error is ignored
  function captureError(failedWork, error) {
    // It is no longer valid because we exited the user code.
    ReactCurrentOwner.current = null;
    if (process.env.NODE_ENV !== 'production') {
      ReactDebugCurrentFiber.current = null;
      ReactDebugCurrentFiber.phase = null;
    }
    // It is no longer valid because this unit of work failed.
    nextUnitOfWork = null;

    // Search for the nearest error boundary.
    var boundary = null;

    // Passed to logCapturedError()
    var errorBoundaryFound = false;
    var willRetry = false;
    var errorBoundaryName = null;

    // Host containers are a special case. If the failed work itself is a host
    // container, then it acts as its own boundary. In all other cases, we
    // ignore the work itself and only search through the parents.
    if (failedWork.tag === HostRoot) {
      boundary = failedWork;

      if (isFailedBoundary(failedWork)) {
        // If this root already failed, there must have been an error when
        // attempting to unmount it. This is a worst-case scenario and
        // should only be possible if there's a bug in the renderer.
        fatalError = error;
      }
    } else {
      var node = failedWork['return'];
      while (node !== null && boundary === null) {
        if (node.tag === ClassComponent) {
          var instance = node.stateNode;
          if (typeof instance.unstable_handleError === 'function') {
            errorBoundaryFound = true;
            errorBoundaryName = getComponentName(node);

            // Found an error boundary!
            boundary = node;
            willRetry = true;
          }
        } else if (node.tag === HostRoot) {
          // Treat the root like a no-op error boundary.
          boundary = node;
        }

        if (isFailedBoundary(node)) {
          // This boundary is already in a failed state.

          // If we're currently unmounting, that means this error was
          // thrown while unmounting a failed subtree. We should ignore
          // the error.
          if (isUnmounting) {
            return null;
          }

          // If we're in the commit phase, we should check to see if
          // this boundary already captured an error during this commit.
          // This case exists because multiple errors can be thrown during
          // a single commit without interruption.
          if (commitPhaseBoundaries !== null && (commitPhaseBoundaries.has(node) || node.alternate !== null && commitPhaseBoundaries.has(node.alternate))) {
            // If so, we should ignore this error.
            return null;
          }

          // The error should propagate to the next boundary -— we keep looking.
          boundary = null;
          willRetry = false;
        }

        node = node['return'];
      }
    }

    if (boundary !== null) {
      // Add to the collection of failed boundaries. This lets us know that
      // subsequent errors in this subtree should propagate to the next boundary.
      if (failedBoundaries === null) {
        failedBoundaries = new Set();
      }
      failedBoundaries.add(boundary);

      // This method is unsafe outside of the begin and complete phases.
      // We might be in the commit phase when an error is captured.
      // The risk is that the return path from this Fiber may not be accurate.
      // That risk is acceptable given the benefit of providing users more context.
      var _componentStack = getStackAddendumByWorkInProgressFiber(failedWork);
      var _componentName2 = getComponentName(failedWork);

      // Add to the collection of captured errors. This is stored as a global
      // map of errors and their component stack location keyed by the boundaries
      // that capture them. We mostly use this Map as a Set; it's a Map only to
      // avoid adding a field to Fiber to store the error.
      if (capturedErrors === null) {
        capturedErrors = new Map();
      }
      capturedErrors.set(boundary, {
        componentName: _componentName2,
        componentStack: _componentStack,
        error: error,
        errorBoundary: errorBoundaryFound ? boundary.stateNode : null,
        errorBoundaryFound: errorBoundaryFound,
        errorBoundaryName: errorBoundaryName,
        willRetry: willRetry
      });

      // If we're in the commit phase, defer scheduling an update on the
      // boundary until after the commit is complete
      if (isCommitting) {
        if (commitPhaseBoundaries === null) {
          commitPhaseBoundaries = new Set();
        }
        commitPhaseBoundaries.add(boundary);
      } else {
        // Otherwise, schedule an update now.
        scheduleErrorRecovery(boundary);
      }
      return boundary;
    } else if (firstUncaughtError === null) {
      // If no boundary is found, we'll need to throw the error
      firstUncaughtError = error;
    }
    return null;
  }

  function hasCapturedError(fiber) {
    // TODO: capturedErrors should store the boundary instance, to avoid needing
    // to check the alternate.
    return capturedErrors !== null && (capturedErrors.has(fiber) || fiber.alternate !== null && capturedErrors.has(fiber.alternate));
  }

  function isFailedBoundary(fiber) {
    // TODO: failedBoundaries should store the boundary instance, to avoid
    // needing to check the alternate.
    return failedBoundaries !== null && (failedBoundaries.has(fiber) || fiber.alternate !== null && failedBoundaries.has(fiber.alternate));
  }

  function commitErrorHandling(effectfulFiber) {
    var capturedError = void 0;
    if (capturedErrors !== null) {
      capturedError = capturedErrors.get(effectfulFiber);
      capturedErrors['delete'](effectfulFiber);
      if (capturedError == null) {
        if (effectfulFiber.alternate !== null) {
          effectfulFiber = effectfulFiber.alternate;
          capturedError = capturedErrors.get(effectfulFiber);
          capturedErrors['delete'](effectfulFiber);
        }
      }
    }

    invariant(capturedError != null, 'No error for given unit of work. This error is likely caused by a ' + 'bug in React. Please file an issue.');

    var error = capturedError.error;
    try {
      logCapturedError(capturedError);
    } catch (e) {
      // Prevent cycle if logCapturedError() throws.
      // A cycle may still occur if logCapturedError renders a component that throws.
      console.error(e);
    }

    switch (effectfulFiber.tag) {
      case ClassComponent:
        var instance = effectfulFiber.stateNode;

        var info = {
          componentStack: capturedError.componentStack
        };

        // Allow the boundary to handle the error, usually by scheduling
        // an update to itself
        instance.unstable_handleError(error, info);
        return;
      case HostRoot:
        if (firstUncaughtError === null) {
          // If this is the host container, we treat it as a no-op error
          // boundary. We'll throw the first uncaught error once it's safe to
          // do so, at the end of the batch.
          firstUncaughtError = error;
        }
        return;
      default:
        invariant(false, 'Invalid type of work. This error is likely caused by a bug in ' + 'React. Please file an issue.');
    }
  }

  function unwindContexts(from, to) {
    var node = from;
    while (node !== null && node !== to && node.alternate !== to) {
      switch (node.tag) {
        case ClassComponent:
          popContextProvider(node);
          break;
        case HostComponent:
          popHostContext(node);
          break;
        case HostRoot:
          popHostContainer(node);
          break;
        case HostPortal:
          popHostContainer(node);
          break;
      }
      if (process.env.NODE_ENV !== 'production') {
        stopWorkTimer(node);
      }
      node = node['return'];
    }
  }

  function scheduleRoot(root, priorityLevel) {
    if (priorityLevel === NoWork) {
      return;
    }

    if (!root.isScheduled) {
      root.isScheduled = true;
      if (lastScheduledRoot) {
        // Schedule ourselves to the end.
        lastScheduledRoot.nextScheduledRoot = root;
        lastScheduledRoot = root;
      } else {
        // We're the only work scheduled.
        nextScheduledRoot = root;
        lastScheduledRoot = root;
      }
    }
  }

  function scheduleUpdate(fiber, priorityLevel) {
    if (process.env.NODE_ENV !== 'production') {
      recordScheduleUpdate();
    }

    if (priorityLevel <= nextPriorityLevel) {
      // We must reset the current unit of work pointer so that we restart the
      // search from the root during the next tick, in case there is now higher
      // priority work somewhere earlier than before.
      nextUnitOfWork = null;
    }

    if (process.env.NODE_ENV !== 'production') {
      if (fiber.tag === ClassComponent) {
        var instance = fiber.stateNode;
        warnAboutInvalidUpdates(instance);
      }
    }

    var node = fiber;
    var shouldContinue = true;
    while (node !== null && shouldContinue) {
      // Walk the parent path to the root and update each node's priority. Once
      // we reach a node whose priority matches (and whose alternate's priority
      // matches) we can exit safely knowing that the rest of the path is correct.
      shouldContinue = false;
      if (node.pendingWorkPriority === NoWork || node.pendingWorkPriority > priorityLevel) {
        // Priority did not match. Update and keep going.
        shouldContinue = true;
        node.pendingWorkPriority = priorityLevel;
      }
      if (node.alternate !== null) {
        if (node.alternate.pendingWorkPriority === NoWork || node.alternate.pendingWorkPriority > priorityLevel) {
          // Priority did not match. Update and keep going.
          shouldContinue = true;
          node.alternate.pendingWorkPriority = priorityLevel;
        }
      }
      if (node['return'] === null) {
        if (node.tag === HostRoot) {
          var root = node.stateNode;
          scheduleRoot(root, priorityLevel);
          // Depending on the priority level, either perform work now or
          // schedule a callback to perform work later.
          switch (priorityLevel) {
            case SynchronousPriority:
              performWork(SynchronousPriority, null);
              return;
            case TaskPriority:
              // TODO: If we're not already performing work, schedule a
              // deferred callback.
              return;
            case AnimationPriority:
              scheduleAnimationCallback(performAnimationWork);
              return;
            case HighPriority:
            case LowPriority:
            case OffscreenPriority:
              scheduleDeferredCallback(performDeferredWork);
              return;
          }
        } else {
          if (process.env.NODE_ENV !== 'production') {
            if (fiber.tag === ClassComponent) {
              warnAboutUpdateOnUnmounted(fiber.stateNode);
            }
          }
          return;
        }
      }
      node = node['return'];
    }
  }

  function getPriorityContext() {
    // If we're in a batch, or if we're already performing work, downgrade sync
    // priority to task priority
    if (priorityContext === SynchronousPriority && (isPerformingWork || isBatchingUpdates)) {
      return TaskPriority;
    }
    return priorityContext;
  }

  function scheduleErrorRecovery(fiber) {
    scheduleUpdate(fiber, TaskPriority);
  }

  function performWithPriority(priorityLevel, fn) {
    var previousPriorityContext = priorityContext;
    priorityContext = priorityLevel;
    try {
      fn();
    } finally {
      priorityContext = previousPriorityContext;
    }
  }

  function batchedUpdates(fn, a) {
    var previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = true;
    try {
      return fn(a);
    } finally {
      isBatchingUpdates = previousIsBatchingUpdates;
      // If we're not already inside a batch, we need to flush any task work
      // that was created by the user-provided function.
      if (!isPerformingWork && !isBatchingUpdates) {
        performWork(TaskPriority, null);
      }
    }
  }

  function unbatchedUpdates(fn) {
    var previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = false;
    try {
      return fn();
    } finally {
      isBatchingUpdates = previousIsBatchingUpdates;
    }
  }

  function syncUpdates(fn) {
    var previousPriorityContext = priorityContext;
    priorityContext = SynchronousPriority;
    try {
      return fn();
    } finally {
      priorityContext = previousPriorityContext;
    }
  }

  function deferredUpdates(fn) {
    var previousPriorityContext = priorityContext;
    priorityContext = LowPriority;
    try {
      return fn();
    } finally {
      priorityContext = previousPriorityContext;
    }
  }

  return {
    scheduleUpdate: scheduleUpdate,
    getPriorityContext: getPriorityContext,
    performWithPriority: performWithPriority,
    batchedUpdates: batchedUpdates,
    unbatchedUpdates: unbatchedUpdates,
    syncUpdates: syncUpdates,
    deferredUpdates: deferredUpdates
  };
};