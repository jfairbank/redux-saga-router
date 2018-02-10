import buildRouteMatcher from '../src/buildRouteMatcher';

test('creates a route matcher by object syntax', () => {
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

test('creates a route matcher by array syntax, honouring route order', () => {
  const fooRoute = () => 'foo route';
  const fooBarRoute = () => 'foo bar route';

  const descendingSpecificityMatcher = buildRouteMatcher([
    { pattern: '/foo/bar', handler: fooBarRoute },
    { pattern: '/foo/:arg', handler: fooRoute },
  ]);
  const ascendingSpecificityMatcher = buildRouteMatcher([
    { pattern: '/foo/:arg', handler: fooRoute },
    { pattern: '/foo/bar', handler: fooBarRoute },
  ]);

  const descendingFooMatch = descendingSpecificityMatcher.match('/foo/baz');
  const descendingFooBarMatch = descendingSpecificityMatcher.match('/foo/bar');
  const ascendingFooMatch = ascendingSpecificityMatcher.match('/foo/baz');
  const ascendingFooBarMatch = ascendingSpecificityMatcher.match('/foo/bar');

  expect(descendingFooMatch).not.toBe(null);
  expect(descendingFooBarMatch).not.toBe(null);
  expect(ascendingFooMatch).not.toBe(null);
  expect(ascendingFooBarMatch).not.toBe(null);

  expect(descendingFooMatch.action).toBe(fooRoute);
  expect(descendingFooBarMatch.action).toBe(fooBarRoute);
  expect(ascendingFooMatch.action).toBe(fooRoute);
  expect(ascendingFooBarMatch.action).toBe(fooRoute);
  expect(ascendingFooMatch.params.arg).toBe('baz');
  expect(ascendingFooBarMatch.params.arg).toBe('bar');
});

test('throws an error when given incompatible values for routes', () => {
  expect(() => {
    buildRouteMatcher(null);
  }).toThrow();

  expect(() => {
    buildRouteMatcher(undefined);
  }).toThrow();

  expect(() => {
    buildRouteMatcher('string');
  }).toThrow();

  expect(() => {
    buildRouteMatcher(1234);
  }).toThrow();
});

test('recognizes fall-through pattern', () => {
  const rootRoute = () => 'root route';
  const fooRoute = () => 'foo route';

  const routeMatcher = buildRouteMatcher({
    '/*': rootRoute,
    '/foo': fooRoute,
  });

  const match1 = routeMatcher.match('/foo');
  const match2 = match1.next();

  expect(match1).not.toBe(null);
  expect(match2).not.toBe(null);

  expect(match1.action).toBe(rootRoute);
  expect(match2.action).toBe(fooRoute);
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
