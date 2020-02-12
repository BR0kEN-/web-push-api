# Web Push API

The API for subscribing/unsubscribing to [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) notifications and optional syncing the subscription to your backend.

## Installation

```bash
npm i --save web-push-api
```

## Usage

### Abstract example.

```javascript
import { isSupported, getPushSubscriptionFlow, getPushSubscriptionPayload } from 'web-push-api';

if (isSupported) {
  getPushSubscriptionFlow((method, pushSubscription) => {
    sendRequestToBackend(method, getPushSubscriptionPayload(pushSubscription));
  });
}
```

### React component

```javascript
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { isSupported, getPushSubscriptionFlow, getPushSubscriptionPayload } from 'web-push-api';

import Spinner from 'your-spinner-component';

const flow = !isSupported ? null : getPushSubscriptionFlow((method, pushSubscription) => {
  fetch('https://example.com/web-push-api/subscription', { method, body: getPushSubscriptionPayload(pushSubscription) })
    .then((response) => response.json())
    .then(({ errors }) => errors.map(showError))
    .catch(showError);
});

/**
 * @param {Error|string} error
 */
function showError(error) {
  alert(error instanceof Error ? error.message : error);
}

/**
 * @param {function(state: Object): void} updateState
 * @param {('getPermission'|'getSubscription'|'subscribe'|'unsubscribe')} method
 * @param {('permission'|'subscription')} affects
 * @param {string|null} valueOnError
 * @param {string} [applicationServerKey]
 */
function doFlowAction(updateState, method, affects, valueOnError, applicationServerKey) {
  (async () => {
    let value = valueOnError;

    try {
      value = await flow[method](applicationServerKey);
    } catch (error) {
      showError(error);
    }

    updateState({ processing: false, [affects]: value });
  })();
}

/**
 * @param {function(state: Object): void} updateState
 * @param {('subscribe'|'unsubscribe')} method
 * @param {string} [applicationServerKey]
 *
 * @return {function(event: Event): void}
 */
function getFlowActionHandler(updateState, method, applicationServerKey) {
  return (event) => {
    event.preventDefault();
    updateState({ processing: true });
    doFlowAction(updateState, method, 'subscription', null, applicationServerKey);
  };
}

function PushNotificationsSubscriber({ offline, applicationServerKey }) {
  const [{ permission, subscription, processing = true }, setState] = useState({});
  const updateState = (state) => setState((prevState) => ({ ...prevState, ...state }));
  let children;

  useEffect(() => {
    if (permission === undefined) {
      doFlowAction(updateState, 'getPermission', 'permission', 'denied');
    } else if (!offline && permission === 'granted' && subscription === undefined) {
      doFlowAction(updateState, 'getSubscription', 'subscription', null);
    }
  }, [offline, permission, subscription, updateState]);

  if (processing) {
    children = (
      <Spinner small />
    );
  } else if (permission !== 'granted' || offline) {
    const title = offline 
      ? 'This feature is not available since the app is offline. Please come back later.' 
      : 'Please turn notifications on. This will allow you receiving updates even if the application is closed.';

    children = (
      <span title={ title }>
        <i className="icon-notifications-off" />
      </span>
    );
  } else if (subscription === null) {
    children = (
      <button
        title="Click to subscribe to push notifications."
        onClick={ getFlowActionHandler(updateState, 'subscribe', applicationServerKey) }
      >
        <i className="icon-notifications-none" />
      </button>
    );
  } else {
    children = (
      <button
        title="Click to unsubscribe from push notifications."
        onClick={ getFlowActionHandler(updateState, 'unsubscribe') }
      >
        <i className="icon-notifications-active" />
      </button>
    );
  }

  return (
    <div className="push-notifications">
      { children }
    </div>
  );
}

PushNotificationsSubscriber.propTypes = {
  offline: PropTypes.bool.isRequired,
  applicationServerKey: PropTypes.string.isRequired,
};

export default flow ? PushNotificationsSubscriber : () => null;
```

## Alternatives

- https://github.com/dmitry-korolev/push-js
