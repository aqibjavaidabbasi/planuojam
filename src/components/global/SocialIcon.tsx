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
  const visibleLinks = socialLink.filter((link) => link.visible !== false && link.link);

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {visibleLinks.map((link) => {
        const platform = link.platform.toLowerCase();
        const href = /^https?:\/\//i.test(link.link) ? link.link : `https://${link.link}`;

        return (
          <a
            key={link.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${link.platform}`}
            title={link.platform}
            className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/15 bg-white text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {platform === "facebook" && <FaFacebook size={20} />}
            {platform === "linkedin" && <FaLinkedin size={20} />}
            {platform === "youtube" && <FaYoutube size={20} />}
            {platform === "instagram" && <FaInstagram size={20} />}
            {platform === "tiktok" && <FaTiktok size={20} />}
            {platform === "twitter" && <FaTwitter size={20} />}
            {platform === "pinterest" && <FaPinterest size={20} />}
            {platform === "thread" && <FaSquareThreads size={20} />}
            {platform === "reddit" && <FaRedditAlien size={20} />}
          </a>
        );
      })}
    </div>
  );
}

export default SocialIcon;
