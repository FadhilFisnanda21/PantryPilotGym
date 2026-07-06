import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PantryPilot AI Nutrition Coach",
  description: "Turn fridge ingredients into nutrition-focused meals tailored to your goals."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t);})();` }} />
      </body>
    </html>
  );
}
