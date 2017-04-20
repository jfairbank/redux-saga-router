/* eslint no-console: ["error", { allow: ["error"] }] */
import { call, take, spawn, cancel, join } from 'redux-saga/effects';
import fsmIterator from 'fsm-iterator';
import buildRouteMatcher from './buildRouteMatcher';
import createHistoryChannel from './createHistoryChannel';

const INIT = 'INIT';
const LISTEN = 'LISTEN';
const BEFORE_HANDLE_LOCATION = 'BEFORE_HANDLE_LOCATION';
const AWAIT_BEFORE_ALL = 'AWAIT_BEFORE_HANDLE_LOCATION';
const HANDLE_LOCATION = 'HANDLE_LOCATION';

export default function router(history, routes, options = {}) {
  const routeMatcher = buildRouteMatcher(routes);
  let historyChannel = null;
  let lastMatch = null;
  let lastSaga = null;
  let pendingBeforeRouteChange = null;
  let currentLocation = null;

  function errorMessageValue(error, message) {
    let finalMessage = `Redux Saga Router: ${message}:\n${error.message}`;

    if ('stack' in error) {
      finalMessage += `\n${error.stack}`;
    }

    return {
      value: call([console, console.error], finalMessage),
      next: LISTEN,
    };
  }

  return fsmIterator(INIT, {
    [INIT]: () => ({
      value: call(createHistoryChannel, history),
      next: LISTEN,
    }),

    [LISTEN](effects) {
      if (effects && !historyChannel) {
        historyChannel = effects;
      }

      if (effects instanceof Array) {
        [lastSaga] = effects;
      }

      if ('beforeRouteChange' in options) {
        return {
          value: take(historyChannel),
          next: BEFORE_HANDLE_LOCATION,
        };
      }

      return {
        value: take(historyChannel),
        next: HANDLE_LOCATION,
      };
    },

    [BEFORE_HANDLE_LOCATION](location, fsm) {
      const path = location.pathname;
      const match = routeMatcher.match(path);
      currentLocation = location;

      if (!match) {
        return fsm[LISTEN]();
      }

      pendingBeforeRouteChange = spawn(options.beforeRouteChange, match.params);

      return {
        value: pendingBeforeRouteChange,
        next: AWAIT_BEFORE_ALL,
      };
    },

    [AWAIT_BEFORE_ALL](task) {
      if (task) {
        return { value: join(task), next: HANDLE_LOCATION };
      }
      return {
        value: join(pendingBeforeRouteChange),
        next: HANDLE_LOCATION,
      };
    },

    [HANDLE_LOCATION](location, fsm) {
      const path = location ? location.pathname : currentLocation.pathname;
      let match = routeMatcher.match(path);
      const effects = [];

      while (match !== null) {
        lastMatch = match;
        effects.push(spawn(match.action, match.params));
        match = options.shouldFallThrough ? match.next() : null;
      }

      if (lastSaga) {
        effects.push(cancel(lastSaga));
      }

      if (effects.length > 0) {
        return {
          value: effects,
          next: LISTEN,
        };
      }

      return fsm[LISTEN]();
    },

    throw(e, fsm) {
      switch (fsm.previousState) {
        case HANDLE_LOCATION:
          return errorMessageValue(e, `Unhandled ${e.name} in route "${lastMatch.route}"`);

        case LISTEN:
          return errorMessageValue(e, `Unexpected ${e.name} while listening for route`);

        case BEFORE_HANDLE_LOCATION:
        case AWAIT_BEFORE_ALL:
          return errorMessageValue(e, `Error ${e.name} was uncaught within the before handle location hook.`);

        default:
          return { done: true };
      }
    },
  });
}
