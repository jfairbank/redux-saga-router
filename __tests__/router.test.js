/* eslint no-console: ["error", { allow: ["error"] }] */
import { put } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import router from '../src/router';
import { createMemoryHistory as createHistory } from "history";

function* fooSaga() {
  yield put({ type: 'FOO' });
}

function* barSaga({ id }) {
  yield put({ type: 'BAR', payload: id });
}

function* barDetailsSaga({ id }) {
  yield put({ type: 'BAR_DETAILS', payload: id });
}

function* bazSaga({ id, otherId }) {
  yield put({ type: 'BAZ', payload: [id, otherId] });
}

const runConfig = {
  silenceTimeout: true,
  timeout: 10,
};

it('responds to a route', () => {
  const history = createHistory();
  const routes = { '/foo': fooSaga };

  const promise = expectSaga(router, history, routes)
    .put({ type: 'FOO' })
    .run(runConfig);

  history.push('/foo');

  return promise;
});

it('receives params', () => {
  const history = createHistory();
  const routes = { '/bar/:id/details': barDetailsSaga };

  const promise = expectSaga(router, history, routes)
    .put({ type: 'BAR_DETAILS', payload: '42' })
    .run(runConfig);

  history.push('/bar/42/details');

  return promise;
});

it('receives multiple params', () => {
  const history = createHistory();
  const routes = { '/baz/:id/quux/:otherId': bazSaga };

  const promise = expectSaga(router, history, routes)
    .put({ type: 'BAZ', payload: ['42', '13'] })
    .run(runConfig);

  history.push('/baz/42/quux/13');

  return promise;
});

it('keeps listening for new routes', () => {
  const history = createHistory();

  const routes = {
    '/foo': fooSaga,
    '/bar/:id/details': barDetailsSaga,
  };

  const promise = expectSaga(router, history, routes)
    .put({ type: 'FOO' })
    .put({ type: 'BAR_DETAILS', payload: '42' })
    .run(runConfig);

  history.push('/foo');
  history.push('/bar/42/details');

  return promise;
});

// Disable test due to https://github.com/facebook/jest/issues/5620
xit('keeps listening if a route saga throws an error', async () => {
  const consoleError = console.error;
  console.error = () => {};

  function unhandledRejectionHandler() {}
  process.on('unhandledRejection', unhandledRejectionHandler);

  const history = createHistory();
  const spy = jest.fn();

  const routes = {
    // eslint-disable-next-line require-yield
    '/foo': function* fooSaga2() {
      spy();
    },

    // eslint-disable-next-line require-yield
    '/bar': function* barSaga2() {
      throw new Error('error');
    },
  };

  const promise = expectSaga(router, history, routes).run(runConfig);

  history.push('/bar');
  history.push('/foo');

  await promise;

  expect(spy).toHaveBeenCalledTimes(1);

  await promise;

  console.error = consoleError;
  process.removeListener('unhandledRejection', unhandledRejectionHandler);
});

it('inexact routes do not match without *', async () => {
  const history = createHistory();
  const routes = { '/foo': fooSaga };

  const promise = expectSaga(router, history, routes)
    .not.put.actionType('FOO')
    .run(runConfig);

  history.push('/foo/bar');

  await promise;
});

it('matches wildcards with *', async () => {
  const history = createHistory();
  const routes = { '/foo*': fooSaga };

  const promise = expectSaga(router, history, routes)
    .put({ type: 'FOO' })
    .run(runConfig);

  history.push('/foo/bar');

  await promise;
});

it('handles an initial location', async () => {
  const history = createHistory('/');

  const routes = {
    '/': function* homeSaga() {
      yield put({ type: 'HOME' });
    },
  };

  await expectSaga(router, history, routes)
    .put({ type: 'HOME' })
    .run(runConfig);
});

it('handles an beforeRouteChange', async () => {
  const history = createHistory();
  const callOrder = [];

  const routes = {
    '/foo': function* fooSaga2() {
      callOrder.push('foo');
      yield put({ type: 'FOO' });
    },
  };

  const options = {
    * beforeRouteChange() {
      callOrder.push('beforeRouteChange');
      yield put({ type: 'BEFORE' });
    },
  };

  const promise = expectSaga(router, history, routes, options)
    .put({ type: 'BEFORE' })
    .put({ type: 'FOO' })
    .run(runConfig);

  history.push('/foo');

  await promise;

  expect(callOrder).toEqual(['beforeRouteChange', 'foo']);
});

describe('without matchAll option', () => {
  it('first route to match wins', async () => {
    const routes = {
      '/bar/:id/*': barSaga,
      '/bar/:id/details': barDetailsSaga,
    };

    const history = createHistory();

    const promise = expectSaga(router, history, routes)
      .put({ type: 'BAR', payload: '42' })
      .not.put.actionType('BAR_DETAILS')
      .run(runConfig);

    history.push('/bar/42/details');

    await promise;
  });
});

describe('with matchAll option', () => {
  it('all matching routes run', async () => {
    const routes = {
      '/bar/:id/*': barSaga,
      '/bar/:id/details': barDetailsSaga,
    };

    const history = createHistory();
    const options = { matchAll: true };

    const promise = expectSaga(router, history, routes, options)
      .put({ type: 'BAR', payload: '42' })
      .put({ type: 'BAR_DETAILS', payload: '42' })
      .run(runConfig);

    history.push('/bar/42/details');

    await promise;
  });
});
