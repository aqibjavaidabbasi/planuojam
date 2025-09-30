import { LikedListingState } from "@/store/slices/likedListingSlice";
import { addToLikedListing, fetchLikedListing, removeFromLikedListing } from "@/store/thunks/likedListing";
import { ActionReducerMapBuilder } from "@reduxjs/toolkit";

export const fetchLikedListingReducer = (
    builder: ActionReducerMapBuilder<LikedListingState>
) => {
    builder
        .addCase(fetchLikedListing.fulfilled, (state, action) => {
            state.items = action.payload;
            state.status = "succeeded";
        })
        .addCase(fetchLikedListing.pending, (state) => {
            state.status = "loading";
        })
        .addCase(fetchLikedListing.rejected, (state, action) => {
            state.status = "failed";
            state.error =
                typeof action.payload === "string" ? action.payload : "Failed to fetch wishlist";
        });
};

export const addToLikedListingReducer = (
    builder: ActionReducerMapBuilder<LikedListingState>
) => {
    builder
        .addCase(addToLikedListing.pending, (state) => {
            state.status = 'loading'
        })
        .addCase(addToLikedListing.fulfilled, (state, action) => {
            state.status = 'succeeded'
            state.items.push(action.payload as never);
        })
        .addCase(addToLikedListing.rejected, (state, action) => {
            state.status = 'failed'
            state.error = typeof action.payload === "string" ? action.payload : "Failed to add to wishlist";
        })
}
export const removeFromLikedListingReducer = (
    builder: ActionReducerMapBuilder<LikedListingState>
) => {
    builder
        .addCase(removeFromLikedListing.pending, (state) => {
            state.status = 'loading'
        })
        .addCase(removeFromLikedListing.fulfilled, (state, action) => {
            state.status = 'succeeded'
            state.items = state.items.filter((item) => item.documentId !== action.payload)
        })
        .addCase(removeFromLikedListing.rejected, (state, action) => {
            state.status = 'failed'
            state.error = typeof action.payload === "string" ? action.payload : "Failed to remove from wishlist";
        })
}