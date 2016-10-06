/* eslint no-console: ["error", { allow: ["error"] }] */
import { eventChannel } from 'redux-saga';
import { put } from 'redux-saga/effects';
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

const fakeChannel = eventChannel(() => () => {});

test('router', () => {
  testSaga(router, history, routes)
    .next() // init
    .next(fakeChannel) // listen
    .next(initialLocation) // no match and listen

    .next({ pathname: '/foo' })
    .call(fooSaga, {})

    .next() // listen
    .next({ pathname: '/bar/42' })
    .call(barSaga, { id: '42' })

    .next() // listen
    .next({ pathname: '/hello' }) // no match and listen

    .next({ pathname: '/baz/20/quux/abcd-1234' })
    .call(bazSaga, { id: '20', otherId: 'abcd-1234' })

    .next() // listen
    .next({ pathname: '/error' })
    .call(errorSaga, {})
    .throw(fakeError) // simulate error in route
    .call(
      [console, console.error],
      'Redux Saga Router: Unhandled Error in route "/error":\nan error\n1234'
    )

    .next() // listen
    .next({ pathname: '/foo' })
    .call(fooSaga, {})

    .next() // listen
    .throw(fakeError) // simulate error while listening
    .call(
      [console, console.error],
      'Redux Saga Router: Unexpected Error while listening for route:\nan error\n1234'
    )

    .next() // listen
    .next({ pathname: '/error' })
    .call(errorSaga, {})
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
