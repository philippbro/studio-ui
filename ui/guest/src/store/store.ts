/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { createEpicMiddleware } from 'redux-observable';
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { GuestStandardAction } from './models/GuestStandardAction';
import epic from './epics/root';
import reducer from './reducers/root';
import { Middleware } from 'redux';
import { GuestState, GuestStore } from './models/GuestStore';
import { Observable } from 'rxjs';
import { distinctUntilChanged, pluck, share } from 'rxjs/operators';

let store: GuestStore;

export function createGuestStore(): GuestStore {
  if (store) {
    return store;
  }
  const epicMiddleware = createEpicMiddleware<
    GuestStandardAction,
    GuestStandardAction,
    GuestState
  >();
  const middleware = [
    ...getDefaultMiddleware<GuestState, { thunk: boolean; serializableCheck: boolean }>({
      thunk: false,
      serializableCheck: false
    }),
    epicMiddleware
  ];
  store = configureStore<GuestState, GuestStandardAction, Middleware[]>({
    reducer,
    middleware
  });
  epicMiddleware.run(epic);
  return store;
}

export default createGuestStore;

export const state$ = new Observable((subscriber) => {
  const store = createGuestStore();
  return store.subscribe(() => {
    const state = store.getState();
    subscriber.next(state.models);
  });
}).pipe(share());

export const models$ = state$.pipe(
  pluck('content'),
  distinctUntilChanged()
);

export const contentTypes$ = state$.pipe(
  pluck('contentTypes'),
  distinctUntilChanged()
);