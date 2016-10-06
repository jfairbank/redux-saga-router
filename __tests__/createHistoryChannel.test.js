import createHistoryChannel from '../src/createHistoryChannel';

function createOldHistory(initialLocation) {
  let listener = null;

  return {
    getCurrentLocation: () => initialLocation,

    listen(fn) {
      listener = fn;

      return () => {
        listener = null;
      };
    },

    emit(location) {
      listener(location);
    },
  };
}

function createHistory(initialLocation) {
  let listener = null;

  return {
    location: initialLocation,

    listen(fn) {
      listener = fn;

      return () => {
        listener = null;
      };
    },

    emit(location) {
      listener(location);
    },
  };
}

const defaultLocation = {
  pathname: '/foo',
};

test('gets initial location from getCurrentLocation if available', () => {
  const history = createOldHistory(defaultLocation);
  const channel = createHistoryChannel(history);
  const spy = jest.fn();

  channel.take(spy);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy.mock.calls[0][0]).toEqual(defaultLocation);
});

test('gets initial location from history.location if available', () => {
  const history = createHistory(defaultLocation);
  const channel = createHistoryChannel(history);
  const spy = jest.fn();

  channel.take(spy);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy.mock.calls[0][0]).toEqual(defaultLocation);
});

test('gets initial location via listening', () => {
  const history = createHistory();
  const channel = createHistoryChannel(history);
  const spy = jest.fn();

  channel.take(spy);

  history.emit(defaultLocation);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy.mock.calls[0][0]).toEqual(defaultLocation);
});

test('triggers more location changes', () => {
  const newLocation = {
    pathname: '/bar',
  };

  const history = createHistory(defaultLocation);
  const channel = createHistoryChannel(history);
  const spy = jest.fn();

  channel.take(spy);
  channel.take(spy);

  history.emit(newLocation);

  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy.mock.calls[0][0]).toEqual(defaultLocation);
  expect(spy.mock.calls[1][0]).toEqual(newLocation);
});
