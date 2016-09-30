import { call } from 'redux-saga/effects';
import buildRouteMatcher from './buildRouteMatcher';
import createHistoryListener from './createHistoryListener';

const STATE = {
  LISTEN: 0,
  HANDLE_LOCATION: 1,
};

export default function router(history, routes) {
  const listen = createHistoryListener(history);
  const routeMatcher = buildRouteMatcher(routes);

  let state = STATE.LISTEN;

  function listenValue() {
    const value = call(listen);

    state = STATE.HANDLE_LOCATION;

    return { value, done: false };
  }

  function handleLocationValue(location) {
    const path = location.pathname;
    const match = routeMatcher.match(path);

    if (match) {
      const value = call(match.action, match.params);

      state = STATE.LISTEN;

      return { value, done: false };
    }

    return listenValue();
  }

  const iterator = {
    name: '',

    next(location) {
      if (state === STATE.LISTEN) {
        return listenValue();
      }

      return handleLocationValue(location);
    },

    throw() {},
    return() {},
  };

  if (typeof Symbol === 'function' && Symbol.iterator) {
    iterator[Symbol.iterator] = () => iterator;
  }

  return iterator;
}
