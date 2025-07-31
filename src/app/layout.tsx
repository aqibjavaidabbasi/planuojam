import "./globals.css";
import Header from "@/components/global/header";
import Footer from "@/components/global/footer";
import { fetchFooter, fetchHeader } from "@/services/pagesApi";
import dynamic from "next/dynamic";
import { EventTypesProvider } from "@/context/EventTypesContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";

const GoogleMapsWrapper = dynamic(() => import('./GoogleMapsWrapper'))

export default async function RootLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {

  const headerData = await fetchHeader();
  const footerData = await fetchFooter();

  return (
    <html lang="en">
      <body className="max-w-screen">
        <GoogleMapsWrapper>
          <SiteSettingsProvider>
            <EventTypesProvider>
              <Header headerData={headerData} />
              <main>{children}</main>
              <Footer footerData={footerData} />
            </EventTypesProvider>
          </SiteSettingsProvider>
        </GoogleMapsWrapper>
      </body>
    </html>
  );
}
