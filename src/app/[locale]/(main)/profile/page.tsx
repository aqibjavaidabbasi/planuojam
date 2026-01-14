import ProfilePageClient from "./ProfilePageClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Profile' });
  
  return {
    title: t('ProfileTab.title'),
    description: t('ProfileTab.subtitle'),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ProfilePage() {
  return <ProfilePageClient />;
}
