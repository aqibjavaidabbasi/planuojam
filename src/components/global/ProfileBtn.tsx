'use client';
import { fetchUser } from '@/services/auth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FaRegUser } from 'react-icons/fa';
import { RiLoginCircleLine } from 'react-icons/ri';
import { logout, setUser } from '@/store/slices/authSlice';
import Loader from '../custom/Loader';
import { User } from '@/types/common';

function ProfileBtn({loading, user}: {loading: boolean, user: User | null}) {
  const router = useRouter();

  return (
    <div
      className="border border-primary rounded-full p-2 cursor-pointer group hover:bg-primary transition-colors"
    >
      {loading ? (
        <Loader />
      ) : user ? (
        <div className="flex items-center gap-2" onClick={() => router.push('/profile')}>
          <FaRegUser className="text-primary group-hover:text-white text-sm md:text-base" />
          <span className="capitalize text-sm md:text-base group-hover:text-white font-medium">
            {user.username}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2" onClick={() => router.push('/auth/login')}>
          <RiLoginCircleLine className="text-primary group-hover:text-white text-sm md:text-base" />
          <span className="capitalize text-sm md:text-base group-hover:text-white font-medium">Login</span>
        </div>
      )}
    </div>
  );
}

export default ProfileBtn;