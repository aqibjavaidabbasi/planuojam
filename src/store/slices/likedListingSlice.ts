// store/wishlistSlice.js
import { createSlice } from '@reduxjs/toolkit'
import { LikedListing } from '@/types/common'
import { addToLikedListingReducer, fetchLikedListingReducer, removeFromLikedListingReducer } from '../extraReducers/likedListing/likedListingReducers';

export interface LikedListingState {
  items: LikedListing[] | [];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}
const initialState: LikedListingState = {
  items: [],
  status: "idle",
  error: null,
};


const likedListingSlice = createSlice({
  name: 'likedListings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    fetchLikedListingReducer(builder);
    addToLikedListingReducer(builder);
    removeFromLikedListingReducer(builder);
  },
})

export default likedListingSlice.reducer
