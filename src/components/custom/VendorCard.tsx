import React from "react";

interface ServiceArea {
  countries?: { name: string }[];
  states?: { name: string }[];
  cities?: { name: string }[];
}

interface VendorItem {
  about: string;
  experienceYears: number;
  serviceArea?: ServiceArea;
}

interface VendorCardProps {
  item: VendorItem;
}

function VendorCard({ item }: VendorCardProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-primary">Vendor Details</h3>
      <p className="text-secondary">{item.about}</p>
      <p className="text-secondary">Experience: {item.experienceYears} years</p>
      {item.serviceArea && (
        <div>
          <p className="text-secondary">
            Service Area:{" "}
            {[
              item.serviceArea.countries &&
              item.serviceArea.countries.length > 0
                ? item.serviceArea.countries.map((c) => c.name).join(", ")
                : null,
              item.serviceArea.states && item.serviceArea.states.length > 0
                ? item.serviceArea.states.map((s) => s.name).join(", ")
                : null,
              item.serviceArea.cities && item.serviceArea.cities.length > 0
                ? item.serviceArea.cities.map((c) => c.name).join(", ")
                : null,
            ]
              .filter(Boolean)
              .join(", ") || "Not specified"}
          </p>
        </div>
      )}
    </div>
  );
}

export default VendorCard;
