import { FC } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

interface StarRatingProps {
  rating: number; // Rating value (e.g., 3.5)
  maxRating?: number; // Maximum rating (default: 5)
}

const StarRating: FC<StarRatingProps> = ({ rating, maxRating = 5 }) => {
  const fullStars = Math.floor(rating); // Number of full stars
  const hasHalfStar = rating % 1 >= 0.5; // Check for half star
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0); // Number of empty stars

  return (
    <div className="flex items-center space-x-1">
      {/* Render full stars */}
      {[...Array(fullStars)].map((_, index) => (
        <FaStar key={`full-${index}`} className="text-yellow-400" />
      ))}
      {/* Render half star if applicable */}
      {hasHalfStar && <FaStarHalfAlt className="text-yellow-400" />}
      {/* Render empty stars */}
      {[...Array(emptyStars)].map((_, index) => (
        <FaRegStar key={`empty-${index}`} className="text-yellow-400" />
      ))}
    </div>
  );
};

export default StarRating;