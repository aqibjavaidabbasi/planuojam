// store/wishlistSlice.js
import { createSlice } from '@reduxjs/toolkit'
import { LikedListing } from '@/types/common'
import { addToLikedListingReducer, fetchLikedListingReducer, removeFromLikedListingReducer } from '../extraReducers/likedListing/likedListingReducers';

// Helper functions for localStorage persistence
const LIKED_LISTINGS_KEY = 'likedListings';

const loadFromStorage = (): LikedListing[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LIKED_LISTINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export interface LikedListingState {
  items: LikedListing[] | [];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  lastFetched: number | null; // Timestamp of last fetch
}

const initialState: LikedListingState = {
  items: loadFromStorage(), // Load from localStorage on initialization
  status: "idle",
  error: null,
  lastFetched: null,
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
