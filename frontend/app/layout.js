import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata = {
  title: "Hazela — Your Government Scheme & Scholarship Agent",
  description:
    "Stop chasing scholarships. Hazela's AI agent discovers government schemes you qualify for, prepares your application, and keeps tracking — so you don't have to.",
  keywords: ["government schemes", "scholarships", "student aid", "application agent", "India scholarships"],
  openGraph: {
    title: "Hazela — Your Government Scheme & Scholarship Agent",
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
      <body>{children}</body>
    </html>
  );
}
