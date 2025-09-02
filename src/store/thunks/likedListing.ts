import { createAsyncThunk } from "@reduxjs/toolkit"
import { getLikedListings } from "@/services/likedListing"
import { getStrapiErrorMessage } from "@/utils/helpers"
import { RootState } from "../index"
import { createLikedListing, deleteLikedListing } from "@/services/likedListing"

// Async thunks for server sync
export const fetchLikedListing = createAsyncThunk(
    'wishlist/fetchLikedListing',
    async (userId: string, thunkApi) => {
      try {
        const res = await getLikedListings(userId)
        return res.data
      } catch (err: unknown) {
        return thunkApi.rejectWithValue(getStrapiErrorMessage(err))
      }
    }
  )
  
  export const addToLikedListing = createAsyncThunk(
    'wishlist/addToLikedListing',
    async (listingId: string, thunkApi) => {
      const state = thunkApi.getState() as RootState
      const userId = state.auth.user?.documentId
  
      
      try {
          if (!userId) {
            return thunkApi.rejectWithValue('User not logged in')
          }
          if (!listingId) {
            return thunkApi.rejectWithValue('Listing ID is required')
          }
          const data = {
            data : {
                user: userId,
                listing: listingId
            }
          }
        const res = await createLikedListing(data)
        return res.data
      } catch (err: unknown) {
        return thunkApi.rejectWithValue(getStrapiErrorMessage(err))
      }
    }
  )
  
  export const removeFromLikedListing = createAsyncThunk(
    'wishlist/removeFromLikedListing',
    async (listingId: string, thunkApi) => {
      const state = thunkApi.getState() as RootState
      const userId = state.auth.user?.documentId
  
      if (!userId) {
        return thunkApi.rejectWithValue('User not logged in')
      }
  
      try {
        await deleteLikedListing(listingId)
        return listingId
      } catch (err: unknown) {
        return thunkApi.rejectWithValue(getStrapiErrorMessage(err))
      }
    }
  )