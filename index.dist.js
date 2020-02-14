"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decodeKey = decodeKey;
exports.encodeKey = encodeKey;
exports.getPushSubscriptionPayload = getPushSubscriptionPayload;
exports.getPushSubscriptionFlow = getPushSubscriptionFlow;
exports.isSupported = void 0;

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

/**
 * @type {boolean}
 */
var isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'showNotification' in ServiceWorkerRegistration.prototype;
/**
 * @param {string} type
 * @param {PushSubscriptionLogger|null} logger
 *
 * @return {PushSubscriptionLogger}
 */

exports.isSupported = isSupported;

function getLogger(type, logger) {
  return ['debug', 'error'].reduce(function (accumulator, method) {
    accumulator[method] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return logger && logger[method].apply(logger, ["Push API -> [".concat(type, "]:")].concat(args));
    };

    return accumulator;
  }, {});
}
/**
 * @param {string} encodedString
 *
 * @return {Uint8Array}
 */


function decodeKey(encodedString) {
  var padding = '='.repeat((4 - encodedString.length % 4) % 4);
  var decoded = atob((encodedString + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return new Uint8Array(_toConsumableArray(decoded).map(function (char) {
    return char.charCodeAt(0);
  }));
}
/**
 * @param {ArrayBuffer} buffer
 *
 * @return {string}
 */


function encodeKey(buffer) {
  return btoa(String.fromCharCode.apply(String, _toConsumableArray(new Uint8Array(buffer))));
}
/**
 * @param {PushSubscription} pushSubscription
 *
 * @return {PushSubscriptionPayload}
 */


function getPushSubscriptionPayload(pushSubscription) {
  return ['p256dh', 'auth'].reduce(function (accumulator, key) {
    var value = pushSubscription.getKey(key);
    accumulator[key] = value ? encodeKey(value) : null;
    return accumulator;
  }, {
    user_agent: navigator.userAgent,
    utc_offset: new Date().getTimezoneOffset() / 60,
    encoding: (PushManager.supportedContentEncodings || ['aesgcm'])[0],
    endpoint: pushSubscription.endpoint
  });
}
/**
 * @param {function(method: PushSubscriptionHttpMethod, subscription: PushSubscription): void} sync
 *   The function to synchronize the subscription stored in a browser with servers that are going to
 *   be used as notifications dispatchers. This callback MUST NOT THROW exceptions since they will
 *   force the workflow to behave incorrectly.
 * @param {PushSubscriptionLogger} logger
 *
 * @return {PushSubscriptionFlow}
 *
 * @example
 * The flow with a sync function that correctly handles errors and doesn't let them break the flow.
 * @code
 * import { getPushSubscriptionFlow, getPushSubscriptionPayload } from 'web-push-api';
 *
 * const flow = getPushSubscriptionFlow((method, pushSubscription) => {
 *   request(method, 'web-push-api/subscription', getPushSubscriptionPayload(pushSubscription))
 *     .then(({ errors }) => errors.map(console.error))
 *     .catch(console.error);
 * });
 * @code
 */


function getPushSubscriptionFlow(sync) {
  var logger = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : console;

  /** @type {NotificationPermission} */
  var permission = Notification.permission;
  /** @type {PushSubscription|undefined|null} */

  var currentSubscription;
  return {
    getPermission: function getPermission() {
      return new Promise(function ($return, $error) {
        var _getLogger, debug;

        _getLogger = getLogger('getPermission', logger), debug = _getLogger.debug;
        debug(permission);

        if (permission === 'default') {
          return Promise.resolve(Notification.requestPermission()).then(function ($await_4) {
            try {
              permission = $await_4;
              debug(permission);
              return $If_1.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_1() {
          return $return(permission);
        }

        return $If_1.call(this);
      });
    },
    getSubscription: function getSubscription() {
      return new Promise(function ($return, $error) {
        var _getLogger2, debug, error;

        _getLogger2 = getLogger('getSubscription', logger), debug = _getLogger2.debug, error = _getLogger2.error;

        // Force to call "getPermission()".
        if (permission !== 'granted') {
          error('no permission');
          return $error(new Error('Notifications permission is not granted.'));
        }

        if (currentSubscription instanceof PushSubscription) {
          debug('reuse');
          return $return(currentSubscription);
        }

        debug('retrieve');
        return Promise.resolve(navigator.serviceWorker.ready).then(function ($await_5) {
          try {
            return Promise.resolve($await_5.pushManager.getSubscription()).then(function ($await_6) {
              try {
                currentSubscription = $await_6;

                if (currentSubscription instanceof PushSubscription) {
                  debug('update');
                  sync('PATCH', currentSubscription);
                }

                return $return(currentSubscription);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }, $error);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }, $error);
      });
    },
    subscribe: function subscribe(applicationServerKey) {
      return new Promise(function ($return, $error) {
        var _getLogger3, debug, error;

        _getLogger3 = getLogger('subscribe', logger), debug = _getLogger3.debug, error = _getLogger3.error;

        // Force to call "getSubscription()".
        if (currentSubscription === undefined) {
          error('not checked');
          return $error(new Error('Check for the existing subscription before requesting a new one.'));
        }

        if (currentSubscription === null) {
          debug('request');
          return Promise.resolve(navigator.serviceWorker.ready).then(function ($await_7) {
            try {
              return Promise.resolve($await_7.pushManager.subscribe({
                applicationServerKey: decodeKey(applicationServerKey),
                userVisibleOnly: true
              })).then(function ($await_8) {
                try {
                  currentSubscription = $await_8;
                  debug('create');
                  sync('POST', currentSubscription);
                  return $If_2.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_2() {
          return $return(currentSubscription);
        }

        return $If_2.call(this);
      });
    },
    unsubscribe: function unsubscribe() {
      return new Promise(function ($return, $error) {
        var _getLogger4, debug, error;

        _getLogger4 = getLogger('unsubscribe', logger), debug = _getLogger4.debug, error = _getLogger4.error;

        // Force to call "subscribe()" or "getSubscription()".
        if (currentSubscription instanceof PushSubscription) {
          debug('request');
          return Promise.resolve(currentSubscription.unsubscribe()).then(function ($await_9) {
            try {
              if ($await_9) {
                debug('delete');
                sync('DELETE', currentSubscription);
                currentSubscription = null;
                return $return(null);
              }

              error('failed');
              return $error(new Error('Unable to unsubscribe.'));
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }, $error);
        }

        error('logic violation');
        return $error(new Error('Unsubscription cannot be performed while there is no subscription.'));
      });
    }
  };
}
