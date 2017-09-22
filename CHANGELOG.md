## v2.1.1

### Internal fixes

* Replace `[...effects]` with `all` per redux-saga 0.15's deprecation notice

---

## v2.1.0

### NEW

Redux Saga Router now supports a third optional options argument.

#### Available Options

Key                 | Description
--------------------|--------------------------------------------------------
`matchAll`          | If set to `true`, it allows all matching routes to run instead of the first matching route.
`beforeRouteChange` | Set to a saga to run any time location changes. This is useful for dispatching a cleanup action before route changes.

```js
const options = {
  matchAll: true,

  *beforeRouteChange() {
    yield put(clearNotifications());
  },
};

function* mainSaga() {
  yield fork(router, history, routes, options);
}
```

Thanks to [@TeoTN](https://github.com/TeoTN) for implementing these two options!

---

## v2.0.0

### Spawned Route Sagas

While this is a new major version, there aren't any directly noticeable breaking
changes. Route sagas used to be invoked via the `call` effect. Unfortunately,
`call` is blocking, so long running sagas could prevent other route sagas from
immediately running if the route changed. Another issue is that if a route saga
happened to `fork` or `spawn` a sub saga, there was no way to know when the
route changed to perform cleanup such as cancelling the forked sub saga.

Thanks to [@victorchabbert](https://github.com/victorchabbert), route sagas are
now spawned via the `spawn` effect. This creates a detached, forked task for
each route saga when its route triggers. Now, when the route changes, Redux Saga
Router will cancel any currently running route saga task, giving you the
opportunity to perform cleanup in your route saga or sub sagas.

```js
const delay = time => new Promise(resolve => setTimeout(resolve, time));

function* autoSaveSaga() {
  try {
    while (true) {
      const data = yield select(getData);
      yield call(Api.saveEditor, data);
      yield call(delay, 5000);
    }
  } finally {
    if (yield cancelled()) {
      // do some other cleanup
    }
  }
}

const routes = {
  '/editor': function* editorSaga() {
    try {
      yield fork(autoSaveSaga);
    } finally {
      if (yield cancelled()) {
        // do some cleanup
      }
    }
  },
};

function* mainSaga() {
  yield* router(history, routes);
}
```

Because the behavior of route sagas has slightly changed, this could impact your
application. For example, if you have a route saga that fetches some data from
an API and the route suddenly changes, Redux Saga Router used to wait for the
data to come back and the currently running saga to complete before starting the
new route saga. Now, Redux Saga Router will cancel the running saga even if the
data hasn't come back yet. This new behavior actually makes more sense because
there is no reason to complete fetching the data or delay letting the new route
saga run. If you used to depend on the previous behavior, though, then Redux
Saga Router could break your app. Therefore, this release was a major bump so
you can ensure your route sagas are safe before upgrading.

---

## v1.1.0

- Support redux-saga 0.14.x, 0.13.x, and 0.12.x

---

## v1.0.1

- Internal implementation tweaks

---

## v1.0.0

- Initial Release
