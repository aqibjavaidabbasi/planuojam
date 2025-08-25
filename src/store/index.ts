import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import likedListingSlice from "./slices/likedListingSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    likedListings: likedListingSlice,
    // other slices like product, listings etc
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
