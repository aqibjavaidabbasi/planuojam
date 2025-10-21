'use client';
import React, { useEffect, useState } from 'react';
import { FaRegUser } from 'react-icons/fa';
import { RiLoginCircleLine } from 'react-icons/ri';
import Loader from '../custom/Loader';
import { User } from '@/types/common';
import { useTranslations } from 'use-intl';
import { useRouter } from '@/i18n/navigation';
import { countUnread } from '@/services/messages';

function ProfileBtn({loading, user}: {loading: boolean, user: User | null}) {
  const router = useRouter();
  const t=useTranslations("Login")
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (user?.id) {
          const total = await countUnread(user.id);
          if (mounted) setHasUnread(total > 0);
        } else {
          if (mounted) setHasUnread(false);
        }
      } catch {
        // silently ignore
      }
    })();
    return () => { mounted = false; };
  }, [user?.id]);

  return (
    <div
      className="relative border border-primary rounded-full cursor-pointer group hover:bg-primary transition-colors"
    >
      {user && hasUnread && (
        <span
          aria-label="unread messages"
          className="absolute -top-1 -left-1 h-2 w-2 bg-red-500 rounded-full"
        />
      )}
      {loading ? (
        <Loader />
      ) : user ? (
        <div className="flex items-center gap-1 p-1 md:p-2" onClick={() => router.push('/profile?tab=profile')}>
          <FaRegUser className="text-primary group-hover:text-white text-sm md:text-base" />
          <span className="capitalize text-sm md:text-base whitespace-nowrap group-hover:text-white font-medium">
            {user.username.split(' ')[0]}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1 p-1 md:p-2" onClick={() => router.push('/auth/login')}>
          <RiLoginCircleLine className="text-primary group-hover:text-white text-sm md:text-base" />
          <span className="capitalize text-sm md:text-base group-hover:text-white font-medium">{t('login')}</span>
        </div>
      )}
    </div>
  );
}

export default ProfileBtn;