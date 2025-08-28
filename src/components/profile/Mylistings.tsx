import React, { useEffect, useMemo, useState } from "react";
import NoDataCard from "../custom/NoDataCard";
import Button from "../custom/Button";
import ListingItemModal from "../modals/ListingItemModal";
import { useAppSelector } from "@/store/hooks";
import Select from "../custom/Select";
import { fetchListingsByUser } from "@/services/listing";
import type { ListingItem } from "@/types/pagesTypes";
import ListingCard from "@/components/Dynamic/ListingCard";

function Mylistings() {
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const user = useAppSelector((state) => state.auth.user);

  const statusOptions = useMemo(
    () => [
      { label: "Draft", value: "draft" },
      { label: "Published", value: "published" },
      { label: "Pending Review", value: "pending review" },
      { label: "Archived", value: "archived" },
    ],
    []
  );

  const loadListings = async () => {
    if (!user?.documentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchListingsByUser(user.documentId, statusFilter);
      setListings(data as ListingItem[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.documentId, statusFilter]);

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Listings</h1>
          <p className="text-gray-600 mt-2">Manage all your property listings.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="min-w-56">
            <Select
              label="Filter by status"
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              options={statusOptions}
              placeholder="All statuses"
            />
          </div>
          <Button style="secondary" size="large" onClick={() => setOpen(true)}>
            Create Listing
          </Button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && error && <p className="text-red-600">{error}</p>}

      {!loading && !error && listings.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-3 flex flex-col items-center gap-4 justify-center h-full">
            <NoDataCard>No Listings to show. Start by creating your first listing</NoDataCard>
            <Button style="secondary" size="large" onClick={() => setOpen(true)}>
              Create Listing
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && listings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((l) => (
            <ListingCard key={l.documentId} item={l as any} />
          ))}
        </div>
      )}

      <ListingItemModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSaved={() => {
          loadListings();
          setOpen(false);
        }}
      />
    </div>
  );
}

export default Mylistings;
