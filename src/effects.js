import * as sagaEffects from 'redux-saga/effects';

export const call = sagaEffects.call;
export const take = sagaEffects.take;
export const spawn = sagaEffects.spawn;
export const cancel = sagaEffects.cancel;
export const join = sagaEffects.join;

// eslint-disable-next-line import/namespace
export const all = sagaEffects.all || (effects => effects);
