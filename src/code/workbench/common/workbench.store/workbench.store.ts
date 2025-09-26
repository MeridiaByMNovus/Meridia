import { configureStore } from "@reduxjs/toolkit";
import mainSlice from "./workbench.store.slice.js";

export const store = configureStore({
  reducer: {
    main: mainSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const dispatch: AppDispatch = store.dispatch;
