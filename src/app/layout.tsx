import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CUBIQ Attendance Management System',
  description: 'CUBIQ Interior & Modular - GPS Geofenced Attendance Management System',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('cubic_theme');
                if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"
          integrity="sha512-Zcn6HvY/4ddh052033010b93ca35251648a80415309605330833075252062534"
          crossOrigin=""
        />
      </head>
      <body className="antialiased text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 selection:bg-teal-500 selection:text-white transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
