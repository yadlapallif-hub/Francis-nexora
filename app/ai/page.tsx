import type { Metadata } from 'next';
import FrancisChat from '@/components/chat/ChatApp';

export const metadata: Metadata = {
  title: 'FRANCIS AI — Your Intelligent Digital Assistant',
  description:
    'FRANCIS AI answers anything — general knowledge, programming, research with live web citations, writing, learning — and everything about Yadlapalli Francis, NEXORA and this platform. Streaming answers, document analysis (PDF, TXT, DOCX), conversation memory.',
  openGraph: {
    title: 'FRANCIS AI — More than a portfolio. Your intelligent digital assistant.',
    description: 'A general-purpose AI inside the FRANCIS platform: research mode with citations, programming mentor, portfolio guide.',
  },
};

export default function FrancisAiPage() {
  return <FrancisChat />;
}
