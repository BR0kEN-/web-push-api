/**
 * @type {boolean}
 */
export const isSupported = (
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'showNotification' in ServiceWorkerRegistration.prototype
);

/**
 * @param {string} type
 * @param {PushSubscriptionLogger|null} logger
 *
 * @return {PushSubscriptionLogger}
 */
function getLogger(type, logger) {
  return ['debug', 'error'].reduce((accumulator, method) => {
    accumulator[method] = (...args) => logger && logger[method](`Push API -> [${type}]:`, ...args);

    return accumulator;
  }, {});
}

/**
 * @param {string} encodedString
 *
 * @return {Uint8Array}
 */
export function decodeKey(encodedString) {
  const padding = '='.repeat((4 - (encodedString.length % 4)) % 4);
  const decoded = atob((encodedString + padding).replace(/-/g, '+').replace(/_/g, '/'));

  return new Uint8Array([...decoded].map((char) => char.charCodeAt(0)));
}

/**
 * @param {ArrayBuffer} buffer
 *
 * @return {string}
 */
export function encodeKey(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/**
 * @param {PushSubscription} pushSubscription
 *
 * @return {PushSubscriptionPayload}
 */
export function getPushSubscriptionPayload(pushSubscription) {
  return ['p256dh', 'auth'].reduce((accumulator, key) => {
    const value = pushSubscription.getKey(key);

    accumulator[key] = value ? encodeKey(value) : null;

    return accumulator;
  }, {
    user_agent: navigator.userAgent,
    utc_offset: new Date().getTimezoneOffset() / 60,
    encoding: (PushManager.supportedContentEncodings || ['aesgcm'])[0],
    endpoint: pushSubscription.endpoint,
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
export function getPushSubscriptionFlow(sync, logger = console) {
  /** @type {NotificationPermission} */
  let permission = Notification.permission;
  /** @type {PushSubscription|undefined|null} */
  let currentSubscription;

  return {
    async getPermission() {
      const { debug } = getLogger('getPermission', logger);

      debug(permission);

      if (permission === 'default') {
        permission = await Notification.requestPermission();
        debug(permission);
      }

      return permission;
    },
    async getSubscription() {
      const { debug, error } = getLogger('getSubscription', logger);

      // Force to call "getPermission()".
      if (permission !== 'granted') {
        error('no permission');
        throw new Error('Notifications permission is not granted.');
      }

      if (currentSubscription instanceof PushSubscription) {
        debug('reuse');
        return currentSubscription;
      }

      debug('retrieve');
      currentSubscription = await (await navigator.serviceWorker.ready).pushManager.getSubscription();

      if (currentSubscription instanceof PushSubscription) {
        debug('update');
        sync('PATCH', currentSubscription);
      }

      return currentSubscription;
    },
    async subscribe(applicationServerKey) {
      const { debug, error } = getLogger('subscribe', logger);

      // Force to call "getSubscription()".
      if (currentSubscription === undefined) {
        error('not checked');
        throw new Error('Check for the existing subscription before requesting a new one.');
      }

      if (currentSubscription === null) {
        debug('request');
        currentSubscription = await (await navigator.serviceWorker.ready).pushManager.subscribe({
          applicationServerKey: decodeKey(applicationServerKey),
          userVisibleOnly: true,
        });

        debug('create');
        sync('POST', currentSubscription);
      }

      return currentSubscription;
    },
    async unsubscribe() {
      const { debug, error } = getLogger('unsubscribe', logger);

      // Force to call "subscribe()" or "getSubscription()".
      if (currentSubscription instanceof PushSubscription) {
        debug('request');

        if (await currentSubscription.unsubscribe()) {
          debug('delete');
          sync('DELETE', currentSubscription);
          currentSubscription = null;

          return null;
        }

        error('failed');
        throw new Error('Unable to unsubscribe.');
      }

      error('logic violation');
      throw new Error('Unsubscription cannot be performed while there is no subscription.');
    },
  };
}
