import { createSlice } from "@reduxjs/toolkit";
import { User } from "@/types/common";
import { loginExtraReducers } from "../extraReducers/auth/loginReducer";
import { registerExtraReducers } from "../extraReducers/auth/registerReducer";

export interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}
const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("token");
    },
    setUser(state, action){
      state.user = action.payload;
    }
  },
  extraReducers: (builder) => {
    loginExtraReducers(builder);
    registerExtraReducers(builder);
  },
});

export const { logout , setUser} = authSlice.actions;
export default authSlice.reducer;
