/* eslint no-console: ["error", { allow: ["error"] }] */
import { eventChannel } from 'redux-saga';
import { put, spawn } from 'redux-saga/effects';
import testSaga from 'redux-saga-test-plan';
import router from '../src/router';

const initialLocation = {
  pathname: '/',
};

const history = {
  location: initialLocation,
  listen() {},
};

const fakeErrorWithoutStack = {
  name: 'Error',
  message: 'an error',
};

const fakeError = {
  ...fakeErrorWithoutStack,
  stack: '1234',
};

function* fooSaga() {
  yield put({ type: 'FOO' });
}

function* barSaga({ id }) {
  yield put({ type: 'BAR', payload: id });
}

function* bazSaga({ id, otherId }) {
  yield put({ type: 'BAZ', payload: [id, otherId] });
}

function* beforeAllSaga(params) {
  yield put({ type: 'ALL', payload: params });
}

function* errorSaga() {
  yield put({ type: 'ERROR' });
  throw fakeError;
}

const routes = {
  '/foo': fooSaga,
  '/bar/:id': barSaga,
  '/baz/:id/quux/:otherId': bazSaga,
  '/error': errorSaga,
};

const options = {
  beforeRouteChange: beforeAllSaga,
};

const fakeChannel = eventChannel(() => () => {});

test('router', () => {
  testSaga(router, history, routes)
    .next() // init
    .next(fakeChannel) // listen
    .next(initialLocation) // no match and listen

    .next({ pathname: '/foo' })
    .parallel([
      spawn(fooSaga, {}),
    ])

    .next() // listen
    .next({ pathname: '/bar/42' })
    .parallel([
      spawn(barSaga, { id: '42' }),
    ])

    .next() // listen
    .next({ pathname: '/hello' }) // no match and listen

    .next({ pathname: '/baz/20/quux/abcd-1234' })
    .parallel([
      spawn(bazSaga, { id: '20', otherId: 'abcd-1234' }),
    ])

    .next() // listen
    .next({ pathname: '/error' })
    .parallel([
      spawn(errorSaga, {}),
    ])
    .throw(fakeError) // simulate error in route
    .call(
      [console, console.error],
      'Redux Saga Router: Unhandled Error in route "/error":\nan error\n1234'
    )

    .next() // listen
    .next({ pathname: '/foo' })
    .parallel([
      spawn(fooSaga, {}),
    ])

    .next() // listen
    .throw(fakeError) // simulate error while listening
    .call(
      [console, console.error],
      'Redux Saga Router: Unexpected Error while listening for route:\nan error\n1234'
    )

    .next() // listen
    .next({ pathname: '/error' })
    .parallel([
      spawn(errorSaga, {}),
    ])
    .throw(fakeErrorWithoutStack) // simulate error when stack not available
    .call(
      [console, console.error],
      'Redux Saga Router: Unhandled Error in route "/error":\nan error'
    )

    .finish()
    .isDone()

    .restart()
    .finish(42)
    .returns(42);
});

test('router with beforeRouteChange', () => {
  testSaga(router, history, routes, options)
    .next() // init
    .next(fakeChannel) // listen
    .next(initialLocation) // no match and listen
    .next({ pathname: '/foo' })
    .spawn(beforeAllSaga, {})
    .next({ pathname: '/foo' })
    .parallel([
      spawn(fooSaga, {}),
    ])

    .next() // listen
    .next({ pathname: '/hello' }) // no match and listen

    .next({ pathname: '/baz/20/quux/abcd-1234' })
    .spawn(beforeAllSaga, { id: '20', otherId: 'abcd-1234' })
    .next({ pathname: '/baz/20/quux/abcd-1234' })
    .parallel([
      spawn(bazSaga, { id: '20', otherId: 'abcd-1234' }),
    ])

    .finish()
    .isDone()

    .restart()
    .finish(42)
    .returns(42);
});
