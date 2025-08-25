import { Vendor } from "@/types/pagesTypes";
import React from "react";



interface VendorCardProps {
  item: Vendor;
}

function VendorCard({ item }: VendorCardProps) {
  return (
    <div>
      {(item.about || item.experienceYears || item.serviceArea) && (
        <React.Fragment>
          <h3 className="text-lg font-semibold text-primary">Vendor Details</h3>
          <p className="text-secondary">{item.about}</p>
          <p className="text-secondary">Experience: {item.experienceYears} years</p>
          {item.serviceArea && (
            <div>
              <p className="text-secondary">
                Service Area:{" "}
                {[
                  item.serviceArea.length > 0
                    ? item.serviceArea.map((s) => s.state.name).join(", ")
                    : null,
                  item.serviceArea.length > 0
                    ? item.serviceArea.map((c) => c.city.name).join(", ")
                    : null,
                ]
                  .filter(Boolean)
                  .join(", ") || "Not specified"}
              </p>
            </div>
          )}
        </React.Fragment>
      )}
    </div>
  );
}

export default VendorCard;
