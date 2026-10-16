import type { Metadata } from 'next';
import { Inter, Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

// La CSP usa un nonce por peticion, por eso ninguna pagina puede prerenderizarse estaticamente.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Secure CRM — Laboratorio OWASP · UVG',
  description:
    'CRM de práctica para el laboratorio de Desarrollo de Software Seguro (OWASP ZAP, Burp Suite, CVSS). Universidad del Valle de Guatemala.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${display.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
