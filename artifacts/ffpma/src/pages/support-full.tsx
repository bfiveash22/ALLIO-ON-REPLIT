import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Salad,
  Dna,
  Truck,
  Package,
  Headphones,
  Send,
  MessageSquare,
  Plus,
  Trash2,
  Bot,
  Sparkles,
  ChevronRight,
} from "lucide-react";

type AgentType = "diane" | "pete" | "sam" | "pat" | "corporate";

interface AgentInfo {
  name: string;
  title: string;
  specialty: string;
  icon: string;
  color: string;
  suggestedQuestions: string[];
}

interface Message {
  id: number;
  role: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  agentType: AgentType;
  createdAt: string;
  messages?: Message[];
}

const ICON_MAP: Record<string, typeof Salad> = {
  Salad: Salad,
  Dna: Dna,
  Truck: Truck,
  Package: Package,
  Headphones: Headphones,
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  cyan: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-800" },
  blue: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  amber: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
  purple: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
  slate: { bg: "bg-slate-100 dark:bg-slate-900/30", text: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-800" },
};

export default function SupportPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>("corporate");
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: agents } = useQuery<Record<AgentType, AgentInfo>>({
    queryKey: ["/api/support/agents"],
  });

  const { data: conversations, refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: [`/api/support/conversations?agentType=${selectedAgent}`],
  });

  const { data: activeConversationData, refetch: refetchActiveConversation } = useQuery<Conversation>({
    queryKey: [`/api/support/conversations/${activeConversation}`],
    enabled: !!activeConversation,
  });

  const createConversation = useMutation({
    mutationFn: async (agentType: AgentType) => {
      return apiRequest("POST", "/api/support/conversations", { agentType });
    },
    onSuccess: async (data) => {
      const conv = await data.json();
      setActiveConversation(conv.id);
      refetchConversations();
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/support/conversations/${id}`);
    },
    onSuccess: () => {
      if (activeConversation === deleteConversation.variables) {
        setActiveConversation(null);
      }
      refetchConversations();
      toast({ title: "Conversation deleted" });
    },
  });

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeConversation || isStreaming) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const response = await fetch(`/api/support/conversations/${activeConversation}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setStreamingMessage((prev) => prev + data.content);
              }
              if (data.done) {
                setIsStreaming(false);
                setStreamingMessage("");
                refetchActiveConversation();
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsStreaming(false);
      toast({ title: "Failed to send message", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversationData?.messages, streamingMessage]);

  const currentAgent = agents?.[selectedAgent];
  const IconComponent = currentAgent ? ICON_MAP[currentAgent.icon] || Headphones : Headphones;
  const colorClasses = currentAgent ? COLOR_CLASSES[currentAgent.color] || COLOR_CLASSES.slate : COLOR_CLASSES.slate;

  const filteredConversations = conversations?.filter(c => c.agentType === selectedAgent) || [];

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Headphones className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                Support Hub
              </h1>
              <p className="text-muted-foreground">
                Connect with our specialized AI support team
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5 mb-6">
          {agents && Object.entries(agents).map(([key, agent]) => {
            const AgentIcon = ICON_MAP[agent.icon] || Headphones;
            const agentColors = COLOR_CLASSES[agent.color] || COLOR_CLASSES.slate;
            const isSelected = selectedAgent === key;
            
            return (
              <Card 
                key={key}
                className={`cursor-pointer transition-all ${isSelected ? `ring-2 ring-primary ${agentColors.border}` : 'hover-elevate'}`}
                onClick={() => {
                  setSelectedAgent(key as AgentType);
                  setActiveConversation(null);
                }}
                data-testid={`card-agent-${key}`}
              >
                <CardContent className="p-4 text-center">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full mx-auto mb-2 ${agentColors.bg}`}>
                    <AgentIcon className={`h-6 w-6 ${agentColors.text}`} />
                  </div>
                  <h3 className="font-semibold">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground">{agent.title}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Conversations</CardTitle>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => createConversation.mutate(selectedAgent)}
                    disabled={createConversation.isPending}
                    data-testid="button-new-conversation"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No conversations yet. Start a new one!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredConversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={`p-2 rounded-md cursor-pointer flex items-center justify-between group ${
                            activeConversation === conv.id ? 'bg-muted' : 'hover-elevate'
                          }`}
                          onClick={() => setActiveConversation(conv.id)}
                          data-testid={`conversation-${conv.id}`}
                        >
                          <div className="flex items-center gap-2 truncate flex-1">
                            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="text-sm truncate">{conv.title}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation.mutate(conv.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className={colorClasses.border}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${colorClasses.bg}`}>
                    <IconComponent className={`h-4 w-4 ${colorClasses.text}`} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{currentAgent?.name}</CardTitle>
                    <CardDescription className="text-xs">{currentAgent?.specialty}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Suggested questions:</p>
                <div className="space-y-2">
                  {currentAgent?.suggestedQuestions.slice(0, 3).map((q, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left text-xs p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                      onClick={() => {
                        if (!activeConversation) {
                          createConversation.mutate(selectedAgent);
                        }
                        setInputMessage(q);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-350px)] min-h-[500px] flex flex-col">
              {!activeConversation ? (
                <CardContent className="flex-1 flex flex-col items-center justify-center">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-full mb-4 ${colorClasses.bg}`}>
                    <IconComponent className={`h-8 w-8 ${colorClasses.text}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Chat with {currentAgent?.name}</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    {currentAgent?.specialty}
                  </p>
                  <Button 
                    onClick={() => createConversation.mutate(selectedAgent)}
                    disabled={createConversation.isPending}
                    className="gap-2"
                    data-testid="button-start-conversation"
                  >
                    <Sparkles className="h-4 w-4" />
                    Start Conversation
                  </Button>
                </CardContent>
              ) : (
                <>
                  <CardHeader className="py-3 border-b">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${colorClasses.bg}`}>
                        <IconComponent className={`h-4 w-4 ${colorClasses.text}`} />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{currentAgent?.name}</CardTitle>
                        <CardDescription className="text-xs">{currentAgent?.title}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <div className="flex-1 min-h-0 overflow-y-auto p-4" ref={scrollRef} style={{ overscrollBehavior: 'contain' }}>
                    <div className="space-y-4">
                      {activeConversationData?.messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      
                      {streamingMessage && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                            <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
                          </div>
                        </div>
                      )}
                      
                      {isStreaming && !streamingMessage && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg px-4 py-2">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
                              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse delay-75" />
                              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse delay-150" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 border-t">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        placeholder={`Ask ${currentAgent?.name}...`}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        disabled={isStreaming}
                        data-testid="input-message"
                      />
                      <Button type="submit" disabled={!inputMessage.trim() || isStreaming} data-testid="button-send">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
