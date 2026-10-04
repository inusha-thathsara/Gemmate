import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gemmate.vercel.app"),
  title: {
    default: "Gemmate — Open-Source Voice Companion for Cracking Exam Traps",
    template: "%s | Gemmate",
  },
  description:
    "An open-source exam question triage companion powered by Google Gemma open-weight AI and ElevenLabs Socratic voice coaching.",
  applicationName: "Gemmate",
  authors: [{ name: "Inusha Gunasekara" }],
  keywords: [
    "Gemmate",
    "Gemma",
    "ElevenLabs",
    "Hacktoberfest 2026",
    "exam triage",
    "Socratic voice tutor",
    "open-source AI",
  ],
  openGraph: {
    title: "Gemmate — Open-Source Voice Companion for Cracking Exam Traps",
    description:
      "An open-source exam question triage companion powered by Google Gemma open-weight AI and ElevenLabs Socratic voice coaching.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gemmate — Open-Source Voice Companion for Cracking Exam Traps",
    description:
      "An open-source exam question triage companion powered by Google Gemma open-weight AI and ElevenLabs Socratic voice coaching.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.png", type: "image/png", sizes: "64x64" },
    ],
    apple: [{ url: "/icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {GA_ID ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','${GA_ID}');`,
              }}
            />
          </>
        ) : null}
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
