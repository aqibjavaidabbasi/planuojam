import React from "react";

type Amenity = {
  text: string;
};

type Location = {
  address: string;
  city: string;
  country: string;
};

type VenueItem = {
  amneties?: Amenity[];
  capacity?: number;
  location?: Location;
};

type VenueCardProps = {
  item: VenueItem;
};

function VenueCard({ item }: VenueCardProps) {
  return (
    <div>
      {(item.amneties && item.amneties.length > 0) ||
        item.capacity ||
        (item.location && item.location.address) ? (
        <div>
          <h3 className="text-lg font-semibold text-primary">Venue Details</h3>
          {item.amneties && (
            <ul className="list-disc pl-5 text-secondary">
              {item.amneties.map((amenity, i) => (
                <li key={i}>{amenity.text}</li>
              ))}
            </ul>
          )}
          {item.capacity && (
            <p className="text-secondary">Capacity: {item.capacity}</p>
          )}
          {item.location && (
            <p className="text-secondary">
              Location: {item.location.address}, {item.location.city},{" "}
              {item.location.country}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default VenueCard;
