import buildRouteMatcher from '../src/buildRouteMatcher';

test('creates a route matcher', () => {
  const rootRoute = () => 'root route';
  const fooRoute = () => 'foo route';

  const routeMatcher = buildRouteMatcher({
    '/': rootRoute,
    '/foo': fooRoute,
  });

  const rootMatch = routeMatcher.match('/');
  const fooMatch = routeMatcher.match('/foo');

  expect(rootMatch).not.toBe(null);
  expect(fooMatch).not.toBe(null);

  expect(rootMatch.action).toBe(rootRoute);
  expect(fooMatch.action).toBe(fooRoute);
});

test('handles params', () => {
  const fooRoute = ({ id }) => `got ${id}`;
  const barRoute = ({ id, otherId }) => `${id} : ${otherId}`;

  const routeMatcher = buildRouteMatcher({
    '/foo/:id': fooRoute,
    '/bar/:id/person/:otherId': barRoute,
  });

  const fooMatch = routeMatcher.match('/foo/42');
  const barMatch = routeMatcher.match('/bar/20/person/abcd-1234');

  expect(fooMatch).not.toBe(null);
  expect(barMatch).not.toBe(null);

  expect(fooMatch.action).toBe(fooRoute);
  expect(barMatch.action).toBe(barRoute);

  expect(fooMatch.action(fooMatch.params)).toBe('got 42');
  expect(barMatch.action(barMatch.params)).toBe('20 : abcd-1234');
});
