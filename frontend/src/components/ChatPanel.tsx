import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import clsx from 'clsx';
import { useUIStore } from '@/store/ui.store';
import { ChatService } from '@/services/misc.service';
import type { ChatMessage } from '@/types';

export function ChatPanel() {
  const { chatOpen, setChat } = useUIStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatOpen) return;
    ChatService.history().then(setMessages).catch(() => {});
  }, [chatOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatOpen]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setText('');
    try {
      const { user, bot } = await ChatService.send(t);
      setMessages((m) => [...m, user, bot]);
    } finally {
      setSending(false);
    }
  };

  const sendSelection = async (selectionText: string) => {
    if (sending) return;
    setSending(true);
    try {
      const { user, bot } = await ChatService.send(selectionText);
      setMessages((m) => [...m, user, bot]);
    } finally {
      setSending(false);
    }
  };

  if (!chatOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-elevated flex flex-col z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-brand-600 grid place-items-center text-white">
          <Sparkles size={13} />
        </div>
        <div className="leading-tight flex-1">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">ServiceGPT Assistant</div>
          <div className="text-2xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
          </div>
        </div>
        <button onClick={() => setChat(false)} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition">
          <X size={14} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-950">
        {messages.length === 0 && (
          <div className="text-center text-xs text-slate-500 mt-8 px-4 leading-relaxed">
            <Sparkles size={20} className="mx-auto text-slate-300 mb-2" />
            Ask about incidents, password resets, VPN, the service catalog, or anything else.
          </div>
        )}
        {messages.map((m) => {
          const isUser = m.role === 'user';
          const botBubbleClass = clsx(
            'max-w-[80%] px-3 py-2 text-sm leading-relaxed',
            isUser
              ? 'bg-brand-600 text-white rounded-2xl rounded-br-sm'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-sm border border-slate-200 dark:border-slate-700'
          );

          // Detect instance-selection messages from the assistant
          if (!isUser && typeof m.text === 'string' && m.text.includes('I can open this incident in one of these instances:')) {
            // Extract numbered lines
            const lines = m.text.split('\n');
            const intro = lines[0] || '';
            const numbered = lines.filter((l) => /^\s*\d+\./.test(l));
            return (
              <div key={m.id} className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
                <div className={botBubbleClass}>
                  <div className="font-medium mb-2">{intro}</div>
                  <div className="space-y-2">
                    {numbered.map((line, idx) => {
                      // line like '1. Name (id)'
                      const text = line.replace(/^\s*\d+\.\s*/, '').trim();
                      return (
                        <button
                          key={idx}
                          onClick={() => sendSelection(String(idx + 1))}
                          className="w-full text-left px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md hover:scale-[1.01] transition transform flex items-center justify-between"
                        >
                          <span className="text-sm text-slate-800 dark:text-slate-100">{text}</span>
                          <span className="text-2xs text-slate-500">Select</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Reply with the number of the instance you want to use, or click one above.</div>
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
              <div className={botBubbleClass}>{m.text}</div>
            </div>
          );
        })}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-slate-500 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
        <input
          className="input !py-1.5"
          value={text}
          placeholder="Ask anything…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} className="btn-primary !p-2 shrink-0" disabled={sending || !text.trim()} aria-label="Send">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
