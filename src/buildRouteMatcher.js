import ruta3 from 'ruta3';

function normalizeRoutes(routes) {
  if (Array.isArray(routes)) {
    return routes;
  } else if (routes !== null && typeof routes === 'object') {
    return Object.keys(routes).map((pattern) => ({ pattern, handler: routes[pattern] }));
  }

  throw new Error(
    'Provided routes must either be an object in the form ' +
    '{ [pattern]: handler }, or an array whose elements are objects in the ' +
    'form { pattern: string, handler: function }.'
  );
}

export default function buildRouteMatcher(routes) {
  const routeMatcher = ruta3();

  normalizeRoutes(routes).forEach(({ pattern, handler }) => {
    routeMatcher.addRoute(pattern, handler);
  });

  return routeMatcher;
}
