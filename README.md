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
- [Routes](#routes)
- [Options](#options)
- [Navigation](#navigation)
  - [Hash History](#hash-history)
  - [Browser History](#browser-history)
  - [Browser History with React](#browser-history-with-react)
  - [React Router](#react-router)

## Install

Yarn or npm.

```sh
yarn add redux-saga-router
```

```sh
npm install --save redux-saga-router
```

## Usage

Redux Saga Router comes equipped with a `router` saga and two history
strategies, `createBrowserHistory` and `createHashHistory`.

The `router` saga expects a history object and a routes object with key-value
pairs of route paths to other sagas. It also takes an optional third argument with
[additional options](#options).

To create a history object, you can use `createBrowserHistory` or
`createHashHistory`. `createBrowserHistory` uses HTML5 `pushState` while
`createHashHistory` uses (you guessed it) hashes, which is perfect for older
browsers. These two history creation functions in fact come from the
[history](https://github.com/mjackson/history) library.

```js
import { call, fork, put } from 'redux-saga';
import { router, createBrowserHistory } from 'redux-saga-router';

const history = createBrowserHistory();

const routes = {
  '/users': function* usersSaga() {
    const users = yield call(fetchUsers);
    yield put(setUsers(users));
  },

  '/users/:id': function* userSaga({ id }) {
    const user = yield call(fetchUser, id);
    yield put(setCurrentUser(user));
  },
};

function* mainSaga() {
  const data = yield call(fetchInitialData);

  yield put(ready(data));

  // The recommended way is to `fork` the router, but you can delegate with
  // yield* too
  yield fork(router, history, routes);
}
```

## Behavior

Redux Saga Router will `spawn` the **first** matching route saga. When the location
changes, the current running saga will be cancelled. As such, you might want to
[clean up](https://redux-saga.js.org/docs/advanced/TaskCancellation.html)
your saga in that event.

If you wish to avoid your saga's being cancelled, you can `spawn` a sub saga in
your route saga like the following:

```js
const routes = {
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

## Routes

Routes may be expressed as either an object or an array with the main difference 
being that the array form preserves order and, therefore, the precedence of
routes.

```js
const objectFormRoutes = {
  '/foo': fooHandler,
  '/bar': barHandler,
};

const arrayFormRoutes = [
  { pattern: '/foo', handler: fooHandler },
  { pattern: '/bar', handler: barHandler },
];
```

### Exact Matching

This route will only match `/foo` exactly.

```js
const routes = {
  '/foo': saga,
};
```

### Path Parameters

You can capture dynamic path parameters by prepending them with the `:` symbol.
The name you use will be assigned to a property of the same name on a parameters
object that is passed into your route saga.

```js
const routes = {
  // Capture the user id with `:id` into an `id` property of the parameters
  // object that is passed into `userSaga`.
  '/users/:id': function* userSaga({ id }) {
    const user = yield call(fetchUser, id);
    yield put(setCurrentUser(user));
  },

  // You can capture multiple dynamic path parameters too.
  '/dogs/:id/friends/:friendId': function* dogSaga({ id, friendId }) {
    // ...
  },
};
```

If you specify a dynamic path parameter, then it will be required. This route
will match `/bar/42` but NOT `/bar`.

```js
const routes = {
  '/bar/:id': saga,
};
```

### Optional Named Parameters

However, you can make a path parameter optional, by ending it with `?`.

This route will match `/bar/42` AND `/bar`.

```js
const routes = {
  '/bar/:id?': saga,
};
```

Using a `period` before an optional parameter can be optional too.

This route will match `/bar/LICENSE` and `/bar/README.md`.

```js
const routes = {
  '/bar/:fname.:ext?': saga,
};
```

### Wildcard

You can use `*` as a wildcard to match many routes.

This route would match `/bar` and `/bar/baz/foo`.

```js
const routes = {
  '/bar/*': saga,
};
```

### Route Precedence

Sometimes you want some routes to take precedence over others. For example,
consider a `/users/invite` route and a `/users/:id` route. JavaScript objects
don't guarantee order, so the `/users/:id` route could take precedence and match
`/users/invite`. So, the `newUser` handler would never run.

```js
// Can't guarantee precedence with an object
const routes = {
  '/users/invite': inviteUser,
  '/users/:id': newUser,
};
```

To fix this problem, you can define routes with an array of route objects like
so.

```js
const routes = [
  { pattern: '/users/invite', handler: inviteUser },
  { pattern: '/users/:id', handler: newUser },
];
```

The array form will register routes in the order you provide, ensuring
precedence.

## Options

As mentioned earlier, the `router` saga may also take a third argument, an
optional `options` object, which allows you to specify additional behaviour as
described below:

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

  yield fork(router, history, routes);
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

If you are also using React Router, you can use the `Link` component that is shipped with React Router.

```js
// history.js

import { createLink } from 'redux-saga-router/react'

// Without React Router v4:
import { createBrowserHistory } from 'redux-saga-router';

// With the history npm package:
import createBrowserHistory from 'history/createBrowserHistory';

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

  yield fork(router, history, routes);
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

Redux Saga Router can also work in tandem with React Router (v2, v3, and v4)! Instead of
using one of Redux Saga Router's history creation functions, just use your
history object from React Router (v2, v3) or use the history creation functions provided by the history npm package (v4).

```js
// saga.js

import { router } from 'redux-saga-router';

// React Router v2 and v3:
import { browserHistory as history } from 'react-router';

// React Router v4:
import createBrowserHistory from 'history/createBrowserHistory';
const history = createBrowserHistory();

const routes = {
  // ...
};

export default function* mainSaga() {
  const data = yield call(fetchInitialData);

  yield put(ready(data));

  yield fork(router, history, routes);
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
import App from './App';
import Users from './Users';
import User from './User';
import mainSaga from './saga';

// React Router v2 and v3:
import { Router, Route, browserHistory as history } from 'react-router';

// React Router v4:
import createBrowserHistory from 'history/createBrowserHistory';
import { Router, Route } from 'react-router';
const history = createBrowserHistory();

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
