import { configureStore } from "@reduxjs/toolkit";
import mainSlice from "./state_manager";

// Configure the store with both the main and suggestions reducers
export const store = configureStore({
  reducer: {
    main: mainSlice,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: { main: MainState, suggestions: SuggestionsState }
export type AppDispatch = typeof store.dispatch;
