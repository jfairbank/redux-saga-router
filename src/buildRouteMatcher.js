import ruta3 from 'ruta3';

export default function buildRouteMatcher(routes) {
  const routeMatcher = ruta3();

  Object.keys(routes).forEach((route) => {
    routeMatcher.addRoute(route, routes[route]);
  });

  return routeMatcher;
}
