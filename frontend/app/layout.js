import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./context/AppContext";
import BloubTransition from "./components/BloubTransition";
import NavigationInterceptor from "./components/NavigationInterceptor";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata = {
  title: "Iva — Your Government Scheme & Scholarship Agent",
  description:
    "Stop chasing scholarships. Iva's AI agent discovers government schemes you qualify for, prepares your application, and keeps tracking — so you don't have to.",
  keywords: ["government schemes", "scholarships", "student aid", "application agent", "India scholarships"],
   icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "Iva — Your Government Scheme & Scholarship Agent",
    description: "Stop chasing scholarships. Let your agent handle the paperwork.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AppProvider>
          <NavigationInterceptor />
          <BloubTransition />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

