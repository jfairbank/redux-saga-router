/* eslint no-console: ["error", { allow: ["error"] }] */
import { call, take, fork } from 'redux-saga/effects';
import fsmIterator from 'fsm-iterator';
import buildRouteMatcher from './buildRouteMatcher';
import createHistoryChannel from './createHistoryChannel';

const INIT = 'INIT';
const LISTEN = 'LISTEN';
const HANDLE_LOCATION = 'HANDLE_LOCATION';

export default function router(history, routes) {
  const routeMatcher = buildRouteMatcher(routes);
  let historyChannel = null;
  let lastMatch = null;

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

    [LISTEN](channel) {
      if (channel && !historyChannel) {
        historyChannel = channel;
      }

      return {
        value: take(historyChannel),
        next: HANDLE_LOCATION,
      };
    },

    [HANDLE_LOCATION](location, fsm) {
      const path = location.pathname;
      const match = routeMatcher.match(path);

      if (match) {
        lastMatch = match;

        return {
          value: fork(match.action, match.params),
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

        default:
          return { done: true };
      }
    },
  });
}
