import { updateUserData } from "@/services/auth";
import { customLogin, customRegister, JwtUserResponse, RegisterRequest, OtpSentResponse } from "@/services/authCustom";
import { User } from "@/types/common";
import { ExpectedError, getStrapiErrorMessage } from "@/utils/helpers";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const loginUser = createAsyncThunk<User, { email: string; password: string }, { rejectValue: string }>(
  "auth/loginUser",
  async (credentials, thunkAPI) => {
    try {
      const res = await customLogin(credentials) as JwtUserResponse;
      if (!res?.jwt) throw new Error('missingToken');
      localStorage.setItem("token", res.jwt);
      return res.user as User;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getStrapiErrorMessage(error as ExpectedError));
    }
  }
);

export const registerUser = createAsyncThunk<OtpSentResponse, RegisterRequest, { rejectValue: string }>(
  "auth/register",
  async (data: RegisterRequest, thunkAPI) => {
    try {
      const res = await customRegister(data) as OtpSentResponse;
      if (!res) throw new Error('registerNoResponse');
      return res;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getStrapiErrorMessage(error as ExpectedError));
    }
  }
);


export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async (data: Record<string, unknown>, thunkAPI) => {
    try {
      // Expecting data to contain at least an 'id' field and the rest as update fields
      const { id, ...updateFields } = data as { id: number } & Record<string, unknown>;
      if (!id) throw new Error('Errors.Auth.userIdRequired');
      const res = await updateUserData(id, updateFields);
      return res;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getStrapiErrorMessage(error as ExpectedError));
    }
  }
);