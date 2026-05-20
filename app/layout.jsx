import './globals.css';
export const metadata = {
  title: 'Lumina',
  description: 'Music player with synced lyrics',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Lumina' },
  viewport: { width: 'device-width', initialScale: 1, viewportFit: 'cover' },
};
export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ height:'100%' }}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="theme-color" content="#000000"/>
      </head>
      <body style={{ height:'100%' }}>{children}</body>
    </html>
  );
}
