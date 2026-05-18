import './globals.css';

export const metadata = {
  title: 'Lumina — Music',
  description: 'Liquid glass music player with synced lyrics',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {/* Background orbs */}
        <div className="orb w-[600px] h-[600px] bg-white top-[-200px] left-[-200px]" />
        <div className="orb w-[500px] h-[500px] bg-white bottom-[-150px] right-[-150px]" style={{ opacity: 0.07 }} />
        <div className="orb w-[300px] h-[300px] bg-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ opacity: 0.04 }} />
        {children}
      </body>
    </html>
  );
}
