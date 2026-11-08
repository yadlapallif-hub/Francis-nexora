import type { Metadata } from 'next';
import ChatWorkspace from '@/components/chat/ChatWorkspace';

export const metadata: Metadata = {
  title: 'FRANCIS AI — Ask me anything',
  description:
    'FRANCIS AI is the general-purpose intelligent assistant of the FRANCIS platform: programming, computer science, research with live web sources, document analysis, writing, learning and everything in between.',
  robots: { index: true, follow: true },
};

export default function FrancisAiPage() {
  return <ChatWorkspace />;
}
