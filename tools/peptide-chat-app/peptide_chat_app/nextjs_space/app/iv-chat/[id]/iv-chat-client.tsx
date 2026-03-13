'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2, Sparkles, Clock, Syringe, Activity, AlertTriangle, Copy, Check, Printer, Share2, Droplets, Shield, Pill } from 'lucide-react';

interface IVTherapy {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits: string[];
  dosageRange: string;
  dilution: string;
  infusionTime: string;
  frequency: string;
  monitoring: string;
  precautions: string;
  adjuncts: string;
  notes: string;
  personaTrait: string;
  phasesData: {
    initial: string;
    maintenance: string;
    longevity: string;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function IVChatClient({ ivTherapy }: { ivTherapy: IVTherapy }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [shareMenuIndex, setShareMenuIndex] = useState<number | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<'overview' | 'protocol' | 'safety'>('overview');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  useEffect(() => {
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
      const res = await fetch('/api/iv-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          ivTherapyId: ivTherapy?.id
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
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed?.content) {
                assistantMessage += parsed.content;
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
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareToApps = async (text: string) => {
    const shareData = {
      title: `${ivTherapy?.name} - IV Therapy Consultation`,
      text: text
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) { /* User cancelled */ }
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
          <title>${ivTherapy.name} IV Consultation - Forgotten Formula</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #333; }
            .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #10b981; font-size: 28px; margin-bottom: 10px; }
            .header .meta { color: #666; font-size: 14px; margin-top: 5px; }
            .iv-info { background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #86efac; }
            .iv-info h2 { color: #10b981; font-size: 18px; margin-bottom: 10px; }
            .iv-info p { margin-bottom: 10px; }
            .message { margin-bottom: 25px; page-break-inside: avoid; }
            .message-header { font-weight: 600; margin-bottom: 8px; font-size: 14px; }
            .user-message .message-header { color: #7c3aed; }
            .assistant-message .message-header { color: #10b981; }
            .message-content { padding: 15px; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word; }
            .user-message .message-content { background: #ede9fe; border-left: 4px solid #7c3aed; }
            .assistant-message .message-content { background: #ecfdf5; border-left: 4px solid #10b981; }
            .warning { background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💉 ${ivTherapy.name} IV Consultation</h1>
            <div class="meta">
              <div><strong>Clinical Staff Consultation Report</strong></div>
              <div>Forgotten Formula Private Members Association</div>
              <div>Date: ${currentDate}</div>
              <div>Category: ${ivTherapy.category} | Infusion Time: ${ivTherapy.infusionTime}</div>
            </div>
          </div>

          <div class="warning">
            <strong>⚠️ Clinical Advisory:</strong> ${ivTherapy.precautions}
          </div>

          <div class="iv-info">
            <h2>Protocol Summary</h2>
            <p><strong>Dosage:</strong> ${ivTherapy.dosageRange}</p>
            <p><strong>Dilution:</strong> ${ivTherapy.dilution}</p>
            <p><strong>Monitoring:</strong> ${ivTherapy.monitoring}</p>
            <p><strong>Adjuncts:</strong> ${ivTherapy.adjuncts}</p>
          </div>

          <div class="conversation">
            ${messages.map((msg) => `
              <div class="message ${msg.role}-message">
                <div class="message-header">
                  ${msg.role === 'user' ? '👤 Staff Member' : `💉 ${ivTherapy.name}`}
                </div>
                <div class="message-content">${msg.content}</div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p><strong>DISCLAIMER:</strong> This consultation is for clinical staff education only.</p>
            <p>Forgotten Formula Private Members Association</p>
            <p>© ${new Date().getFullYear()} - Clinical Consultation Record</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(conversationHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="glass border-b border-slate-800 flex-shrink-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg hover:bg-slate-800 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Syringe className="w-5 h-5 text-emerald-400" />
              {ivTherapy?.name}
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> {ivTherapy?.personaTrait} • <Clock className="w-3 h-3" /> {ivTherapy?.infusionTime}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={printConversation}
              className="p-2 rounded-lg hover:bg-slate-800 transition flex items-center gap-2 text-sm"
              title="Print Consultation"
            >
              <Printer className="w-5 h-5 text-emerald-400" />
              <span className="hidden sm:inline">Print</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0">
        {/* Info Panel */}
        {messages?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-b border-slate-800"
          >
            {/* Info Tabs */}
            <div className="flex gap-2 mb-4">
              {(['overview', 'protocol', 'safety'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveInfoTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeInfoTab === tab 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="glass rounded-xl p-5">
              {activeInfoTab === 'overview' && (
                <div>
                  <p className="text-slate-300 mb-4">{ivTherapy?.description}</p>
                  <div className="flex items-start gap-3">
                    <Pill className="w-5 h-5 text-emerald-400 mt-1" />
                    <div>
                      <h3 className="font-semibold text-white mb-2">Benefits</h3>
                      <ul className="text-sm text-slate-400 space-y-1">
                        {ivTherapy?.benefits?.map((benefit, i) => (
                          <li key={i}>• {benefit}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeInfoTab === 'protocol' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Activity className="w-5 h-5 text-emerald-400 mt-1" />
                      <div>
                        <h3 className="font-semibold text-white mb-1">Dosage</h3>
                        <p className="text-sm text-slate-400">{ivTherapy?.dosageRange}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Droplets className="w-5 h-5 text-blue-400 mt-1" />
                      <div>
                        <h3 className="font-semibold text-white mb-1">Dilution</h3>
                        <p className="text-sm text-slate-400">{ivTherapy?.dilution}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">Treatment Phases</h3>
                    <div className="text-sm text-slate-400 space-y-2">
                      <p><span className="text-emerald-400">Initial:</span> {ivTherapy?.phasesData?.initial}</p>
                      <p><span className="text-cyan-400">Maintenance:</span> {ivTherapy?.phasesData?.maintenance}</p>
                      <p><span className="text-purple-400">Longevity:</span> {ivTherapy?.phasesData?.longevity}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeInfoTab === 'safety' && (
                <div className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-amber-400 mb-1">Precautions & Contraindications</h3>
                        <p className="text-sm text-slate-300">{ivTherapy?.precautions}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 mt-1" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">Monitoring Required</h3>
                      <p className="text-sm text-slate-400">{ivTherapy?.monitoring}</p>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">Compatible Adjuncts</h3>
                    <p className="text-sm text-slate-400">{ivTherapy?.adjuncts}</p>
                  </div>
                </div>
              )}

              <p className="text-center text-emerald-400 mt-6 text-sm">
                Ask {ivTherapy?.name} about protocols, preparation, or administration below!
              </p>
            </div>
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
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                        : 'glass text-slate-200'
                    }`}
                  >
                    {msg?.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1 text-xs text-emerald-400">
                        <Syringe className="w-3 h-3" />
                        {ivTherapy?.name}
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
        </div>

        {/* Input - with safe area padding for notched devices */}
        <div className="flex-shrink-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-800 bg-slate-900/95">
          <div className="max-w-4xl mx-auto flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${ivTherapy?.name} protocols...`}
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-emerald-500 focus:outline-none transition resize-none text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={!input?.trim() || streaming}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {streaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
