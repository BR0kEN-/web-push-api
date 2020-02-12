"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decodeKey = decodeKey;
exports.encodeKey = encodeKey;
exports.getPushSubscriptionPayload = getPushSubscriptionPayload;
exports.getPushSubscriptionFlow = getPushSubscriptionFlow;
exports.isSupported = void 0;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

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
      return _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee() {
        var _getLogger, debug;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _getLogger = getLogger('getPermission', logger), debug = _getLogger.debug;
                debug(permission);

                if (!(permission === 'default')) {
                  _context.next = 7;
                  break;
                }

                _context.next = 5;
                return Notification.requestPermission();

              case 5:
                permission = _context.sent;
                debug(permission);

              case 7:
                return _context.abrupt("return", permission);

              case 8:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }))();
    },
    getSubscription: function getSubscription() {
      return _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee2() {
        var _getLogger2, debug, error;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _getLogger2 = getLogger('getSubscription', logger), debug = _getLogger2.debug, error = _getLogger2.error; // Force to call "getPermission()".

                if (!(permission !== 'granted')) {
                  _context2.next = 4;
                  break;
                }

                error('no permission');
                throw new Error('Notifications permission is not granted.');

              case 4:
                if (!(currentSubscription instanceof PushSubscription)) {
                  _context2.next = 7;
                  break;
                }

                debug('reuse');
                return _context2.abrupt("return", currentSubscription);

              case 7:
                debug('retrieve');
                _context2.next = 10;
                return navigator.serviceWorker.ready;

              case 10:
                _context2.next = 12;
                return _context2.sent.pushManager.getSubscription();

              case 12:
                currentSubscription = _context2.sent;

                if (currentSubscription instanceof PushSubscription) {
                  debug('update');
                  sync('PATCH', currentSubscription);
                }

                return _context2.abrupt("return", currentSubscription);

              case 15:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    },
    subscribe: function subscribe(applicationServerKey) {
      return _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee3() {
        var _getLogger3, debug, error;

        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _getLogger3 = getLogger('subscribe', logger), debug = _getLogger3.debug, error = _getLogger3.error; // Force to call "getSubscription()".

                if (!(currentSubscription === undefined)) {
                  _context3.next = 4;
                  break;
                }

                error('not checked');
                throw new Error('Check for the existing subscription before requesting a new one.');

              case 4:
                if (!(currentSubscription === null)) {
                  _context3.next = 14;
                  break;
                }

                debug('request');
                _context3.next = 8;
                return navigator.serviceWorker.ready;

              case 8:
                _context3.t0 = {
                  applicationServerKey: decodeKey(applicationServerKey),
                  userVisibleOnly: true
                };
                _context3.next = 11;
                return _context3.sent.pushManager.subscribe(_context3.t0);

              case 11:
                currentSubscription = _context3.sent;
                debug('create');
                sync('POST', currentSubscription);

              case 14:
                return _context3.abrupt("return", currentSubscription);

              case 15:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }))();
    },
    unsubscribe: function unsubscribe() {
      return _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee4() {
        var _getLogger4, debug, error;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _getLogger4 = getLogger('unsubscribe', logger), debug = _getLogger4.debug, error = _getLogger4.error; // Force to call "subscribe()" or "getSubscription()".

                if (!(currentSubscription instanceof PushSubscription)) {
                  _context4.next = 12;
                  break;
                }

                debug('request');
                _context4.next = 5;
                return currentSubscription.unsubscribe();

              case 5:
                if (!_context4.sent) {
                  _context4.next = 10;
                  break;
                }

                debug('delete');
                sync('DELETE', currentSubscription);
                currentSubscription = null;
                return _context4.abrupt("return", null);

              case 10:
                error('failed');
                throw new Error('Unable to unsubscribe.');

              case 12:
                error('logic violation');
                throw new Error('Unsubscription cannot be performed while there is no subscription.');

              case 14:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }))();
    }
  };
}
