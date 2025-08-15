import { updateUser } from "@/store/thunks/authThunks";
import { AuthState } from "@/store/slices/authSlice";
import { AnyAction, PayloadAction } from "@reduxjs/toolkit";

export function updateUserDataExtraReducers(builder: any) {
  builder
    .addCase(updateUser.pending, (state: AuthState) => {
      state.status = "loading";
      state.error = null;
    })
    .addCase(updateUser.fulfilled, (state: AuthState, action: PayloadAction<any>) => {
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
