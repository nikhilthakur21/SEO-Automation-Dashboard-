import localFont from 'next/font/local';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const plex = localFont({
  src: [
    { path: '../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2', weight: '400' },
    { path: '../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2', weight: '500' },
    { path: '../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2', weight: '600' },
  ],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: { default: 'Edgelink SEO', template: '%s | Edgelink SEO' },
  description: 'Automated monthly SEO audits for local businesses.',
};

export const viewport = {
  themeColor: '#F5F6F8',
  colorScheme: 'light',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${plex.variable} font-sans`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
