import Promise from 'pinkie-promise';

export default function createHistoryListener(history) {
  let resolver = null;
  let initial = true;
  let initialLocation;

  if (typeof history.getCurrentLocation === 'function') {
    initialLocation = history.getCurrentLocation();
  } else {
    initialLocation = history.location;
  }

  history.listen(location => {
    if (!initialLocation) {
      initialLocation = location;
    } else if (resolver) {
      resolver(location);
      resolver = null;
    }
  });

  return function listen() {
    if (initial) {
      initial = false;
      return Promise.resolve(initialLocation);
    }

    return new Promise(resolve => {
      if (!resolver) {
        resolver = resolve;
      }
    });
  };
}
