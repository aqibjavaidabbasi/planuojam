import { createAsyncThunk } from "@reduxjs/toolkit"
import { getLikedListings } from "@/services/likedListing"
import { ExpectedError, getStrapiErrorMessage } from "@/utils/helpers"
import { RootState } from "../index"
import { createLikedListing, deleteLikedListing } from "@/services/likedListing"
// Async thunks for server sync
export const fetchLikedListing = createAsyncThunk(
    'wishlist/fetchLikedListing',
    async (
      { userId, locale }: { userId: number; locale?: string },
      thunkApi
    ) => {
      try {
        if (!userId) {
          return thunkApi.rejectWithValue('User ID is required')
        }
        
        const res = await getLikedListings(userId, locale)
        return res.data
      } catch (err: unknown) {
        return thunkApi.rejectWithValue(getStrapiErrorMessage(err as ExpectedError))
      }
    }
  )
  
  export const addToLikedListing = createAsyncThunk(
    'wishlist/addToLikedListing',
    async (documentId: string, thunkApi) => {
      const state = thunkApi.getState() as RootState
      const userId = state.auth.user?.id
      
      try {
          if (!userId) {
            return thunkApi.rejectWithValue('User not logged in')
          }
          if (!documentId) {
            return thunkApi.rejectWithValue('Listing document ID is required')
          }

          const res = await createLikedListing({
            userId: Number(userId),
            listing: documentId
          })
          
          return res.data
      } catch (err: unknown) {
        return thunkApi.rejectWithValue(getStrapiErrorMessage(err as ExpectedError))
      }
    }
  )
  
  export const removeFromLikedListing = createAsyncThunk(
    'wishlist/removeFromLikedListing',
    async (documentId: string, thunkApi) => {
      const state = thunkApi.getState() as RootState
      const userId = state.auth.user?.id

      if (!userId) {
        return thunkApi.rejectWithValue('User not logged in')
      }

      try {
        await deleteLikedListing(documentId)
        return documentId
      } catch (err: unknown) {
        return thunkApi.rejectWithValue(getStrapiErrorMessage(err as ExpectedError))
      }
    }
  )