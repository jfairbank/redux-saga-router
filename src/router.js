/* eslint no-console: ["error", { allow: ["error"] }] */
import { call } from 'redux-saga/effects';
import buildRouteMatcher from './buildRouteMatcher';
import createHistoryListener from './createHistoryListener';

const STATE = {
  LISTEN: 0,
  HANDLE_LOCATION: 1,
  DONE: 2,
};

export default function router(history, routes) {
  const listen = createHistoryListener(history);
  const routeMatcher = buildRouteMatcher(routes);

  let state = STATE.LISTEN;
  let previousState = null;
  let lastMatch = null;

  function updateState(newState) {
    previousState = state;
    state = newState;
  }

  function listenValue() {
    const value = call(listen);

    updateState(STATE.HANDLE_LOCATION);

    return { value, done: false };
  }

  function handleLocationValue(location) {
    const path = location.pathname;
    const match = routeMatcher.match(path);

    if (match) {
      const value = call(match.action, match.params);

      updateState(STATE.LISTEN);
      lastMatch = match;

      return { value, done: false };
    }

    return listenValue();
  }

  function errorMessageValue(error, message) {
    let finalMessage = `Redux Saga Router: ${message}:\n${error.message}`;

    if ('stack' in error) {
      finalMessage += `\n${error.stack}`;
    }

    const value = call([console, console.error], finalMessage);

    updateState(STATE.LISTEN);

    return { value, done: false };
  }

  function doneValue(value) {
    return {
      value,
      done: true,
    };
  }

  const iterator = {
    name: '',

    next(location) {
      switch (state) {
        case STATE.LISTEN:
          return listenValue();

        case STATE.HANDLE_LOCATION:
          return handleLocationValue(location);

        default:
          return doneValue();
      }
    },

    throw(e) {
      switch (previousState) {
        case STATE.HANDLE_LOCATION:
          return errorMessageValue(e, `Unhandled ${e.name} in route "${lastMatch.route}"`);

        case STATE.LISTEN:
          return errorMessageValue(e, `Unexpected ${e.name} while listening for route`);

        default:
          return doneValue();
      }
    },

    return(value) {
      updateState(STATE.DONE);
      return doneValue(value);
    },
  };

  if (typeof Symbol === 'function' && Symbol.iterator) {
    iterator[Symbol.iterator] = () => iterator;
  }

  return iterator;
}
