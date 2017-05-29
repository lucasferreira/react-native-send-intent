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

var _require = require('./ReactChildFiber'),
    mountChildFibersInPlace = _require.mountChildFibersInPlace,
    reconcileChildFibers = _require.reconcileChildFibers,
    reconcileChildFibersInPlace = _require.reconcileChildFibersInPlace,
    cloneChildFibers = _require.cloneChildFibers;

var _require2 = require('./ReactFiberUpdateQueue'),
    beginUpdateQueue = _require2.beginUpdateQueue;

var ReactTypeOfWork = require('./ReactTypeOfWork');

var _require3 = require('./ReactFiberContext'),
    getMaskedContext = _require3.getMaskedContext,
    getUnmaskedContext = _require3.getUnmaskedContext,
    hasContextChanged = _require3.hasContextChanged,
    pushContextProvider = _require3.pushContextProvider,
    pushTopLevelContextObject = _require3.pushTopLevelContextObject,
    invalidateContextProvider = _require3.invalidateContextProvider;

var IndeterminateComponent = ReactTypeOfWork.IndeterminateComponent,
    FunctionalComponent = ReactTypeOfWork.FunctionalComponent,
    ClassComponent = ReactTypeOfWork.ClassComponent,
    HostRoot = ReactTypeOfWork.HostRoot,
    HostComponent = ReactTypeOfWork.HostComponent,
    HostText = ReactTypeOfWork.HostText,
    HostPortal = ReactTypeOfWork.HostPortal,
    CoroutineComponent = ReactTypeOfWork.CoroutineComponent,
    CoroutineHandlerPhase = ReactTypeOfWork.CoroutineHandlerPhase,
    YieldComponent = ReactTypeOfWork.YieldComponent,
    Fragment = ReactTypeOfWork.Fragment;

var _require4 = require('./ReactPriorityLevel'),
    NoWork = _require4.NoWork,
    OffscreenPriority = _require4.OffscreenPriority;

var _require5 = require('./ReactTypeOfSideEffect'),
    Placement = _require5.Placement,
    ContentReset = _require5.ContentReset,
    Err = _require5.Err,
    Ref = _require5.Ref;

var ReactCurrentOwner = require('react/lib/ReactCurrentOwner');
var ReactFiberClassComponent = require('./ReactFiberClassComponent');
var invariant = require('fbjs/lib/invariant');

if (process.env.NODE_ENV !== 'production') {
  var ReactDebugCurrentFiber = require('./ReactDebugCurrentFiber');

  var _require6 = require('./ReactDebugFiberPerf'),
      cancelWorkTimer = _require6.cancelWorkTimer;

  var warning = require('fbjs/lib/warning');

  var warnedAboutStatelessRefs = {};
}

module.exports = function (config, hostContext, scheduleUpdate, getPriorityContext) {
  var shouldSetTextContent = config.shouldSetTextContent,
      useSyncScheduling = config.useSyncScheduling,
      shouldDeprioritizeSubtree = config.shouldDeprioritizeSubtree;
  var pushHostContext = hostContext.pushHostContext,
      pushHostContainer = hostContext.pushHostContainer;

  var _ReactFiberClassCompo = ReactFiberClassComponent(scheduleUpdate, getPriorityContext, memoizeProps, memoizeState),
      adoptClassInstance = _ReactFiberClassCompo.adoptClassInstance,
      constructClassInstance = _ReactFiberClassCompo.constructClassInstance,
      mountClassInstance = _ReactFiberClassCompo.mountClassInstance,
      resumeMountClassInstance = _ReactFiberClassCompo.resumeMountClassInstance,
      updateClassInstance = _ReactFiberClassCompo.updateClassInstance;

  function markChildAsProgressed(current, workInProgress, priorityLevel) {
    // We now have clones. Let's store them as the currently progressed work.
    workInProgress.progressedChild = workInProgress.child;
    workInProgress.progressedPriority = priorityLevel;
    if (current !== null) {
      // We also store it on the current. When the alternate swaps in we can
      // continue from this point.
      current.progressedChild = workInProgress.progressedChild;
      current.progressedPriority = workInProgress.progressedPriority;
    }
  }

  function clearDeletions(workInProgress) {
    workInProgress.progressedFirstDeletion = workInProgress.progressedLastDeletion = null;
  }

  function transferDeletions(workInProgress) {
    // Any deletions get added first into the effect list.
    workInProgress.firstEffect = workInProgress.progressedFirstDeletion;
    workInProgress.lastEffect = workInProgress.progressedLastDeletion;
  }

  function reconcileChildren(current, workInProgress, nextChildren) {
    var priorityLevel = workInProgress.pendingWorkPriority;
    reconcileChildrenAtPriority(current, workInProgress, nextChildren, priorityLevel);
  }

  function reconcileChildrenAtPriority(current, workInProgress, nextChildren, priorityLevel) {
    // At this point any memoization is no longer valid since we'll have changed
    // the children.
    workInProgress.memoizedProps = null;
    if (current === null) {
      // If this is a fresh new component that hasn't been rendered yet, we
      // won't update its child set by applying minimal side-effects. Instead,
      // we will add them all to the child before it gets rendered. That means
      // we can optimize this reconciliation pass by not tracking side-effects.
      workInProgress.child = mountChildFibersInPlace(workInProgress, workInProgress.child, nextChildren, priorityLevel);
    } else if (current.child === workInProgress.child) {
      // If the current child is the same as the work in progress, it means that
      // we haven't yet started any work on these children. Therefore, we use
      // the clone algorithm to create a copy of all the current children.

      // If we had any progressed work already, that is invalid at this point so
      // let's throw it out.
      clearDeletions(workInProgress);

      workInProgress.child = reconcileChildFibers(workInProgress, workInProgress.child, nextChildren, priorityLevel);

      transferDeletions(workInProgress);
    } else {
      // If, on the other hand, it is already using a clone, that means we've
      // already begun some work on this tree and we can continue where we left
      // off by reconciling against the existing children.
      workInProgress.child = reconcileChildFibersInPlace(workInProgress, workInProgress.child, nextChildren, priorityLevel);

      transferDeletions(workInProgress);
    }
    markChildAsProgressed(current, workInProgress, priorityLevel);
  }

  function updateFragment(current, workInProgress) {
    var nextChildren = workInProgress.pendingProps;
    if (hasContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
      if (nextChildren === null) {
        nextChildren = workInProgress.memoizedProps;
      }
    } else if (nextChildren === null || workInProgress.memoizedProps === nextChildren) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }
    reconcileChildren(current, workInProgress, nextChildren);
    memoizeProps(workInProgress, nextChildren);
    return workInProgress.child;
  }

  function markRef(current, workInProgress) {
    var ref = workInProgress.ref;
    if (ref !== null && (!current || current.ref !== ref)) {
      // Schedule a Ref effect
      workInProgress.effectTag |= Ref;
    }
  }

  function updateFunctionalComponent(current, workInProgress) {
    var fn = workInProgress.type;
    var nextProps = workInProgress.pendingProps;

    var memoizedProps = workInProgress.memoizedProps;
    if (hasContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
      if (nextProps === null) {
        nextProps = memoizedProps;
      }
    } else {
      if (nextProps === null || memoizedProps === nextProps) {
        return bailoutOnAlreadyFinishedWork(current, workInProgress);
      }
      // TODO: Disable this before release, since it is not part of the public API
      // I use this for testing to compare the relative overhead of classes.
      if (typeof fn.shouldComponentUpdate === 'function' && !fn.shouldComponentUpdate(memoizedProps, nextProps)) {
        // Memoize props even if shouldComponentUpdate returns false
        memoizeProps(workInProgress, nextProps);
        return bailoutOnAlreadyFinishedWork(current, workInProgress);
      }
    }

    var unmaskedContext = getUnmaskedContext(workInProgress);
    var context = getMaskedContext(workInProgress, unmaskedContext);

    var nextChildren;

    if (process.env.NODE_ENV !== 'production') {
      ReactCurrentOwner.current = workInProgress;
      ReactDebugCurrentFiber.phase = 'render';
      nextChildren = fn(nextProps, context);
      ReactDebugCurrentFiber.phase = null;
    } else {
      nextChildren = fn(nextProps, context);
    }
    reconcileChildren(current, workInProgress, nextChildren);
    memoizeProps(workInProgress, nextProps);
    return workInProgress.child;
  }

  function updateClassComponent(current, workInProgress, priorityLevel) {
    // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.
    var hasContext = pushContextProvider(workInProgress);

    var shouldUpdate = void 0;
    if (current === null) {
      if (!workInProgress.stateNode) {
        // In the initial pass we might need to construct the instance.
        constructClassInstance(workInProgress);
        mountClassInstance(workInProgress, priorityLevel);
        shouldUpdate = true;
      } else {
        // In a resume, we'll already have an instance we can reuse.
        shouldUpdate = resumeMountClassInstance(workInProgress, priorityLevel);
      }
    } else {
      shouldUpdate = updateClassInstance(current, workInProgress, priorityLevel);
    }
    return finishClassComponent(current, workInProgress, shouldUpdate, hasContext);
  }

  function finishClassComponent(current, workInProgress, shouldUpdate, hasContext) {
    // Refs should update even if shouldComponentUpdate returns false
    markRef(current, workInProgress);

    if (!shouldUpdate) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    var instance = workInProgress.stateNode;

    // Rerender
    ReactCurrentOwner.current = workInProgress;
    var nextChildren = void 0;
    if (process.env.NODE_ENV !== 'production') {
      ReactDebugCurrentFiber.phase = 'render';
      nextChildren = instance.render();
      ReactDebugCurrentFiber.phase = null;
    } else {
      nextChildren = instance.render();
    }
    reconcileChildren(current, workInProgress, nextChildren);
    // Memoize props and state using the values we just used to render.
    // TODO: Restructure so we never read values from the instance.
    memoizeState(workInProgress, instance.state);
    memoizeProps(workInProgress, instance.props);

    // The context might have changed so we need to recalculate it.
    if (hasContext) {
      invalidateContextProvider(workInProgress);
    }
    return workInProgress.child;
  }

  function updateHostRoot(current, workInProgress, priorityLevel) {
    var root = workInProgress.stateNode;
    if (root.pendingContext) {
      pushTopLevelContextObject(workInProgress, root.pendingContext, root.pendingContext !== root.context);
    } else if (root.context) {
      // Should always be set
      pushTopLevelContextObject(workInProgress, root.context, false);
    }

    pushHostContainer(workInProgress, root.containerInfo);

    var updateQueue = workInProgress.updateQueue;
    if (updateQueue !== null) {
      var prevState = workInProgress.memoizedState;
      var state = beginUpdateQueue(workInProgress, updateQueue, null, prevState, null, priorityLevel);
      if (prevState === state) {
        // If the state is the same as before, that's a bailout because we had
        // no work matching this priority.
        return bailoutOnAlreadyFinishedWork(current, workInProgress);
      }
      var element = state.element;
      reconcileChildren(current, workInProgress, element);
      memoizeState(workInProgress, state);
      return workInProgress.child;
    }
    // If there is no update queue, that's a bailout because the root has no props.
    return bailoutOnAlreadyFinishedWork(current, workInProgress);
  }

  function updateHostComponent(current, workInProgress) {
    pushHostContext(workInProgress);

    var nextProps = workInProgress.pendingProps;
    var prevProps = current !== null ? current.memoizedProps : null;
    var memoizedProps = workInProgress.memoizedProps;
    if (hasContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
      if (nextProps === null) {
        nextProps = memoizedProps;
        invariant(nextProps !== null, 'We should always have pending or current props. This error is ' + 'likely caused by a bug in React. Please file an issue.');
      }
    } else if (nextProps === null || memoizedProps === nextProps) {
      if (!useSyncScheduling && shouldDeprioritizeSubtree(workInProgress.type, memoizedProps) && workInProgress.pendingWorkPriority !== OffscreenPriority) {
        // This subtree still has work, but it should be deprioritized so we need
        // to bail out and not do any work yet.
        // TODO: It would be better if this tree got its correct priority set
        // during scheduleUpdate instead because otherwise we'll start a higher
        // priority reconciliation first before we can get down here. However,
        // that is a bit tricky since workInProgress and current can have
        // different "hidden" settings.
        var child = workInProgress.progressedChild;
        while (child !== null) {
          // To ensure that this subtree gets its priority reset, the children
          // need to be reset.
          child.pendingWorkPriority = OffscreenPriority;
          child = child.sibling;
        }
        return null;
      }
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    var nextChildren = nextProps.children;
    var isDirectTextChild = shouldSetTextContent(nextProps);

    if (isDirectTextChild) {
      // We special case a direct text child of a host node. This is a common
      // case. We won't handle it as a reified child. We will instead handle
      // this in the host environment that also have access to this prop. That
      // avoids allocating another HostText fiber and traversing it.
      nextChildren = null;
    } else if (prevProps && shouldSetTextContent(prevProps)) {
      // If we're switching from a direct text child to a normal child, or to
      // empty, we need to schedule the text content to be reset.
      workInProgress.effectTag |= ContentReset;
    }

    markRef(current, workInProgress);

    if (!useSyncScheduling && shouldDeprioritizeSubtree(workInProgress.type, nextProps) && workInProgress.pendingWorkPriority !== OffscreenPriority) {
      // If this host component is hidden, we can bail out on the children.
      // We'll rerender the children later at the lower priority.

      // It is unfortunate that we have to do the reconciliation of these
      // children already since that will add them to the tree even though
      // they are not actually done yet. If this is a large set it is also
      // confusing that this takes time to do right now instead of later.

      if (workInProgress.progressedPriority === OffscreenPriority) {
        // If we already made some progress on the offscreen priority before,
        // then we should continue from where we left off.
        workInProgress.child = workInProgress.progressedChild;
      }

      // Reconcile the children and stash them for later work.
      reconcileChildrenAtPriority(current, workInProgress, nextChildren, OffscreenPriority);
      memoizeProps(workInProgress, nextProps);
      workInProgress.child = current !== null ? current.child : null;

      if (current === null) {
        // If this doesn't have a current we won't track it for placement
        // effects. However, when we come back around to this we have already
        // inserted the parent which means that we'll infact need to make this a
        // placement.
        // TODO: There has to be a better solution to this problem.
        var _child = workInProgress.progressedChild;
        while (_child !== null) {
          _child.effectTag = Placement;
          _child = _child.sibling;
        }
      }

      // Abort and don't process children yet.
      return null;
    } else {
      reconcileChildren(current, workInProgress, nextChildren);
      memoizeProps(workInProgress, nextProps);
      return workInProgress.child;
    }
  }

  function updateHostText(current, workInProgress) {
    var nextProps = workInProgress.pendingProps;
    if (nextProps === null) {
      nextProps = workInProgress.memoizedProps;
    }
    memoizeProps(workInProgress, nextProps);
    // Nothing to do here. This is terminal. We'll do the completion step
    // immediately after.
    return null;
  }

  function mountIndeterminateComponent(current, workInProgress, priorityLevel) {
    invariant(current === null, 'An indeterminate component should never have mounted. This error is ' + 'likely caused by a bug in React. Please file an issue.');
    var fn = workInProgress.type;
    var props = workInProgress.pendingProps;
    var unmaskedContext = getUnmaskedContext(workInProgress);
    var context = getMaskedContext(workInProgress, unmaskedContext);

    var value;

    if (process.env.NODE_ENV !== 'production') {
      ReactCurrentOwner.current = workInProgress;
      value = fn(props, context);
    } else {
      value = fn(props, context);
    }

    if (typeof value === 'object' && value !== null && typeof value.render === 'function') {
      // Proceed under the assumption that this is a class instance
      workInProgress.tag = ClassComponent;

      // Push context providers early to prevent context stack mismatches.
      // During mounting we don't know the child context yet as the instance doesn't exist.
      // We will invalidate the child context in finishClassComponent() right after rendering.
      var hasContext = pushContextProvider(workInProgress);
      adoptClassInstance(workInProgress, value);
      mountClassInstance(workInProgress, priorityLevel);
      return finishClassComponent(current, workInProgress, true, hasContext);
    } else {
      // Proceed under the assumption that this is a functional component
      workInProgress.tag = FunctionalComponent;
      if (process.env.NODE_ENV !== 'production') {
        var Component = workInProgress.type;

        if (Component) {
          process.env.NODE_ENV !== 'production' ? warning(!Component.childContextTypes, '%s(...): childContextTypes cannot be defined on a functional component.', Component.displayName || Component.name || 'Component') : void 0;
        }
        if (workInProgress.ref !== null) {
          var info = '';
          var ownerName = ReactDebugCurrentFiber.getCurrentFiberOwnerName();
          if (ownerName) {
            info += '\n\nCheck the render method of `' + ownerName + '`.';
          }

          var warningKey = ownerName || workInProgress._debugID || '';
          var debugSource = workInProgress._debugSource;
          if (debugSource) {
            warningKey = debugSource.fileName + ':' + debugSource.lineNumber;
          }
          if (!warnedAboutStatelessRefs[warningKey]) {
            warnedAboutStatelessRefs[warningKey] = true;
            process.env.NODE_ENV !== 'production' ? warning(false, 'Stateless function components cannot be given refs. ' + 'Attempts to access this ref will fail.%s%s', info, ReactDebugCurrentFiber.getCurrentFiberStackAddendum()) : void 0;
          }
        }
      }
      reconcileChildren(current, workInProgress, value);
      memoizeProps(workInProgress, props);
      return workInProgress.child;
    }
  }

  function updateCoroutineComponent(current, workInProgress) {
    var nextCoroutine = workInProgress.pendingProps;
    if (hasContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
      if (nextCoroutine === null) {
        nextCoroutine = current && current.memoizedProps;
        invariant(nextCoroutine !== null, 'We should always have pending or current props. This error is ' + 'likely caused by a bug in React. Please file an issue.');
      }
    } else if (nextCoroutine === null || workInProgress.memoizedProps === nextCoroutine) {
      nextCoroutine = workInProgress.memoizedProps;
      // TODO: When bailing out, we might need to return the stateNode instead
      // of the child. To check it for work.
      // return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    var nextChildren = nextCoroutine.children;
    var priorityLevel = workInProgress.pendingWorkPriority;

    // The following is a fork of reconcileChildrenAtPriority but using
    // stateNode to store the child.

    // At this point any memoization is no longer valid since we'll have changed
    // the children.
    workInProgress.memoizedProps = null;
    if (current === null) {
      workInProgress.stateNode = mountChildFibersInPlace(workInProgress, workInProgress.stateNode, nextChildren, priorityLevel);
    } else if (current.child === workInProgress.child) {
      clearDeletions(workInProgress);

      workInProgress.stateNode = reconcileChildFibers(workInProgress, workInProgress.stateNode, nextChildren, priorityLevel);

      transferDeletions(workInProgress);
    } else {
      workInProgress.stateNode = reconcileChildFibersInPlace(workInProgress, workInProgress.stateNode, nextChildren, priorityLevel);

      transferDeletions(workInProgress);
    }

    memoizeProps(workInProgress, nextCoroutine);
    // This doesn't take arbitrary time so we could synchronously just begin
    // eagerly do the work of workInProgress.child as an optimization.
    return workInProgress.stateNode;
  }

  function updatePortalComponent(current, workInProgress) {
    pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
    var priorityLevel = workInProgress.pendingWorkPriority;
    var nextChildren = workInProgress.pendingProps;
    if (hasContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
      if (nextChildren === null) {
        nextChildren = current && current.memoizedProps;
        invariant(nextChildren != null, 'We should always have pending or current props. This error is ' + 'likely caused by a bug in React. Please file an issue.');
      }
    } else if (nextChildren === null || workInProgress.memoizedProps === nextChildren) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    if (current === null) {
      // Portals are special because we don't append the children during mount
      // but at commit. Therefore we need to track insertions which the normal
      // flow doesn't do during mount. This doesn't happen at the root because
      // the root always starts with a "current" with a null child.
      // TODO: Consider unifying this with how the root works.
      workInProgress.child = reconcileChildFibersInPlace(workInProgress, workInProgress.child, nextChildren, priorityLevel);
      memoizeProps(workInProgress, nextChildren);
      markChildAsProgressed(current, workInProgress, priorityLevel);
    } else {
      reconcileChildren(current, workInProgress, nextChildren);
      memoizeProps(workInProgress, nextChildren);
    }
    return workInProgress.child;
  }

  /*
  function reuseChildrenEffects(returnFiber : Fiber, firstChild : Fiber) {
    let child = firstChild;
    do {
      // Ensure that the first and last effect of the parent corresponds
      // to the children's first and last effect.
      if (!returnFiber.firstEffect) {
        returnFiber.firstEffect = child.firstEffect;
      }
      if (child.lastEffect) {
        if (returnFiber.lastEffect) {
          returnFiber.lastEffect.nextEffect = child.firstEffect;
        }
        returnFiber.lastEffect = child.lastEffect;
      }
    } while (child = child.sibling);
  }
  */

  function bailoutOnAlreadyFinishedWork(current, workInProgress) {
    if (process.env.NODE_ENV !== 'production') {
      cancelWorkTimer(workInProgress);
    }

    var priorityLevel = workInProgress.pendingWorkPriority;
    // TODO: We should ideally be able to bail out early if the children have no
    // more work to do. However, since we don't have a separation of this
    // Fiber's priority and its children yet - we don't know without doing lots
    // of the same work we do anyway. Once we have that separation we can just
    // bail out here if the children has no more work at this priority level.
    // if (workInProgress.priorityOfChildren <= priorityLevel) {
    //   // If there are side-effects in these children that have not yet been
    //   // committed we need to ensure that they get properly transferred up.
    //   if (current && current.child !== workInProgress.child) {
    //     reuseChildrenEffects(workInProgress, child);
    //   }
    //   return null;
    // }

    if (current && workInProgress.child === current.child) {
      // If we had any progressed work already, that is invalid at this point so
      // let's throw it out.
      clearDeletions(workInProgress);
    }

    cloneChildFibers(current, workInProgress);
    markChildAsProgressed(current, workInProgress, priorityLevel);
    return workInProgress.child;
  }

  function bailoutOnLowPriority(current, workInProgress) {
    if (process.env.NODE_ENV !== 'production') {
      cancelWorkTimer(workInProgress);
    }

    // TODO: Handle HostComponent tags here as well and call pushHostContext()?
    // See PR 8590 discussion for context
    switch (workInProgress.tag) {
      case ClassComponent:
        pushContextProvider(workInProgress);
        break;
      case HostPortal:
        pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
        break;
    }
    // TODO: What if this is currently in progress?
    // How can that happen? How is this not being cloned?
    return null;
  }

  function memoizeProps(workInProgress, nextProps) {
    workInProgress.memoizedProps = nextProps;
    // Reset the pending props
    workInProgress.pendingProps = null;
  }

  function memoizeState(workInProgress, nextState) {
    workInProgress.memoizedState = nextState;
    // Don't reset the updateQueue, in case there are pending updates. Resetting
    // is handled by beginUpdateQueue.
  }

  function beginWork(current, workInProgress, priorityLevel) {
    if (workInProgress.pendingWorkPriority === NoWork || workInProgress.pendingWorkPriority > priorityLevel) {
      return bailoutOnLowPriority(current, workInProgress);
    }

    if (process.env.NODE_ENV !== 'production') {
      ReactDebugCurrentFiber.current = workInProgress;
    }

    // If we don't bail out, we're going be recomputing our children so we need
    // to drop our effect list.
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;

    if (workInProgress.progressedPriority === priorityLevel) {
      // If we have progressed work on this priority level already, we can
      // proceed this that as the child.
      workInProgress.child = workInProgress.progressedChild;
    }

    switch (workInProgress.tag) {
      case IndeterminateComponent:
        return mountIndeterminateComponent(current, workInProgress, priorityLevel);
      case FunctionalComponent:
        return updateFunctionalComponent(current, workInProgress);
      case ClassComponent:
        return updateClassComponent(current, workInProgress, priorityLevel);
      case HostRoot:
        return updateHostRoot(current, workInProgress, priorityLevel);
      case HostComponent:
        return updateHostComponent(current, workInProgress);
      case HostText:
        return updateHostText(current, workInProgress);
      case CoroutineHandlerPhase:
        // This is a restart. Reset the tag to the initial phase.
        workInProgress.tag = CoroutineComponent;
      // Intentionally fall through since this is now the same.
      case CoroutineComponent:
        return updateCoroutineComponent(current, workInProgress);
      case YieldComponent:
        // A yield component is just a placeholder, we can just run through the
        // next one immediately.
        return null;
      case HostPortal:
        return updatePortalComponent(current, workInProgress);
      case Fragment:
        return updateFragment(current, workInProgress);
      default:
        invariant(false, 'Unknown unit of work tag. This error is likely caused by a bug in ' + 'React. Please file an issue.');
    }
  }

  function beginFailedWork(current, workInProgress, priorityLevel) {
    invariant(workInProgress.tag === ClassComponent || workInProgress.tag === HostRoot, 'Invalid type of work. This error is likely caused by a bug in React. ' + 'Please file an issue.');

    // Add an error effect so we can handle the error during the commit phase
    workInProgress.effectTag |= Err;

    if (workInProgress.pendingWorkPriority === NoWork || workInProgress.pendingWorkPriority > priorityLevel) {
      return bailoutOnLowPriority(current, workInProgress);
    }

    // If we don't bail out, we're going be recomputing our children so we need
    // to drop our effect list.
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;

    // Unmount the current children as if the component rendered null
    var nextChildren = null;
    reconcileChildren(current, workInProgress, nextChildren);

    if (workInProgress.tag === ClassComponent) {
      var instance = workInProgress.stateNode;
      workInProgress.memoizedProps = instance.props;
      workInProgress.memoizedState = instance.state;
      workInProgress.pendingProps = null;
    }

    return workInProgress.child;
  }

  return {
    beginWork: beginWork,
    beginFailedWork: beginFailedWork
  };
};