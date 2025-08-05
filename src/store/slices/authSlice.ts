import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { User } from "@/types/common";
import { fetchRole, fetchUser, login } from "@/services/auth";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}
const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: Record<string, unknown>, thunkAPI) => {
    try {
      const res = await login(credentials);
      if (!res) throw new Error("Login Failed! Please try again later!");
      const jwt = res.jwt;
      localStorage.setItem("token", jwt);
      if (!jwt) throw new Error("Token Missing...! Forbidden");
      // const user = await fetchUser(jwt);
      // if (!user)
      //   throw new Error("Something went wrong! Please try again later!");
      return res.user
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.message || "Login failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
    },
    setUser(state, action){
      state.user = action.payload;
    }
  },
  //action: PayloadAction<{ user: User; token: string }>
  //action: PayloadAction<AuthState["status"]>
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log(action.payload)
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
  },
});

export const { logout , setUser} = authSlice.actions;
export default authSlice.reducer;
