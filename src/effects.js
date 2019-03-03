import * as sagaEffects from 'redux-saga/effects';

export const { call, take, spawn, cancel, join } = sagaEffects;

export const all = sagaEffects.all || (effects => effects);
