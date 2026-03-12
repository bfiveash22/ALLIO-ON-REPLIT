import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Bot, RefreshCw, Copy, Printer, Share } from "lucide-react";
import { agents } from "@shared/agents";

export function GlobalAgentChat() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<typeof agents[0] | null>(null);

  // Keep a persistent dictionary of chat histories for each agent
  const [chatHistories, setChatHistories] = useState<Record<string, Array<{ role: "user" | "assistant"; content: string }>>>({});
  const [agentInput, setAgentInput] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);

  useEffect(() => {
    const handleOpenChat = (e: CustomEvent<{ agent: typeof agents[0] }>) => {
      const agent = e.detail.agent;
      setSelectedAgent(agent);

      // Only inject the greeting if this agent doesn't have a history yet
      setChatHistories(prev => {
        if (!prev[agent.id]) {
          return {
            ...prev,
            [agent.id]: [{
              role: "assistant",
              content: `Greetings, Trustee. I am ${agent.name}, ${agent.title} from the ${agent.division.charAt(0).toUpperCase() + agent.division.slice(1)} Division.\n\nSpecialty: ${agent.specialty}\n\n"${(agent as any).catchphrase || "At your service."}"\n\nHow may I assist you today?`
            }]
          };
        }
        return prev;
      });
    };

    window.addEventListener("open-agent-chat", handleOpenChat as unknown as EventListener);
    return () => {
      window.removeEventListener("open-agent-chat", handleOpenChat as unknown as EventListener);
    };
  }, []);

  const handleCopyChat = () => {
    if (!selectedAgent || !chatHistories[selectedAgent.id]) return;
    const history = chatHistories[selectedAgent.id];
    const text = history.map(m => `${m.role === 'user' ? 'You' : selectedAgent.name}: ${m.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    toast({ title: "Chat copied to clipboard" });
  };

  const handlePrintChat = () => {
    if (!selectedAgent || !chatHistories[selectedAgent.id]) return;
    const history = chatHistories[selectedAgent.id];
    const text = history.map(m => `<b>${m.role === 'user' ? 'You' : selectedAgent.name}:</b><br/>${m.content.replace(/\n/g, '<br/>')}`).join('<br/><br/>');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Chat with ${selectedAgent.name}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; line-height: 1.5; }
            </style>
          </head>
          <body>
            <h2>Chat Transcription: ${selectedAgent.name}</h2>
            <hr/>
            ${text}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleShareChat = async () => {
    if (!selectedAgent || !chatHistories[selectedAgent.id]) return;
    const history = chatHistories[selectedAgent.id];
    const text = history.map(m => `${m.role === 'user' ? 'You' : selectedAgent.name}: ${m.content}`).join('\n\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Chat with ${selectedAgent.name}`,
          text: text,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Chat copied to clipboard (Sharing not supported)" });
    }
  };

  const sendAgentMessage = async () => {
    if (!agentInput.trim() || agentLoading || !selectedAgent) return;

    const userMessage = agentInput.trim();
    setAgentInput("");

    // Optimistically add user message to history
    const currentAgentId = selectedAgent.id;
    const currentHistory = chatHistories[currentAgentId] || [];
    const newHistory = [...currentHistory, { role: "user" as const, content: userMessage }];

    setChatHistories(prev => ({ ...prev, [currentAgentId]: newHistory }));
    setAgentLoading(true);

    try {
      const res = await apiRequest("POST", `/api/agents/${currentAgentId}/chat`, {
        message: userMessage,
        history: currentHistory
      });
      const data = await res.json();

      setChatHistories(prev => ({
        ...prev,
        [currentAgentId]: [...prev[currentAgentId], { role: "assistant" as const, content: data.response }]
      }));

      if (data.actionsExecuted?.length > 0) {
        toast({
          title: "Actions Executed",
          description: data.actionsExecuted.join(", "),
        });
      }
    } catch (error: any) {
      toast({ title: `${selectedAgent.name} Error`, description: error.message, variant: "destructive" });
      setChatHistories(prev => ({
        ...prev,
        [currentAgentId]: [...prev[currentAgentId], { role: "assistant" as const, content: `I apologize, but I am unable to respond at the moment. Please try again.` }]
      }));
    } finally {
      setAgentLoading(false);
    }
  };

  const currentMessages = selectedAgent ? (chatHistories[selectedAgent.id] || []) : [];

  return (
    <AnimatePresence>
      {selectedAgent && (
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-50 w-full max-w-sm sm:max-w-md h-[550px] max-h-[80vh] flex flex-col bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-xl shadow-2xl overflow-hidden shadow-cyan-900/20"
          data-testid="agent-chat-panel"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="font-bold text-sm md:text-base text-white">{selectedAgent.name}</h2>
                <p className="text-xs text-cyan-300 font-medium">{selectedAgent.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleCopyChat} className="text-white/70 hover:text-white h-8 w-8" title="Copy Chat">
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handlePrintChat} className="text-white/70 hover:text-white h-8 w-8" title="Print Chat">
                <Printer className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShareChat} className="text-white/70 hover:text-white h-8 w-8" title="Share Chat">
                <Share className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedAgent(null)}
                className="hover:bg-red-500/20 hover:text-red-400 text-white/70 h-8 w-8 rounded-full ml-1"
                title="Close Chat"
              >
                <span className="text-lg">✕</span>
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4 bg-black/40" style={{ overscrollBehavior: 'contain' }}>
            {currentMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === "user"
                    ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-br-sm shadow-md"
                    : "bg-white/10 text-white/90 border border-white/5 rounded-bl-sm shadow-sm font-light text-[15px] leading-relaxed"
                  }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {agentLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 p-3 rounded-2xl rounded-bl-sm border border-white/5">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-sm text-cyan-200">{selectedAgent.name} is processing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10 bg-[#0f111a]">
            <div className="flex items-center gap-2 relative">
              <Input
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendAgentMessage()}
                placeholder={`Command ${selectedAgent.name}...`}
                className="flex-1 bg-black/50 border-white/20 text-white focus-visible:ring-cyan-500 pl-4 pr-12 py-6 rounded-full"
                disabled={agentLoading}
                data-testid="agent-chat-input"
              />
              <Button
                onClick={sendAgentMessage}
                disabled={agentLoading || !agentInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-full h-8 w-8 p-0 flex items-center justify-center transition-all shadow-lg"
                data-testid="agent-chat-send"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
