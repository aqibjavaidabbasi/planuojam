import "./globals.css";
import dynamic from "next/dynamic";
import { EventTypesProvider } from "@/context/EventTypesContext";
import { CitiesProvider } from "@/context/CitiesContext";
import { StatesProvider } from "@/context/StatesContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import ReduxProvider from "@/store/provider";
import { ParentCategoriesProvider } from "@/context/ParentCategoriesContext";
import { Toaster } from "react-hot-toast";

const MapboxWrapper = dynamic(() => import("./MapboxWrapper"));

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="max-w-screen">
        <ReduxProvider>
          <MapboxWrapper>
            <ParentCategoriesProvider>
              <SiteSettingsProvider>
                <EventTypesProvider>
                  <StatesProvider>
                    <CitiesProvider>
                      <div>{children}</div>
                    </CitiesProvider>
                  </StatesProvider>
                </EventTypesProvider>
              </SiteSettingsProvider>
            </ParentCategoriesProvider>
          </MapboxWrapper>
        </ReduxProvider>
        <Toaster
           position="top-center"
           reverseOrder={false}
        />
      </body>
    </html>
  );
}
