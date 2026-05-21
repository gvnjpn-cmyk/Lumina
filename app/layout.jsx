import './globals.css';

export const metadata = {
  title: 'Lumina',
  description: 'Music player with synced lyrics',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ height:'100%' }}>
      <head>
        {/* PWA essentials */}
        <link rel="manifest" href="/manifest.json"/>
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"/>
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png"/>
        {/* iOS PWA - ini yang bikin icon muncul di homescreen iOS & Android Chrome */}
        <link rel="apple-touch-icon" href="/icon-192.png"/>
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Lumina"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="theme-color" content="#000000"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
      </head>
      <body style={{ height:'100%' }}>{children}</body>
    </html>
  );
}
