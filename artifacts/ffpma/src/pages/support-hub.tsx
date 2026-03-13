import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Pill,
  Truck,
  ShoppingCart,
  Activity,
  Sparkles,
  Headphones,
  MessageCircle,
  Send,
  Users,
  Zap,
  Leaf,
  Bot,
  CheckCircle,
  Clock,
  Copy,
  Printer,
  Share,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const supportAgents = [
  {
    id: "diane",
    name: "DIANE",
    title: "Dietician AI Specialist",
    specialty: "Nutrition, Candida, Keto, Alkaline Diet",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    textColor: "text-pink-400",
    description: "Your nutrition guide for dietary healing and optimal health.",
    available: true,
    portrait: "/generated/diane_dietician_ai_portrait.png",
  },
  {
    id: "pete",
    name: "PETE",
    title: "Peptide Specialist",
    specialty: "GLP-1, Bioregulators, Dosing",
    icon: Pill,
    color: "from-rose-500 to-red-500",
    textColor: "text-rose-400",
    description: "Expert guidance on peptide therapy and bioregulators.",
    available: true,
    portrait: "/generated/pete_peptide_specialist_portrait.png",
  },
  {
    id: "sam",
    name: "SAM",
    title: "Shipping Specialist",
    specialty: "Order Tracking, Delivery Status",
    icon: Truck,
    color: "from-blue-500 to-cyan-500",
    textColor: "text-blue-400",
    description: "Real-time updates on your order and shipping status.",
    available: true,
    portrait: "/generated/sam_shipping_specialist_portrait.png",
  },
  {
    id: "pat",
    name: "PAT",
    title: "Product Specialist",
    specialty: "Recommendations, Protocol Matching",
    icon: ShoppingCart,
    color: "from-cyan-500 to-blue-500",
    textColor: "text-cyan-400",
    description: "Find the perfect products for your healing journey.",
    available: true,
    portrait: "/generated/pat_product_specialist_portrait.png",
    beta: true,
  },
  {
    id: "dr-triage",
    name: "DR. TRIAGE",
    title: "Diagnostics & Protocol Specialist",
    specialty: "5 R's Protocol, Symptom Assessment",
    icon: Activity,
    color: "from-purple-500 to-violet-500",
    textColor: "text-purple-400",
    description: "Guiding you through the 5 R's to Homeostasis.",
    available: true,
    portrait: "/generated/dr_triage_diagnostics_portrait.png",
    beta: true,
  },
  {
    id: "max-mineral",
    name: "MAX MINERAL",
    title: "Essential Nutrients Specialist",
    specialty: "90 Essential Nutrients, Mineral Balance",
    icon: Sparkles,
    color: "from-amber-500 to-yellow-500",
    textColor: "text-amber-400",
    description: "Expert in Dr. Wallach's essential nutrients protocol.",
    available: true,
    portrait: "/generated/max_mineral_nutrients_portrait.png",
  },
  {
    id: "ff-support",
    name: "FF SUPPORT",
    title: "Corporate Support Agent",
    specialty: "Membership, PMA, General Questions",
    icon: Headphones,
    color: "from-cyan-500 to-cyan-500",
    textColor: "text-cyan-400",
    description: "General support for your Forgotten Formula membership.",
    available: true,
    portrait: "/generated/allio_support_corporate_portrait.png",
  },
];

interface ChatMessage {
  id: number;
  agent: string;
  sender: "user" | "agent";
  message: string;
  timestamp: Date;
}

interface ConversationHistory {
  role: "user" | "assistant";
  content: string;
}

export default function SupportHub() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistories, setConversationHistories] = useState<Record<string, ConversationHistory[]>>({});

  const activeAgent = supportAgents.find((a) => a.id === selectedAgent);

  const handleCopySupportChat = () => {
    if (!selectedAgent || !activeAgent) return;
    const history = chatHistory.filter((m) => m.agent === selectedAgent);
    if (history.length === 0) return;
    const text = history.map(m => `${m.sender === 'user' ? 'You' : activeAgent.name}: ${m.message}`).join('\n\n');
    navigator.clipboard.writeText(text);
    toast({ title: "Chat copied to clipboard" });
  };

  const handlePrintSupportChat = () => {
    if (!selectedAgent || !activeAgent) return;
    const history = chatHistory.filter((m) => m.agent === selectedAgent);
    if (history.length === 0) return;
    const text = history.map(m => `<b>${m.sender === 'user' ? 'You' : activeAgent.name}:</b><br/>${m.message.replace(/\n/g, '<br/>')}`).join('<br/><br/>');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Chat with ${activeAgent.name}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; line-height: 1.5; }
            </style>
          </head>
          <body>
            <h2>Chat Transcription: ${activeAgent.name}</h2>
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

  const handleShareSupportChat = async () => {
    if (!selectedAgent || !activeAgent) return;
    const history = chatHistory.filter((m) => m.agent === selectedAgent);
    if (history.length === 0) return;
    const text = history.map(m => `${m.sender === 'user' ? 'You' : activeAgent.name}: ${m.message}`).join('\n\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Chat with ${activeAgent.name}`,
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

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedAgent || isLoading) return;

    const userMessage = chatMessage.trim();
    const newUserMessage: ChatMessage = {
      id: Date.now(),
      agent: selectedAgent,
      sender: "user",
      message: userMessage,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, newUserMessage]);
    setChatMessage("");
    setIsLoading(true);

    try {
      const agentHistory = conversationHistories[selectedAgent] || [];

      const response = await fetch(`/api/agents/${selectedAgent}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: agentHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const agentResponseText = data.response || "I apologize, I'm having trouble responding right now.";

      const agentResponse: ChatMessage = {
        id: Date.now() + 1,
        agent: selectedAgent,
        sender: "agent",
        message: agentResponseText,
        timestamp: new Date(),
      };

      setChatHistory((prev) => [...prev, agentResponse]);

      setConversationHistories((prev) => ({
        ...prev,
        [selectedAgent]: [
          ...(prev[selectedAgent] || []),
          { role: "user", content: userMessage },
          { role: "assistant", content: agentResponseText },
        ],
      }));
    } catch (error) {
      console.error("Chat error:", error);
      const errorResponse: ChatMessage = {
        id: Date.now() + 1,
        agent: selectedAgent,
        sender: "agent",
        message: "I apologize, I'm experiencing a temporary issue. Please try again in a moment.",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="text-white/60 hover:text-white gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Support Hub</h1>
                <p className="text-xs text-white/60">7 AI Specialists Ready to Help</p>
              </div>
            </div>
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse" />
              All Agents Online
            </Badge>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              Choose Your Specialist
            </h2>
            <div className="space-y-3">
              {supportAgents.map((agent) => {
                const Icon = agent.icon;
                return (
                  <motion.div
                    key={agent.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`p-4 bg-slate-800/50 border cursor-pointer transition-all ${selectedAgent === agent.id
                          ? "border-pink-500/50 ring-2 ring-pink-500/20"
                          : "border-white/10 hover:border-white/20"
                        }`}
                      onClick={() => setSelectedAgent(agent.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0 overflow-hidden`}
                        >
                          {agent.portrait ? (
                            <img
                              src={agent.portrait}
                              alt={agent.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <Icon className={`w-6 h-6 text-white ${agent.portrait ? 'hidden' : ''}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white">
                              {agent.name}
                            </span>
                            {agent.available && (
                              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                            )}
                            {'beta' in agent && agent.beta && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-0 text-[10px] px-1.5 py-0">
                                Beta
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-white/60 mb-1">
                            {agent.title}
                          </p>
                          <p className="text-xs text-white/40">
                            {agent.specialty}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            <Card className="bg-slate-800/30 border-white/10 h-[calc(100vh-200px)] flex flex-col">
              {selectedAgent && activeAgent ? (
                <>
                  <div className="p-4 border-b border-white/10 flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeAgent.color} flex items-center justify-center`}
                    >
                      <activeAgent.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {activeAgent.name}
                        </span>
                        <Badge className="bg-cyan-500/10 text-cyan-400 border-0 text-xs">
                          Online
                        </Badge>
                        {'beta' in activeAgent && activeAgent.beta && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-0 text-xs">
                            Beta
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/60">
                        {activeAgent.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={handleCopySupportChat} className="text-white/70 hover:text-white h-8 w-8" title="Copy Chat">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handlePrintSupportChat} className="text-white/70 hover:text-white h-8 w-8" title="Print Chat">
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleShareSupportChat} className="text-white/70 hover:text-white h-8 w-8" title="Share Chat">
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto p-4" style={{ overscrollBehavior: 'contain' }}>
                    <div className="space-y-4">
                      {chatHistory
                        .filter((m) => m.agent === selectedAgent)
                        .map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                              }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-xl px-4 py-2 ${msg.sender === "user"
                                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                                  : "bg-slate-700/50 text-white/90"
                                }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs opacity-60 mt-1">
                                {msg.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      {chatHistory.filter((m) => m.agent === selectedAgent)
                        .length === 0 && (
                          <div className="text-center py-12">
                            <activeAgent.icon
                              className={`w-16 h-16 mx-auto mb-4 ${activeAgent.textColor}`}
                            />
                            <h3 className="text-lg font-medium text-white mb-2">
                              Chat with {activeAgent.name}
                            </h3>
                            <p className="text-sm text-white/60 max-w-md mx-auto">
                              {activeAgent.description}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                              <Badge
                                variant="outline"
                                className="text-white/60 border-white/20"
                              >
                                {activeAgent.specialty}
                              </Badge>
                            </div>
                          </div>
                        )}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-700/50 text-white/90 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
                              <span className="text-sm text-white/60">{activeAgent.name} is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <Input
                        placeholder={`Ask ${activeAgent.name} a question...`}
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                        disabled={isLoading}
                        className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/40"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isLoading || !chatMessage.trim()}
                        className={`bg-gradient-to-r ${activeAgent.color}`}
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-white/20" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      Select a Specialist
                    </h3>
                    <p className="text-sm text-white/60">
                      Choose an AI specialist from the left to start a
                      conversation
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
