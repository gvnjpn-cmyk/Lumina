import './globals.css';
export const metadata = { title: 'Lumina', description: 'Music player' };
export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ height:'100%' }}>
      <body style={{ height:'100%' }}>{children}</body>
    </html>
  );
}
