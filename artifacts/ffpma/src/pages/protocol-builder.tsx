import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  Send,
  ClipboardList,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Printer,
  RefreshCw,
  Dna,
  Syringe,
  FlaskConical,
  Layers,
  Droplets,
  Pill,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  {
    icon: Dna,
    title: "Anti-Aging Protocol",
    prompt: "Build a comprehensive anti-aging protocol for a 55-year-old male interested in longevity optimization. Include peptides, bioregulators, and supportive therapies.",
  },
  {
    icon: Syringe,
    title: "Tissue Repair Stack",
    prompt: "Create a tissue repair and recovery protocol for an athlete with chronic tendon issues. Focus on healing peptides and synergistic combinations.",
  },
  {
    icon: FlaskConical,
    title: "Immune Restoration",
    prompt: "Design an immune system restoration protocol using Khavinson bioregulators and supportive peptides for post-illness recovery.",
  },
  {
    icon: Layers,
    title: "Metabolic Optimization",
    prompt: "Build a weight loss and metabolic optimization protocol combining peptides, IM therapies, and oral supplements for sustainable fat loss.",
  },
];

export default function ProtocolBuilder() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const userName = user?.firstName || user?.username || "Doctor";
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/protocol-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              assistantMessage += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                };
                return updated;
              });
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error("Protocol builder error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered an error building your protocol. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Protocol - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; }
              h1 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
              .message { margin: 20px 0; padding: 15px; border-radius: 8px; }
              .user { background: #f3f4f6; }
              .assistant { background: #faf5ff; border-left: 4px solid #7c3aed; }
              .label { font-weight: bold; color: #7c3aed; margin-bottom: 8px; }
              hr { border: none; border-top: 1px dashed #d1d5db; margin: 30px 0; }
              .footer { margin-top: 40px; font-size: 12px; color: #6b7280; text-align: center; }
            </style>
          </head>
          <body>
            <h1>🧬 Forgotten Formula Protocol</h1>
            <p style="color: #6b7280;">Generated: ${new Date().toLocaleString()}</p>
            ${messages
              .map(
                (m) => `
              <div class="message ${m.role}">
                <div class="label">${
                  m.role === "user" ? "📋 Physician Query" : "🔬 Protocol Architect"
                }</div>
                <div>${m.content.replace(/\n/g, "<br>")}</div>
              </div>
            `
              )
              .join("<hr>")}
            <div class="footer">Generated by FF PMA Clinical Intelligence Console</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleNewProtocol = () => {
    setMessages([]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/30 backdrop-blur-lg border-b border-violet-500/30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/dashboard")}
              className="p-2 rounded-lg hover:bg-violet-500/20 transition-colors text-violet-300"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <ClipboardList size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Protocol Architect</h1>
                <p className="text-xs text-violet-300">Full Catalog Knowledge Base</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <>
                <button
                  onClick={handleNewProtocol}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 text-sm transition-colors"
                >
                  <RefreshCw size={14} />
                  New
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 text-sm transition-colors"
                >
                  <Printer size={14} />
                  Print
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 mb-6">
                  <Sparkles size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Protocol Architect</h2>
                <p className="text-violet-200 max-w-xl mx-auto">
                  Welcome, Dr. {userName}. I have complete knowledge of all{" "}
                  <span className="text-violet-300 font-semibold">127+ products</span> in the FF PMA
                  catalog. Describe your patient's needs and I'll build a comprehensive protocol.
                </p>
              </motion.div>

              {/* Product Category Pills */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {[
                  { icon: Syringe, label: "Peptides", color: "from-blue-500 to-cyan-500" },
                  { icon: Droplets, label: "IV Therapies", color: "from-emerald-500 to-teal-500" },
                  { icon: Pill, label: "IM Therapies", color: "from-amber-500 to-orange-500" },
                  { icon: Dna, label: "Bioregulators", color: "from-emerald-500 to-green-500" },
                  { icon: FlaskConical, label: "Oral Peptides", color: "from-indigo-500 to-purple-500" },
                  { icon: Layers, label: "Suppositories", color: "from-pink-500 to-rose-500" },
                ].map((cat, i) => (
                  <motion.div
                    key={cat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * i }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${cat.color} text-white text-sm font-medium shadow-lg`}
                  >
                    <cat.icon size={14} />
                    {cat.label}
                  </motion.div>
                ))}
              </div>

              {/* Suggested Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    onClick={() => handleSend(prompt.prompt)}
                    className="group p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/20 hover:border-violet-400/50 transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/30 flex items-center justify-center group-hover:bg-violet-500/50 transition-colors">
                        <prompt.icon size={16} className="text-violet-300" />
                      </div>
                      <span className="text-sm font-semibold text-white">{prompt.title}</span>
                    </div>
                    <p className="text-xs text-violet-300 line-clamp-2">{prompt.prompt}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-violet-600 text-white"
                          : "bg-white/10 backdrop-blur-sm text-white border border-violet-500/30"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-violet-500/20">
                          <ClipboardList size={14} className="text-violet-400" />
                          <span className="text-xs font-medium text-violet-300">
                            Protocol Architect
                          </span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                        {isLoading &&
                          index === messages.length - 1 &&
                          message.role === "assistant" && (
                            <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-1" />
                          )}
                      </div>
                      {message.role === "assistant" && message.content && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-violet-500/20">
                          <button
                            onClick={() => copyToClipboard(message.content, index)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-violet-300 hover:bg-violet-500/20 transition-colors"
                          >
                            {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />}
                            {copiedIndex === index ? "Copied" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <div
        className="sticky bottom-0 bg-black/30 backdrop-blur-lg border-t border-violet-500/30 p-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3 bg-violet-500/10 rounded-2xl border border-violet-500/30 p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the patient case and desired outcomes..."
              rows={2}
              className="flex-1 bg-transparent text-white placeholder-violet-400/60 resize-none focus:outline-none p-2 text-sm"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white disabled:opacity-50 hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/30"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          <p className="text-center text-xs text-violet-400/60 mt-2">
            Protocol recommendations are for physician reference. Always verify against current
            clinical guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
