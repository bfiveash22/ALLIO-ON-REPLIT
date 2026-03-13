import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2, Sparkles, Calendar, Pill, Activity, Beaker, Copy, Check, Printer, Share2 } from 'lucide-react';

interface Peptide {
  id: string;
  name: string;
  discoveryYear: string;
  era: string;
  description: string;
  personaTrait: string;
  therapeuticUses: string[];
  dosageInfo: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function PeptideConsolePage() {
  const defaultPeptide: Peptide = {
    id: 'console',
    name: 'FF Intelligent Console',
    discoveryYear: '2024',
    era: 'Modern',
    description: 'AI-powered peptide guidance and protocol recommendations',
    personaTrait: 'Clinical Intelligence',
    therapeuticUses: ['Protocol Design', 'Stacking Advice', 'Mechanism Education'],
    dosageInfo: 'Ask me for specific dosing protocols'
  };
  const [peptide, setPeptide] = useState<Peptide>(defaultPeptide);
  const [catalog, setCatalog] = useState<Peptide[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [shareMenuIndex, setShareMenuIndex] = useState<number | null>(null);
  const [canShare, setCanShare] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetch('/api/peptide-catalog')
      .then(r => r.json())
      .then((data: Peptide[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalog(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Check if Web Share API is available
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  useEffect(() => {
    // Scroll within container only - prevents parent iframe scroll
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input?.trim() || streaming) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...(prev || []), { role: 'user', content: userMessage }]);
    setStreaming(true);

    try {
      const res = await fetch('/api/peptide-console', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          peptideId: peptide?.id,
          conversationId
        })
      });

      if (!res.ok) throw new Error('Failed to send message');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let partialRead = '';

      setMessages(prev => [...(prev || []), { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines.pop() || '';

        for (const line of lines) {
          if (line?.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const data = JSON.parse(jsonStr);
              if (data?.done) {
                setConversationId(data?.conversationId);
              } else if (data?.content) {
                assistantMessage += data.content;
                setMessages(prev => {
                  const updated = [...(prev || [])];
                  if (updated?.length > 0) {
                    updated[updated.length - 1] = { role: 'assistant', content: assistantMessage };
                  }
                  return updated;
                });
              }
            } catch (e) { /* skip */ }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...(prev || []), { role: 'assistant', content: 'I apologize, but I encountered an error. Please try again.' }]);
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for mobile browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      // Final fallback - textarea method
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } catch (e) {
        console.error('Failed to copy:', e);
      }
    }
  };

  const shareToApps = async (text: string) => {
    const shareData = {
      title: `${peptide?.name} - Peptide Consultation`,
      text: text
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled - that's fine
      }
    }
    setShareMenuIndex(null);
  };

  const toggleShareMenu = (index: number) => {
    setShareMenuIndex(shareMenuIndex === index ? null : index);
  };

  const printConversation = () => {
    if (messages.length === 0) {
      alert('No conversation to print yet!');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the conversation.');
      return;
    }

    const currentDate = new Date().toLocaleString();
    const conversationHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${peptide.name} Consultation - Forgotten Formula</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.6;
              color: #333;
            }
            .header {
              border-bottom: 3px solid #0891b2;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #0891b2;
              font-size: 28px;
              margin-bottom: 10px;
            }
            .header .meta {
              color: #666;
              font-size: 14px;
              margin-top: 5px;
            }
            .peptide-info {
              background: #f1f5f9;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .peptide-info h2 {
              color: #0891b2;
              font-size: 18px;
              margin-bottom: 10px;
            }
            .peptide-info p {
              margin-bottom: 10px;
            }
            .message {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .message-header {
              font-weight: 600;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .user-message .message-header {
              color: #7c3aed;
            }
            .assistant-message .message-header {
              color: #0891b2;
            }
            .message-content {
              padding: 15px;
              border-radius: 8px;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .user-message .message-content {
              background: #ede9fe;
              border-left: 4px solid #7c3aed;
            }
            .assistant-message .message-content {
              background: #ecfeff;
              border-left: 4px solid #0891b2;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body {
                padding: 20px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🧬 ${peptide.name} Peptide Consultation</h1>
            <div class="meta">
              <div><strong>Member Consultation Report</strong></div>
              <div>Forgotten Formula Private Members Association</div>
              <div>Date: ${currentDate}</div>
              <div>Peptide Era: ${peptide.era} | Discovery: ${peptide.discoveryYear}</div>
            </div>
          </div>

          <div class="peptide-info">
            <h2>About ${peptide.name}</h2>
            <p><strong>Profile:</strong> ${peptide.personaTrait}</p>
            <p><strong>Description:</strong> ${peptide.description}</p>
            <p><strong>Therapeutic Uses:</strong> ${peptide.therapeuticUses.join(', ')}</p>
            <p><strong>Dosage Information:</strong> ${peptide.dosageInfo}</p>
          </div>

          <div class="conversation">
            ${messages.map((msg, i) => `
              <div class="message ${msg.role}-message">
                <div class="message-header">
                  ${msg.role === 'user' ? '👤 Member' : `🧬 ${peptide.name}`}
                </div>
                <div class="message-content">${msg.content}</div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p><strong>DISCLAIMER:</strong> This consultation is for informational purposes only and is not medical advice.</p>
            <p>Forgotten Formula Private Members Association</p>
            <p>© ${new Date().getFullYear()} - Member Consultation Record</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(conversationHTML);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="glass border-b border-slate-800 flex-shrink-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setLocation('/resources')}
            className="p-2 rounded-lg hover:bg-slate-800 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Beaker className="w-5 h-5 text-cyan-400" />
              {peptide?.name}
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> {peptide?.personaTrait} • <Calendar className="w-3 h-3" /> {peptide?.discoveryYear}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={printConversation}
              className="p-2 rounded-lg hover:bg-slate-800 transition flex items-center gap-2 text-sm"
              title="Print Consultation"
            >
              <Printer className="w-5 h-5 text-cyan-400" />
              <span className="hidden sm:inline">Print</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0">
        {/* Info Panel with Catalog */}
        {messages?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border-b border-slate-800 overflow-y-auto max-h-[60vh]"
          >
            <div className="glass rounded-xl p-6 mb-4">
              <p className="text-slate-300 mb-6">{peptide?.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Pill className="w-5 h-5 text-cyan-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Therapeutic Uses</h3>
                    <ul className="text-sm text-slate-400 space-y-1">
                      {peptide?.therapeuticUses?.map((use, i) => (
                        <li key={i}>• {use}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Dosage Info</h3>
                    <p className="text-sm text-slate-400">{peptide?.dosageInfo}</p>
                  </div>
                </div>
              </div>
              <p className="text-center text-cyan-400 mt-6 text-sm">
                Start a conversation with {peptide?.name} below!
              </p>
            </div>

            {catalog.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Peptide Reference Catalog</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {catalog.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPeptide(p)}
                      className={`text-left glass rounded-lg p-3 hover:border-cyan-500/50 border transition ${
                        peptide.id === p.id ? 'border-cyan-500' : 'border-transparent'
                      }`}
                    >
                      <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                      <div className="text-xs text-cyan-400 mt-0.5">{p.personaTrait}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{p.era}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide overscroll-contain">
          <AnimatePresence>
            {messages?.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg?.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start gap-2 max-w-[85%]">
                  <div
                    className={`flex-1 rounded-2xl px-4 py-3 ${
                      msg?.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                        : 'glass text-slate-200'
                    }`}
                  >
                    {msg?.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1 text-xs text-cyan-400">
                        <Beaker className="w-3 h-3" />
                        {peptide?.name}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg?.content || (streaming && msg?.role === 'assistant' ? '...' : '')}</p>
                  </div>
                  {msg?.role === 'assistant' && msg?.content && (
                    <div className="relative flex flex-col gap-1 flex-shrink-0 mt-1">
                      <button
                        onClick={() => toggleShareMenu(i)}
                        className="p-2 rounded-lg glass hover:bg-slate-700 transition"
                        title="Share options"
                      >
                        <Share2 className="w-4 h-4 text-slate-400" />
                      </button>
                      {/* Share Menu */}
                      {shareMenuIndex === i && (
                        <div className="absolute right-0 top-10 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl min-w-[160px] py-1">
                          <button
                            onClick={() => {
                              copyToClipboard(msg.content, i);
                              setShareMenuIndex(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3"
                          >
                            <Copy className="w-4 h-4" />
                            Copy to Clipboard
                          </button>
                          {canShare && (
                            <button
                              onClick={() => shareToApps(msg.content)}
                              className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-3"
                            >
                              <Share2 className="w-4 h-4" />
                              Share to Apps
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Always pinned to bottom with safe area padding for notched devices */}
        <div className="flex-shrink-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-800 bg-slate-900/95">
          <div className="max-w-4xl mx-auto flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${peptide?.name} anything...`}
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-cyan-500 focus:outline-none transition resize-none text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={!input?.trim() || streaming}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {streaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
