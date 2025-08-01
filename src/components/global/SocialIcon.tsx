import { SocialLink } from "@/types/pagesTypes";
import React from "react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaRedditAlien,
  FaTiktok,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import { FaSquareThreads } from "react-icons/fa6";

function SocialIcon({ socialLink }: { socialLink: SocialLink[] }) {
  return (
    <div className="flex items-center gap-2.5 md:gap-1.5  flex-wrap lg:items-start justify-center lg:justify-start">
      {socialLink.map((link) => (
        <span
          key={link.id}
          onClick={() => window.open(link.link, "_blank")}
          className="bg-white p-2 rounded-full cursor-pointer hover:bg-primary hover:text-white"
        >
          {link.platform.toLowerCase() === "facebook" && (
            <FaFacebook size={20} />
          )}
          {link.platform.toLowerCase() === "linkedin" && (
            <FaLinkedin size={20} />
          )}
          {link.platform.toLowerCase() === "youtube" && <FaYoutube size={20} />}
          {link.platform.toLowerCase() === "instagram" && (
            <FaInstagram size={20} />
          )}
          {link.platform.toLowerCase() === "tiktok" && <FaTiktok size={20} />}
          {link.platform.toLowerCase() === "twitter" && <FaTwitter size={20} />}
          {link.platform.toLowerCase() === "pinterest" && (
            <FaPinterest size={20} />
          )}
          {link.platform.toLowerCase() === "thread" && (
            <FaSquareThreads size={20} />
          )}
          {link.platform.toLowerCase() === "reddit" && (
            <FaRedditAlien size={20} />
          )}
        </span>
      ))}
    </div>
  );
}

export default SocialIcon;
