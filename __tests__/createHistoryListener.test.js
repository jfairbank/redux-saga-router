import createHistoryListener from '../src/createHistoryListener';

const location = {
  pathname: '/foo',
};

test('gets initial location from getCurrentLocation if available', () => {
  const history = {
    getCurrentLocation: () => location,
    listen() {},
  };

  const listen = createHistoryListener(history);

  return listen().then(initialLocation => {
    expect(initialLocation).toBe(location);
  });
});

test('gets initial location from history.location if available', () => {
  const history = {
    location,
    listen() {},
  };

  const listen = createHistoryListener(history);

  return listen().then(initialLocation => {
    expect(initialLocation).toBe(location);
  });
});

test('gets initial location via listening', () => {
  let listener;

  const history = {
    listen(l) {
      listener = l;
    },
  };

  const listen = createHistoryListener(history);

  listener(location);

  return listen().then(initialLocation => {
    expect(initialLocation).toBe(location);
  });
});

test('triggers more location changes', () => {
  let listener;

  const history = {
    location,
    listen(l) {
      listener = l;
    },
  };

  const listen = createHistoryListener(history);

  const newLocation = {
    pathname: '/bar',
  };

  // Swallow initial location
  listen();

  const promise = listen().then(triggeredLocation => {
    expect(triggeredLocation).toBe(newLocation);
  });

  listener(newLocation);

  return promise;
});
