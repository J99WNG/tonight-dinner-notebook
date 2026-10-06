import type { Metadata } from 'next';
import './globals.css';

const publicOrigin = 'https://j99wng.github.io/tonight-dinner-notebook';

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin),
  openGraph: {
    title: 'Tonight · 新志興',
    description: 'A little order in the dinner rush.',
    images: [`${publicOrigin}/og.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tonight · 新志興',
    description: 'A little order in the dinner rush.',
    images: [`${publicOrigin}/og.png`],
  },
  title: 'Tonight · 新志興',
  description:
    'A little order in the dinner rush. Tables, walk-ins and bookings for 新志興至尊燒鵝大王.',

  // Site icons are separate from the large OG artwork. The SVG responds to the
  // OS theme; PNG pairs cover browsers that support media-aware icon links; ICO
  // and Apple touch icons remain high-contrast fallbacks for older clients.
  icons: {
    icon: [
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "256x256", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "512x512", type: "image/png" },
    ],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
