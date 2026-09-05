import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'VerifyAI — Media Verification & Forensic Intelligence Platform',
  description:
    'Production-grade multi-modal media verification platform with forensic evidence analysis, uncertainty calibration, and source provenance.',
  openGraph: {
    title: 'VerifyAI — Media Verification & Forensic Intelligence Platform',
    description:
      'Analyze images, audio, video, and URLs for AI generation, deepfake manipulation, and forensic anomalies.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VerifyAI — Media Verification & Forensic Intelligence Platform',
    description:
      'Analyze images, audio, video, and URLs for AI generation, deepfake manipulation, and forensic anomalies.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#050505] text-[#e0e0e0] font-sans antialiased selection:bg-orange-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
