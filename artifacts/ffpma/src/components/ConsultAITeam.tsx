import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  Send,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
  Copy,
  Printer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ScienceAgent {
  id: string;
  name: string;
  title: string;
  specialty: string;
  catchphrase: string;
  portrait: string;
}

interface AgentsResponse {
  success: boolean;
  agents: ScienceAgent[];
}

interface ChatMessage {
  id: number;
  agentId: string;
  sender: "user" | "agent";
  message: string;
  timestamp: Date;
  agentName?: string;
}

interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
}

interface PatientContext {
  name: string;
  conditions: string;
  notes: string;
}

interface ConsultAITeamProps {
  preselectedAgentId?: string;
  patientName?: string;
}

const AGENT_COLORS: Record<string, string> = {
  prometheus: "from-orange-500 to-red-500",
  hippocrates: "from-emerald-500 to-green-600",
  helix: "from-blue-500 to-indigo-500",
  diane: "from-pink-500 to-rose-500",
  pete: "from-rose-500 to-red-500",
  "dr-triage": "from-purple-500 to-violet-500",
  "max-mineral": "from-amber-500 to-yellow-500",
  "dr-formula": "from-cyan-500 to-teal-500",
  "bio-rhythm": "from-violet-500 to-purple-600",
  sable: "from-slate-500 to-gray-600",
  "flora-biome": "from-green-500 to-lime-500",
  atlas: "from-sky-500 to-blue-500",
  "quantum-flux": "from-fuchsia-500 to-pink-500",
  nova: "from-yellow-500 to-orange-500",
};

export function ConsultAITeam({ preselectedAgentId, patientName }: ConsultAITeamProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(preselectedAgentId || null);
  const [messageText, setMessageText] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try {
      const stored = sessionStorage.getItem("ai-consult-chat");
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch { /* ignore */ }
    return [];
  });
  const [conversationHistories, setConversationHistories] = useState<Record<string, ConversationEntry[]>>(() => {
    try {
      const stored = sessionStorage.getItem("ai-consult-convos");
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return {};
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [patientContext, setPatientContext] = useState<PatientContext>({
    name: patientName || "",
    conditions: "",
    notes: "",
  });
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: agentsData } = useQuery<AgentsResponse>({
    queryKey: ["/api/doctor/consult/agents"],
  });

  const scienceAgents = agentsData?.agents || [];
  const activeAgent = scienceAgents.find((a) => a.id === selectedAgentId);

  useEffect(() => {
    try { sessionStorage.setItem("ai-consult-chat", JSON.stringify(chatHistory)); } catch { /* ignore */ }
  }, [chatHistory]);

  useEffect(() => {
    try { sessionStorage.setItem("ai-consult-convos", JSON.stringify(conversationHistories)); } catch { /* ignore */ }
  }, [conversationHistories]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    if (preselectedAgentId) setSelectedAgentId(preselectedAgentId);
  }, [preselectedAgentId]);

  useEffect(() => {
    if (patientName) setPatientContext((prev) => ({ ...prev, name: patientName }));
  }, [patientName]);

  const filteredHistory = chatHistory.filter((m) => m.agentId === selectedAgentId);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedAgentId || isLoading) return;

    const userText = messageText.trim();
    const newMsg: ChatMessage = {
      id: Date.now(),
      agentId: selectedAgentId,
      sender: "user",
      message: userText,
      timestamp: new Date(),
    };
    setChatHistory((prev) => [...prev, newMsg]);
    setMessageText("");
    setIsLoading(true);

    try {
      const agentHistory = conversationHistories[selectedAgentId] || [];
      const hasContext = patientContext.name || patientContext.conditions || patientContext.notes;
      const res = await apiRequest("POST", `/api/doctor/consult/${selectedAgentId}`, {
        message: userText,
        history: agentHistory,
        ...(hasContext ? { patientContext } : {}),
      });

      const data = await res.json();
      const responseText = data.response || "I apologize, I'm having trouble responding right now.";

      const agentMsg: ChatMessage = {
        id: Date.now() + 1,
        agentId: selectedAgentId,
        sender: "agent",
        message: responseText,
        timestamp: new Date(),
        agentName: activeAgent?.name,
      };
      setChatHistory((prev) => [...prev, agentMsg]);

      setConversationHistories((prev) => ({
        ...prev,
        [selectedAgentId]: [
          ...(prev[selectedAgentId] || []),
          { role: "user" as const, content: userText },
          { role: "assistant" as const, content: responseText },
        ],
      }));
    } catch (error: unknown) {
      console.error("Consult error:", error);
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        agentId: selectedAgentId,
        sender: "agent",
        message: "I apologize, I'm experiencing a temporary issue. Please try again in a moment.",
        timestamp: new Date(),
        agentName: activeAgent?.name,
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTranscript = () => {
    if (filteredHistory.length === 0) return;
    const text = filteredHistory
      .map((m) => `${m.sender === "user" ? "You" : (m.agentName || "Agent")}: ${m.message}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Transcript copied to clipboard" });
  };

  const handlePrintTranscript = () => {
    if (filteredHistory.length === 0) return;
    const text = filteredHistory
      .map((m) => `<b>${m.sender === "user" ? "You" : (m.agentName || "Agent")}:</b><br/>${m.message.replace(/\n/g, "<br/>")}`)
      .join("<br/><br/>");
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<html><head><title>AI Consultation - ${activeAgent?.name}</title><style>body{font-family:sans-serif;padding:20px;line-height:1.6;max-width:800px;margin:0 auto;}</style></head><body><h2>AI Consultation: ${activeAgent?.name} - ${activeAgent?.title}</h2><p style="color:#666;">Member: ${patientContext.name || "Not specified"}</p><hr/>${text}<br/><hr/><p style="color:#999;font-size:12px;">This consultation is provided within the private domain of the Forgotten Formula PMA for educational purposes. Clinical decisions remain at the practitioner's discretion.</p></body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    }
  };

  return (
    <Card className="bg-black/20 border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-violet-400" />
            AI Science Team Consultation
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Consult with AI specialists for member analysis and protocol guidance
          </p>
        </div>
        <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/30">
          <div className="w-2 h-2 bg-violet-400 rounded-full mr-2 animate-pulse" />
          {scienceAgents.length} Specialists Online
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-medium text-white/80 text-sm mb-2">Science Division</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {scienceAgents.map((agent) => {
              const gradient = AGENT_COLORS[agent.id] || "from-cyan-500 to-violet-500";
              const hasMessages = chatHistory.some((m) => m.agentId === agent.id);
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedAgentId === agent.id
                      ? "bg-violet-500/20 border border-violet-500/50 ring-1 ring-violet-500/20"
                      : "bg-white/5 hover:bg-white/10 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden`}>
                      {agent.portrait ? (
                        <img
                          src={`/generated/${agent.portrait}`}
                          alt={agent.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        agent.name.substring(0, 2)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold truncate">{agent.name}</p>
                        {hasMessages && (
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-white/50 truncate">{agent.title}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => setShowContext(!showContext)}
              className="flex items-center gap-2 text-xs text-white/60 hover:text-white/80 transition-colors w-full"
            >
              <User className="w-3 h-3" />
              Member Context
              {showContext ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            {showContext && (
              <div className="mt-2 space-y-2">
                <Input
                  placeholder="Member name"
                  value={patientContext.name}
                  onChange={(e) => setPatientContext((p) => ({ ...p, name: e.target.value }))}
                  className="bg-white/5 border-white/10 text-xs h-8"
                />
                <Input
                  placeholder="Conditions (e.g., candida, leaky gut)"
                  value={patientContext.conditions}
                  onChange={(e) => setPatientContext((p) => ({ ...p, conditions: e.target.value }))}
                  className="bg-white/5 border-white/10 text-xs h-8"
                />
                <Textarea
                  placeholder="Additional notes..."
                  value={patientContext.notes}
                  onChange={(e) => setPatientContext((p) => ({ ...p, notes: e.target.value }))}
                  className="bg-white/5 border-white/10 text-xs min-h-[60px]"
                />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col h-[520px] rounded-xl bg-white/5 border border-white/10">
          {selectedAgentId && activeAgent ? (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AGENT_COLORS[activeAgent.id] || "from-cyan-500 to-violet-500"} flex items-center justify-center font-bold text-sm overflow-hidden`}>
                    {activeAgent.portrait ? (
                      <img
                        src={`/generated/${activeAgent.portrait}`}
                        alt={activeAgent.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      activeAgent.name.substring(0, 2)
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{activeAgent.name}</p>
                    <p className="text-xs text-white/50">{activeAgent.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyTranscript}
                    disabled={filteredHistory.length === 0}
                    className="text-white/40 hover:text-white/80 h-8 w-8 p-0"
                    title="Copy transcript"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrintTranscript}
                    disabled={filteredHistory.length === 0}
                    className="text-white/40 hover:text-white/80 h-8 w-8 p-0"
                    title="Print transcript"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center max-w-md">
                      <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${AGENT_COLORS[activeAgent.id] || "from-cyan-500 to-violet-500"} flex items-center justify-center mb-4 overflow-hidden`}>
                        {activeAgent.portrait ? (
                          <img
                            src={`/generated/${activeAgent.portrait}`}
                            alt={activeAgent.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Bot className="w-8 h-8" />
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-1">{activeAgent.name}</h3>
                      <p className="text-sm text-white/50 mb-2">{activeAgent.specialty}</p>
                      <p className="text-xs text-white/40 italic">"{activeAgent.catchphrase}"</p>
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {["Protocol guidance", "Lab interpretation", "Treatment options"].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setMessageText(`Help me with ${suggestion.toLowerCase()} for my member`)}
                            className="text-xs px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 border border-violet-500/20 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  filteredHistory.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] ${msg.sender === "user" ? "bg-violet-500/20 rounded-2xl rounded-br-sm" : "bg-white/10 rounded-2xl rounded-bl-sm"} p-3`}>
                        {msg.sender === "agent" && (
                          <p className="text-xs text-violet-300 font-semibold mb-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {msg.agentName}
                          </p>
                        )}
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</div>
                        <p className="text-xs text-white/30 mt-1.5 text-right">
                          {format(msg.timestamp, "h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-2xl rounded-bl-sm p-3 px-5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={`Ask ${activeAgent.name} about your member...`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 bg-white/5 border-white/10"
                    disabled={isLoading}
                  />
                  <Button
                    className="bg-violet-500 hover:bg-violet-600"
                    onClick={handleSendMessage}
                    disabled={isLoading || !messageText.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-white/30 mt-1.5 text-center">
                  AI consultation within the Forgotten Formula PMA private domain. All clinical decisions remain at the practitioner's discretion.
                </p>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-white/40">
              <div className="text-center">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Select an AI Specialist</p>
                <p className="text-sm mt-1 text-white/30">Choose from the Science Division team</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
