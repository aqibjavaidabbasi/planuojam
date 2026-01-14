import EmailConfirmationPageClient from "./EmailConfirmationPageClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth.EmailConfirmation' });
  
  return {
    title: t('title'),
    description: t('subtitle', { default: 'Confirm your email address to activate your account' }),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function EmailConfirmationPage() {
  return <EmailConfirmationPageClient />;
}
