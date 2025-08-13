import { AuthState } from "@/store/slices/authSlice";
import { registerUser } from "@/store/thunks/authThunks";
import { ActionReducerMapBuilder } from "@reduxjs/toolkit";

export const registerExtraReducers = (
  builder: ActionReducerMapBuilder<AuthState>
) => {
  builder
    .addCase(registerUser.fulfilled, (state, action) => {
      state.user = action.payload;
      state.status = "succeeded";
    })
    .addCase(registerUser.pending, (state) => {
      state.status = "loading";
    })
    .addCase(registerUser.rejected, (state, action) => {
      state.user = null;
      state.status = "failed";
      state.error =
        typeof action.payload === "string" ? action.payload : "Login Failed";
    });
};
