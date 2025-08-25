import React from "react";
import NoDataCard from "../custom/NoDataCard";
import Button from "../custom/Button";
import ListingItemModal from "../modals/ListingItemModal";

function Mylistings() {
  const [open, setOpen] = React.useState(false);

  return (  
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Listings</h1>
          <p className="text-gray-600 mt-2">Manage all your property listings.</p>
        </div>
        <div>
          <Button style="secondary" size="large" onClick={() => setOpen(true)}>Create Listing</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-3 flex flex-col items-center gap-4 justify-center h-full">
          <NoDataCard>No Listings to show. Start by creating your first listing</NoDataCard>
          <Button style="secondary" size="large" onClick={() => setOpen(true)}>Create Listing</Button>
        </div>
      </div>

      <ListingItemModal
        isOpen={open}
        onClose={() => setOpen(false)}
        endpoint="listing-items" // change to your actual Strapi collection name if different
        onSaved={() => {
          // TODO: trigger a refresh/fetch here when listings are implemented
        }}
      />
    </div>
  );
}

export default Mylistings;
