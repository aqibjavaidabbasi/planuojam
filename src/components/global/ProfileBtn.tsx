'use client';
import React, { useEffect, useState } from 'react';
import { FaRegUser } from 'react-icons/fa';
import { RiLoginCircleLine } from 'react-icons/ri';
import Loader from '../custom/Loader';
import { User } from '@/types/userTypes';
import { useTranslations } from 'use-intl';
import { useRouter } from '@/i18n/navigation';
import { getUnreadConversationCount } from '@/services/messages';

function ProfileBtn({loading, user}: {loading: boolean, user: User | null}) {
  const router = useRouter();
  const t=useTranslations("Login")
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let mounted = true;
    const compute = async () => {
      try {
        if (user?.id) {
          const count = await getUnreadConversationCount(user.id);
          if (mounted) setHasUnread(count > 0);
        } else {
          if (mounted) setHasUnread(false);
        }
      } catch {
        // silently ignore
      }
    };
    compute();
    const onFocus = () => { compute(); };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onFocus);
    }
    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onFocus);
      }
    };
  }, [user?.id]);

  // Update immediately when Messages component emits unread changes
  useEffect(() => {
    const onUnreadChanged = (e: Event) => {
      try {
        const total = (e as CustomEvent).detail?.total;
        setHasUnread(Number(total) > 0);
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('messages:unread-changed', onUnreadChanged as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('messages:unread-changed', onUnreadChanged as EventListener);
      }
    };
  }, []);

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