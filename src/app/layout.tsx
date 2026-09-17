import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import SignInButton from "./components/SignInButton";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bora.local"),
  title: {
    default: "Triage — Crack Interview Questions",
    template: "%s | Triage",
  },
  description:
    "Snap or upload your interview question. Triage breaks it down into core concepts, traps to avoid, and a step-by-step attack plan.",
  applicationName: "Triage",
  authors: [{ name: "Bora" }],
  keywords: ["triage", "interview questions", "exam helper", "AI study tool"],
  openGraph: {
    title: "Triage — Crack Interview Questions",
    description:
      "Snap or upload your interview question. Triage breaks it down into core concepts, traps to avoid, and a step-by-step attack plan.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Triage — Crack Interview Questions",
    description:
      "Snap or upload your interview question. Triage breaks it down into core concepts, traps to avoid, and a step-by-step attack plan.",
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
      <body className={inter.className}>
        <header
          style={{
            padding: 12,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1 style={{ margin: 0 }}>Triage</h1>
            </div>
            <div>
              <SignInButton />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
