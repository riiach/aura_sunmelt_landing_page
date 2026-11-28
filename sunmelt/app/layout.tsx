import type { Metadata } from "next";
import { Fraunces, Poppins } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Sunmelt",
  description: "Soda that feels like sunmelt",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function () {
            var navigation = performance.getEntriesByType("navigation")[0];
            var reload = navigation ? navigation.type === "reload" :
              performance.navigation && performance.navigation.type === 1;
            if (!reload) return;
            if ("scrollRestoration" in history) history.scrollRestoration = "manual";
            if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
            window.scrollTo(0, 0);
          })();
        ` }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
