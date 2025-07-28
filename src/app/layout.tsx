import "./globals.css";
import Header from "@/components/global/header";
import Footer from "@/components/global/footer";
import { fetchSiteSettings } from "@/services/siteSettings";
import { fetchFooter, fetchHeader } from "@/services/pagesApi";
import { Suspense } from "react";
import Loader from "@/components/ui/Loader";
import dynamic from "next/dynamic";
import { EventTypesProvider } from "@/context/EventTypesContext";

const GoogleMapsWrapper = dynamic(() => import('./GoogleMapsWrapper'))

export default async function RootLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {

  const siteSettingsData = await fetchSiteSettings();
  const headerData = await fetchHeader();
  const footerData = await fetchFooter();

  return (
    <html lang="en">
      <body className="max-w-screen">
        <GoogleMapsWrapper>
          <EventTypesProvider>
            <Header logo={siteSettingsData.siteLogo} headerData={headerData} />
            <Suspense fallback={<Loader />} >
              <main>{children}</main>
            </Suspense>
            <Footer footerData={footerData} />
          </EventTypesProvider>
        </GoogleMapsWrapper>
      </body>
    </html>
  );
}
