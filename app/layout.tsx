import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lyric Kinetics — kinetic typography lyric videos in your browser',
  description:
    'Paste a Spotify or YouTube link, drop in the audio, and export a cinematic, beat-reactive kinetic typography lyric video — rendered and encoded entirely client-side.',
};

export const viewport: Viewport = {
  themeColor: '#04050c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
