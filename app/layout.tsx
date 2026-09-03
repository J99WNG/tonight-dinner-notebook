import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://tonight-dinner-notebook.j99wng.chatgpt.site'),
  openGraph: {
    title: 'Tonight · 新志興',
    description: 'A little order in the dinner rush.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tonight · 新志興',
    description: 'A little order in the dinner rush.',
    images: ['/og.png'],
  },
  title: 'Tonight · 新志興',
  description:
    'A little order in the dinner rush. Tables, walk-ins and bookings for 新志興至尊燒鵝大王.',
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
