import { login, register, updateUserData } from "@/services/auth";
import { getStrapiErrorMessage } from "@/utils/helpers";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: Record<string, unknown>, thunkAPI) => {
    try {
      const res = await login(credentials);
      if (!res?.jwt) throw new Error("Login failed — missing token");
      localStorage.setItem("token", res.jwt);
      return res.user;
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getStrapiErrorMessage(error));
    }
  }
);


export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async (data: Record<string, unknown>, thunkAPI) => {
    try {
      // Expecting data to contain at least an 'id' field and the rest as update fields
      const { id, ...updateFields } = data as { id: number } & Record<string, unknown>;
      if (!id) throw new Error("User ID is required to update user data");
      const res = await updateUserData(id, updateFields);
      return res;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getStrapiErrorMessage(error));
    }
  }
);