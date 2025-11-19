import { updateUser } from "@/store/thunks/authThunks";
import { AuthState } from "@/store/slices/authSlice";
import { ActionReducerMapBuilder, AnyAction, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/types/userTypes";

export function updateUserDataExtraReducers(builder: ActionReducerMapBuilder<AuthState>) {
  builder
    .addCase(updateUser.pending, (state: AuthState) => {
      state.status = "loading";
      state.error = null;
    })
    .addCase(updateUser.fulfilled, (state: AuthState, action: PayloadAction<User>) => {
      state.status = "succeeded";
      // Update the user in state with the new data
      state.user = {
        ...state.user,
        ...action.payload,
      };
      state.error = null;
    })
    .addCase(updateUser.rejected, (state: AuthState, action: AnyAction) => {
      state.status = "failed";
      state.error = action.payload || action.error?.message || "Failed to update user";
    });
}
