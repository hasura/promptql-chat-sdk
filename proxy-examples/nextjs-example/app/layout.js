export const metadata = { title: 'PromptQL Minimal', description: 'Minimal proxy example' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 20 }}>{children}</body>
    </html>
  );
}

