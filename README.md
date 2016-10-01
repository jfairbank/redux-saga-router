# Redux Saga Router

#### A router for Redux Saga

Redux Saga Router gives you a saga for handling clientside routes in your Redux
Saga application. This affords you perfect way to manage side effects or
dispatch Redux actions in response to route changes.

## Install

    $ npm install --save redux-saga-router@latest

## Usage

Redux Saga Router comes equipped with a `router` saga and two history
strategies, `createBrowserHistory` and `createHashHistory`.

The `router` saga expects a history object and a routes object with key-value
pairs of route paths to other sagas (or just functions).

To create a history object, you can use `createBrowserHistory` or
`createHashHistory`. `createBrowserHistory`uses HTML5 `pushState` while
`createHashHistory` uses (you guessed it) hashes, which is perfect for older
browsers. These two history creation functions in fact come from the
[history](https://github.com/mjackson/history) library.

```js
// saga.js

// ES2015
import { router, createBrowserHistory } from 'redux-saga-router';

// Or CJS
const rsr = require('redux-saga-router');
const router = rsr.router;
const createBrowserHistory = rsr.createBrowserHistory;

const history = createBrowserHistory();

const routes = {
  // Method syntax
  *'/users'() {
    const users = yield call(fetchUsers);
    yield put(setUsers(users));
  },

  // Or long form with function expression
  '/users/:id': function* userSaga({ id }) {
    const user = yield call(fetchUser, id);
    yield put(setCurrentUser(user));
  },
};

function* mainSaga() {
  const data = yield call(fetchInitialData);

  yield put(ready(data));

  yield* router(history, routes);
}
```
