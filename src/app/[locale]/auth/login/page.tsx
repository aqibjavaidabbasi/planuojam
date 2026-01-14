import React from "react";
import ClientLoginWrapper from "./ClientLoginWrapper";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth.Login' });
  
  return {
    title: t('title'),
    description: t('subtitle'),
    robots: {
      index: false,
      follow: false,
    },
  };
}

function LoginPage() {
  return (
    <div className="flex items-center justify-center py-5 w-screen">
        <ClientLoginWrapper />
    </div>
  );
}

export default LoginPage;
