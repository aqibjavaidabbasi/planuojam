'use client'
import React from "react";
import { useAppSelector } from "@/store/hooks";
import ListingCard from "../Dynamic/ListingCard";
import NoDataCard from "../custom/NoDataCard";

function FavouriteListings() {
  const { items } = useAppSelector((state) => state.likedListings);
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Favourite Listings</h1>
        <p className="text-gray-600 mt-2">
          Your saved and favourite properties.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length > 0 ? items.map((item) => (
          <ListingCard key={item.documentId} item={item.listing} />
        ))
          : <div className="col-span-3">
            <NoDataCard>No Favourite Listings to show</NoDataCard>
          </div>
        }
      </div>
    </div>
  );
}

export default FavouriteListings;
