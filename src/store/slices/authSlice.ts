import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { User } from "@/types/common";

interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
}
const initialState: AuthState = {
    user: null,
    token: null,
    status: "idle",
  };

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials) => {
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    return res.json(); // { user, token }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
    },
  },
  //action: PayloadAction<{ user: User; token: string }>
  //action: PayloadAction<AuthState["status"]>
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
