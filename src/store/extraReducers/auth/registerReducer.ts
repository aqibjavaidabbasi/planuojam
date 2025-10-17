import { AuthState } from "@/store/slices/authSlice";
import { registerUser } from "@/store/thunks/authThunks";
import { ActionReducerMapBuilder } from "@reduxjs/toolkit";

export const registerExtraReducers = (
  builder: ActionReducerMapBuilder<AuthState>
) => {
  builder
    .addCase(registerUser.fulfilled, (state) => {
      // registerUser returns OtpSentResponse (OTP flow). We don't have a User yet.
      state.status = "succeeded";
    })
    .addCase(registerUser.pending, (state) => {
      state.status = "loading";
    })
    .addCase(registerUser.rejected, (state, action) => {
      state.status = "failed";
      state.error =
        typeof action.payload === "string" ? action.payload : "Register Failed";
    });
};
