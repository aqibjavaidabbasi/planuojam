import "./globals.css";
import dynamic from "next/dynamic";
import { EventTypesProvider } from "@/context/EventTypesContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import ReduxProvider from "@/store/provider";
import { ParentCategoriesProvider } from "@/context/ParentCategoriesContext";
import { Toaster } from "react-hot-toast";

const GoogleMapsWrapper = dynamic(() => import("./GoogleMapsWrapper"));

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="max-w-screen">
        <ReduxProvider>
          <GoogleMapsWrapper>
            <ParentCategoriesProvider>
              <SiteSettingsProvider>
                <EventTypesProvider>
                  <div>{children}</div>
                </EventTypesProvider>
              </SiteSettingsProvider>
            </ParentCategoriesProvider>
          </GoogleMapsWrapper>
        </ReduxProvider>
        <Toaster
           position="top-center"
           reverseOrder={false}
        />
      </body>
    </html>
  );
}
