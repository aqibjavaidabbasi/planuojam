import { login, register } from "@/services/auth";
import { createAsyncThunk } from "@reduxjs/toolkit";

// Utility: safely extract Strapi v5 error message
const getStrapiErrorMessage = (error: any): string => {
  return (
    error?.response?.data?.error?.message || // Strapi v5 API format
    error?.message || // JS Error object
    "An unexpected error occurred" // fallback
  );
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: Record<string, unknown>, thunkAPI) => {
    try {
      const res = await login(credentials);
      if (!res?.jwt) throw new Error("Login failed — missing token");
      localStorage.setItem("token", res.jwt);
      return res.user;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(getStrapiErrorMessage(error));
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (data: Record<string, unknown>, thunkAPI) => {
    try {
      const res = await register(data);
      if (!res) throw new Error("Registration failed — no response from server");
      return res.user
    } catch (error: any) {
      return thunkAPI.rejectWithValue(getStrapiErrorMessage(error));
    }
  }
);


