'use client';

import { memo, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Check, Copy } from 'lucide-react';

function CodeBlock({ language, children }: { language: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = String(children ?? '').replace(/\n$/, '');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-navy/70 bg-[#0d2140] shadow-soft">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-blue-300/80">{language || 'code'}</span>
        <button onClick={copy} className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-blue-200/80 transition hover:bg-white/5 hover:text-white" aria-label="Copy code">
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed"><code className={`hljs language-${language}`}>{children}</code></pre>
    </div>
  );
}

const MessageMarkdown = memo(function MessageMarkdown({ content }: { content: string }) {
  return (
    <div className="prose-francis max-w-none text-[15px] leading-7 text-ink/95">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={{
          code(props) {
            const { className, children, ...rest } = props;
            const match = /language-(\w+)/.exec(className ?? '');
            const isBlock = String(children).includes('\n') || Boolean(match);
            if (isBlock) {
              return <CodeBlock language={match?.[1] ?? ''}>{children}</CodeBlock>;
            }
            return (
              <code className="rounded-md border border-navy/10 bg-mist px-1.5 py-0.5 font-mono text-[0.82em] font-medium text-navy" {...rest}>
                {children}
              </code>
            );
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noreferrer noopener" className="font-medium text-electric underline decoration-electric/35 underline-offset-2 transition hover:text-navy">
                {children}
              </a>
            );
          },
          h1: ({ children }) => <h1 className="mb-3 mt-6 text-display text-2xl font-bold text-navy">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-6 text-display text-xl font-bold text-navy">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-5 text-display text-lg font-bold text-navy">{children}</h3>,
          p: ({ children }) => <p className="my-3">{children}</p>,
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-6 marker:text-electric">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-6 marker:font-mono marker:text-electric">{children}</ol>,
          blockquote: ({ children }) => <blockquote className="my-4 border-l-[3px] border-electric/50 bg-mist/50 py-2 pl-4 pr-3 text-ink/80">{children}</blockquote>,
          table: ({ children }) => <div className="my-4 overflow-x-auto rounded-xl border border-navy/10"><table className="w-full border-collapse text-sm">{children}</table></div>,
          th: ({ children }) => <th className="border-b border-navy/10 bg-soft px-3 py-2 text-left font-display text-xs uppercase tracking-wider text-navy">{children}</th>,
          td: ({ children }) => <td className="border-b border-navy/5 px-3 py-2 align-top">{children}</td>,
          hr: () => <hr className="my-6 border-navy/10" />,
          strong: ({ children }) => <strong className="font-semibold text-navy">{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

export default MessageMarkdown;
