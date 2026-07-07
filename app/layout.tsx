import type { Metadata } from "next";
import { Cinzel, EB_Garamond, Jim_Nightshade } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const jimNightshade = Jim_Nightshade({
  variable: "--font-jim-nightshade",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Tom Riddle's Diary | Speak to the Memory",
  description: "An interactive, atmospheric web simulation of Tom Riddle's diary from Harry Potter. Type or draw on the aged parchment pages, see the ink absorb, and converse with the dark memory within.",
  keywords: ["Tom Riddle Diary", "Harry Potter", "Chamber of Secrets", "Lord Voldemort", "Horcrux", "Interactive Diary", "Voldemort Diary Online"],
  openGraph: {
    title: "Tom Riddle's Diary | Speak to the Memory",
    description: "An interactive, atmospheric simulation of Tom Riddle's diary. Write or draw your secrets on the pages, see the ink bleed, and wait for the memory to answer.",
    type: "website",
    locale: "en_US",
    siteName: "Tom Riddle's Diary",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tom Riddle's Diary | Speak to the Memory",
    description: "Write or draw your secrets on the pages, watch the ink absorb, and wait for the dark memory of Voldemort to write back.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${ebGaramond.variable} ${jimNightshade.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-amber-50 selection:bg-amber-900/30">
        {children}
      </body>
    </html>
  );
}

