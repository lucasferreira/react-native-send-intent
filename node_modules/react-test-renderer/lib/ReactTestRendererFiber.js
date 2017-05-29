/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @preventMunge
 * 
 */

'use strict';

var _assign = require('object-assign');

var _extends = _assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var ReactFiberReconciler = require('./ReactFiberReconciler');
var ReactGenericBatching = require('./ReactGenericBatching');
var emptyObject = require('fbjs/lib/emptyObject');
var ReactTypeOfWork = require('./ReactTypeOfWork');
var invariant = require('fbjs/lib/invariant');
var FunctionalComponent = ReactTypeOfWork.FunctionalComponent,
    ClassComponent = ReactTypeOfWork.ClassComponent,
    HostComponent = ReactTypeOfWork.HostComponent,
    HostText = ReactTypeOfWork.HostText,
    HostRoot = ReactTypeOfWork.HostRoot;


var UPDATE_SIGNAL = {};

var TestRenderer = ReactFiberReconciler({
  getRootHostContext: function () {
    return emptyObject;
  },
  getChildHostContext: function () {
    return emptyObject;
  },
  prepareForCommit: function () {
    // noop
  },
  resetAfterCommit: function () {
    // noop
  },
  createInstance: function (type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
    return {
      type: type,
      props: props,
      children: [],
      rootContainerInstance: rootContainerInstance,
      tag: 'INSTANCE'
    };
  },
  appendInitialChild: function (parentInstance, child) {
    var index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    parentInstance.children.push(child);
  },
  finalizeInitialChildren: function (testElement, type, props, rootContainerInstance) {
    return false;
  },
  prepareUpdate: function (testElement, type, oldProps, newProps, rootContainerInstance, hostContext) {
    return UPDATE_SIGNAL;
  },
  commitUpdate: function (instance, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
    instance.type = type;
    instance.props = newProps;
  },
  commitMount: function (instance, type, newProps, internalInstanceHandle) {
    // noop
  },
  shouldSetTextContent: function (props) {
    return false;
  },
  resetTextContent: function (testElement) {
    // noop
  },
  shouldDeprioritizeSubtree: function (type, props) {
    return false;
  },
  createTextInstance: function (text, rootContainerInstance, hostContext, internalInstanceHandle) {
    return {
      text: text,
      tag: 'TEXT'
    };
  },
  commitTextUpdate: function (textInstance, oldText, newText) {
    textInstance.text = newText;
  },
  appendChild: function (parentInstance, child) {
    var index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    parentInstance.children.push(child);
  },
  insertBefore: function (parentInstance, child, beforeChild) {
    var index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    var beforeIndex = parentInstance.children.indexOf(beforeChild);
    parentInstance.children.splice(beforeIndex, 0, child);
  },
  removeChild: function (parentInstance, child) {
    var index = parentInstance.children.indexOf(child);
    parentInstance.children.splice(index, 1);
  },
  scheduleAnimationCallback: function (fn) {
    setTimeout(fn);
  },
  scheduleDeferredCallback: function (fn) {
    setTimeout(fn, 0, { timeRemaining: Infinity });
  },


  useSyncScheduling: true,

  getPublicInstance: function (inst) {
    switch (inst.tag) {
      case 'INSTANCE':
        var _createNodeMock = inst.rootContainerInstance.createNodeMock;
        return _createNodeMock({
          type: inst.type,
          props: inst.props
        });
      default:
        return inst;
    }
  }
});

var defaultTestOptions = {
  createNodeMock: function () {
    return null;
  }
};

function toJSON(inst) {
  switch (inst.tag) {
    case 'TEXT':
      return inst.text;
    case 'INSTANCE':
      /* eslint-disable no-unused-vars */
      // We don't include the `children` prop in JSON.
      // Instead, we will include the actual rendered children.
      var _inst$props = inst.props,
          _children = _inst$props.children,
          _props = _objectWithoutProperties(_inst$props, ['children']);
      /* eslint-enable */


      var renderedChildren = null;
      if (inst.children && inst.children.length) {
        renderedChildren = inst.children.map(toJSON);
      }
      var json = {
        type: inst.type,
        props: _props,
        children: renderedChildren
      };
      Object.defineProperty(json, '$$typeof', {
        value: Symbol['for']('react.test.json')
      });
      return json;
    default:
      throw new Error('Unexpected node type in toJSON: ' + inst.tag);
  }
}

function nodeAndSiblingsArray(nodeWithSibling) {
  var array = [];
  var node = nodeWithSibling;
  while (node != null) {
    array.push(node);
    node = node.sibling;
  }
  return array;
}

function toTree(node) {
  if (node == null) {
    return null;
  }
  switch (node.tag) {
    case HostRoot:
      // 3
      return toTree(node.child);
    case ClassComponent:
      return {
        nodeType: 'component',
        type: node.type,
        props: _extends({}, node.memoizedProps),
        instance: node.stateNode,
        rendered: toTree(node.child)
      };
    case FunctionalComponent:
      // 1
      return {
        nodeType: 'component',
        type: node.type,
        props: _extends({}, node.memoizedProps),
        instance: null,
        rendered: toTree(node.child)
      };
    case HostComponent:
      // 5
      return {
        nodeType: 'host',
        type: node.type,
        props: _extends({}, node.memoizedProps),
        instance: null, // TODO: use createNodeMock here somehow?
        rendered: nodeAndSiblingsArray(node.child).map(toTree)
      };
    case HostText:
      // 6
      return node.stateNode.text;
    default:
      invariant(false, 'toTree() does not yet know how to handle nodes with tag=%s', node.tag);
  }
}

var ReactTestFiberRenderer = {
  create: function (element, options) {
    var createNodeMock = defaultTestOptions.createNodeMock;
    if (options && typeof options.createNodeMock === 'function') {
      createNodeMock = options.createNodeMock;
    }
    var container = {
      children: [],
      createNodeMock: createNodeMock,
      tag: 'CONTAINER'
    };
    var root = TestRenderer.createContainer(container);
    invariant(root != null, 'something went wrong');
    TestRenderer.updateContainer(element, root, null, null);

    return {
      toJSON: function () {
        if (root == null || root.current == null || container == null) {
          return null;
        }
        if (container.children.length === 0) {
          return null;
        }
        if (container.children.length === 1) {
          return toJSON(container.children[0]);
        }
        return container.children.map(toJSON);
      },
      toTree: function () {
        if (root == null || root.current == null) {
          return null;
        }
        return toTree(root.current);
      },
      update: function (newElement) {
        if (root == null || root.current == null) {
          return;
        }
        TestRenderer.updateContainer(newElement, root, null, null);
      },
      unmount: function () {
        if (root == null || root.current == null) {
          return;
        }
        TestRenderer.updateContainer(null, root, null);
        container = null;
        root = null;
      },
      getInstance: function () {
        if (root == null || root.current == null) {
          return null;
        }
        return TestRenderer.getPublicRootInstance(root);
      }
    };
  },


  /* eslint-disable camelcase */
  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates
};

module.exports = ReactTestFiberRenderer;