import { AuthState } from "@/store/slices/authSlice";
import { loginUser } from "@/store/thunks/authThunks";
import { ActionReducerMapBuilder } from "@reduxjs/toolkit";
import { User } from "@/types/common";

export const loginExtraReducers = (
  builder: ActionReducerMapBuilder<AuthState>
) => {
  builder
    .addCase(loginUser.fulfilled, (state, action) => {
      state.user = action.payload as User;
      state.status = "succeeded";
    })
    .addCase(loginUser.pending, (state) => {
      state.status = "loading";
    })
    .addCase(loginUser.rejected, (state, action) => {
      state.user = null;
      state.status = "failed";
      const p = action.payload as string | undefined;
      state.error = p ?? "Login Failed";
    });
};
