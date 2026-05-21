import './globals.css';

export const metadata = {
  title: 'Lumina',
  description: 'Music player with synced lyrics',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ height:'100%' }}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Lumina"/>
        <meta name="theme-color" content="#000000"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        {/* Prevent screen sleep hint */}
        <meta name="screen-orientation" content="portrait"/>
      </head>
      <body style={{ height:'100%' }}>{children}</body>
    </html>
  );
}
