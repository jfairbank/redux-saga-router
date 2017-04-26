# Redux Saga Router

[![Travis branch](https://img.shields.io/travis/jfairbank/redux-saga-router/master.svg?style=flat-square)](https://travis-ci.org/jfairbank/redux-saga-router)
[![npm](https://img.shields.io/npm/v/redux-saga-router.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga-router)

#### A router for Redux Saga

Redux Saga Router gives you a saga for handling clientside routes in your Redux
Saga application. This affords you a perfect way to manage side effects or
dispatch Redux actions in response to route changes.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Behavior](#behavior)
- [Options](#options)
- [Navigation](#navigation)
  - [Hash History](#hash-history)
  - [Browser History](#browser-history)
  - [Browser History with React](#browser-history-with-react)
  - [React Router](#react-router)

## Install

    $ npm install --save redux-saga-router

## Usage

Redux Saga Router comes equipped with a `router` saga and two history
strategies, `createBrowserHistory` and `createHashHistory`.

The `router` saga expects a history object and a routes object with key-value
pairs of route paths to other sagas (or just functions). It also takes optional
third argument with [additional options](#options).

To create a history object, you can use `createBrowserHistory` or
`createHashHistory`. `createBrowserHistory` uses HTML5 `pushState` while
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

const options = {
  // A saga to be spawned in parallel on every location change
  *beforeRouteChange() {
    yield put(clearNotifications());
  }
}

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

  yield* router(history, routes, options);  // [options] is not required
}
```

## Behavior

Redux Saga Router will `spawn` the matching route saga. When the location
changes, the current running saga will be cancelled. As such, you might want to
[clean up](https://redux-saga.github.io/redux-saga/docs/advanced/TaskCancellation.html)
your saga in that event.

If you wish to avoid your saga's being cancelled, you can `spawn` a sub saga in
your route saga like the following:

```js
const routes = {
  *'/'() {
    yield spawn(subSaga);
  },

  // Or long form with function expression
  '/': function* homeSaga() {
    yield spawn(subSaga);
  },
};
```

In the event of an unhandled error occurring in one of your sagas, the error
will stop the running saga and will not propagate to the router. That means that
your application will continue to function when you hit other routes. That also
means you should ensure you handle any potential errors that could occur in your
route sagas.

## Options

The `router` saga may also take a third argument - an `options` object - which
allows to specify additional behaviour as described below:

Key                 | Description
--------------------|--------------------------------------------------------
`beforeRouteChange` | A saga spawned on any location change, before other saga


## Navigation

### Hash History
If you use hash history, then navigation will work right out of the box.

```js
import { router, createHashHistory } from 'redux-saga-router';

const history = createHashHistory();

const routes = {
  // ...
};

function* mainSaga() {
  const data = yield call(fetchInitialData);

  yield put(ready(data));

  yield* router(history, routes);
}
```

```html
<nav>
  <ul>
    <li><a href="#/users">Users</a></li>
    <li><a href="#/users/1">A Specific User</a></li>
  </ul>
</nav>
```

### Browser History

Browser history depends on `pushState` changes, so you'll need a method for
making anchor tags change history state instead of actually exhibiting their
default behavior. Also, if you're building a single-page application, your
server will need to support your client side routes to ensure your app loads
properly.

```js
import { router, createBrowserHistory } from 'redux-saga-router';

const history = createBrowserHistory();

// This is a naive example, so you might want something more robust
document.addEventListener('click', (e) => {
  const el = e.target;

  if (el.tagName === 'A') {
    e.preventDefault();
    history.push(el.pathname);
  }
});

const routes = {
  // ...
};

function* mainSaga() {
  // ...
}
```

### Browser History with React

If you're using React in your application, then Redux Saga Router does export a
higher-order component (HOC) that allows you to abstract away dealing with
`pushState` manually. You can import the `createLink` HOC from
`redux-saga-router/react` to create a `Link` component similar to what's
available in React Router. Just pass in your `history` object to the
`createLink` function to create the `Link` component. You'll probably want a
separate file in your application for exporting your `history` object and your
`Link` component.

```js
// history.js

import { createBrowserHistory } from 'redux-saga-router';
import { createLink } from 'redux-saga-router/react'

const history = createBrowserHistory();

export const Link = createLink(history);
export { history };
```

```js
// saga.js

import { router } from 'redux-saga-router';
import { history } from './history';

const routes = {
  // ...
};

function* mainSaga() {
  const data = yield call(fetchInitialData);

  yield put(ready(data));

  yield* router(history, routes);
}
```

```jsx
// App.js

import React from 'react';
import { Link } from './history';

export default function App() {
  return (
    <nav>
      <ul>
        <li><Link to="/users">Users</Link></li>
        <li><Link to="/users/1">A Specific User</Link></li>
      </ul>
    </nav>
  );
}
```

### React Router

Redux Saga Router can also work in tandem with React Router! Instead of using
one of Redux Saga Router's history creation functions, just use your history
object from React Router.

**NOTE:** examples below are for React Router v2/3 for now.

```js
// saga.js

import { router } from 'redux-saga-router';
import { browserHistory as history } from 'react-router';

const routes = {
  // ...
};

export default function* mainSaga() {
  const data = yield call(fetchInitialData);

  yield put(ready(data));

  yield* router(history, routes);
}
```

```jsx
// App.js

import React from 'react';
import { Link } from 'react-router';

export default function App({ children }) {
  return (
    <div>
      <nav>
        <ul>
          <li><Link to="/users">Users</Link></li>
          <li><Link to="/users/1">A Specific User</Link></li>
        </ul>
      </nav>

      <div>
        {children}
      </div>
    </div>
  );
}
```

```jsx
import React from 'react';
import { render } from 'react-dom';
import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { Router, Route, browserHistory as history } from 'react-router';
import App from './App';
import Users from './Users';
import User from './User';
import mainSaga from './saga';

function reducer() {
  return {};
}

const sagaMiddleware = createSagaMiddleware();
const store = createStore(reducer, applyMiddleware(sagaMiddleware));

sagaMiddleware.run(mainSaga);

render((
  <Router history={history}>
    <Route path="/" component={App}>
      <Route path="/users" component={Users} />
      <Route path="/users/:id" component={User} />
    </Route>
  </Router>
), document.getElementById('main'));
```
