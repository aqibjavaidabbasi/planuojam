import { AuthState } from "@/store/slices/authSlice";
import { loginUser } from "@/store/thunks/authThunks";
import { ActionReducerMapBuilder } from "@reduxjs/toolkit";

export const loginExtraReducers = (
  builder: ActionReducerMapBuilder<AuthState>
) => {
  builder
    .addCase(loginUser.fulfilled, (state, action) => {
      console.log("log from login reducer",action.payload)
      state.user = action.payload.user;
      state.status = "succeeded";
    })
    .addCase(loginUser.pending, (state) => {
      state.status = "loading";
    })
    .addCase(loginUser.rejected, (state, action) => {
      state.user = null;
      state.status = "failed";
      state.error =
        typeof action.payload === "string" ? action.payload : "Login Failed";
    });
};
