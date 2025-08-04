'use client'
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import React from "react";
import { FaRegUser } from "react-icons/fa";
import { RiLoginCircleLine } from "react-icons/ri";

function ProfileBtn() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  console.log(user);
  return (
    <div className="border border-primary rounded-full p-2 cursor-pointer group hover:bg-primary transition-colors">
      {user ? (
        <div className="flex items-center gap-2">
          <FaRegUser className="text-primary group-hover:text-white text-sm md:text-base" />
          <span  className="capitalize text-sm md:text-base group-hover:text-white font-medium">{user?.username}</span>        </div>
      ) : (
        <div className="flex items-center gap-2" onClick={()=>router.push('/auth/login')}>
          <RiLoginCircleLine className="text-primary group-hover:text-white text-sm md:text-base" />
          <span  className="capitalize text-sm md:text-base group-hover:text-white font-medium">Login</span>
        </div>
      )}
    </div>
  );
}

export default ProfileBtn;
