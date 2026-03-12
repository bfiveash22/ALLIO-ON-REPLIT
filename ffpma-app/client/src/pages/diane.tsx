import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bot, 
  Send, 
  Plus, 
  MessageSquare, 
  Sparkles,
  Trash2,
  Loader2,
  Heart,
  Apple,
  Leaf,
  Info,
  ChevronRight,
  BookOpen,
  FileText,
  Beaker,
  Coffee,
  Clock,
  ExternalLink
} from "lucide-react";

interface DianeKnowledgeEntry {
  id: number;
  category: string;
  title: string;
  summary: string;
  content: string;
  sourceDocument: string;
  driveFileId: string;
  tags: string[];
  relatedProducts: string[];
  relatedGenes: string[];
  isActive: boolean;
}

interface DianeMessage {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: string;
}

interface DianeConversation {
  id: number;
  userId: string;
  userName: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: DianeMessage[];
}

const SAMPLE_QUESTIONS = [
  "What foods should I avoid on a candida diet?",
  "How do I start a ketogenic diet safely?",
  "Tell me about the Gerson therapy juicing protocol",
  "What are the 90 essential nutrients Dr. Wallach recommends?",
  "How can I create a more alkaline body environment?",
  "What should I know about the dangers of GMO foods?",
];

const CATEGORY_ICONS: Record<string, any> = {
  therapy_protocol: FileText,
  recipe: Coffee,
  supplement: Beaker,
  detox: Leaf,
  diet_plan: Apple,
  healing_modality: Heart,
  research: BookOpen,
  case_study: FileText,
};

const CATEGORY_LABELS: Record<string, string> = {
  therapy_protocol: "Therapy Protocol",
  recipe: "Recipe",
  supplement: "Supplement",
  detox: "Detox",
  diet_plan: "Diet Plan",
  healing_modality: "Healing Modality",
  research: "Research",
  case_study: "Case Study",
};

export default function DianePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [selectedKnowledgeEntry, setSelectedKnowledgeEntry] = useState<DianeKnowledgeEntry | null>(null);
  const [knowledgeCategory, setKnowledgeCategory] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversations = [], isLoading: loadingConversations } = useQuery<DianeConversation[]>({
    queryKey: ["/api/diane/conversations"],
  });

  const { data: knowledgeEntries = [], isLoading: loadingKnowledge } = useQuery<DianeKnowledgeEntry[]>({
    queryKey: ["/api/diane/knowledge"],
  });

  const filteredKnowledge = knowledgeCategory === "all" 
    ? knowledgeEntries 
    : knowledgeEntries.filter(e => e.category === knowledgeCategory);

  const { data: currentConversation, isLoading: loadingMessages } = useQuery<DianeConversation>({
    queryKey: ["/api/diane/conversations", selectedConversationId],
    enabled: !!selectedConversationId,
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/diane/conversations", {
        title: "New Conversation with Diane",
      });
      return response.json();
    },
    onSuccess: (newConversation: DianeConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/diane/conversations"] });
      setSelectedConversationId(newConversation.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start new conversation",
        variant: "destructive",
      });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/diane/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diane/conversations"] });
      if (selectedConversationId) {
        setSelectedConversationId(null);
      }
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, streamingContent]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || !selectedConversationId || isStreaming) return;

    setInputMessage("");
    setIsStreaming(true);
    setStreamingContent("");

    const optimisticMessage: DianeMessage = {
      id: Date.now(),
      conversationId: selectedConversationId,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData<DianeConversation>(
      ["/api/diane/conversations", selectedConversationId],
      (old) => ({
        ...old!,
        messages: [...(old?.messages || []), optimisticMessage],
      })
    );

    try {
      const response = await fetch(`/api/diane/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                }
                if (data.done) {
                  setIsStreaming(false);
                  setStreamingContent("");
                  queryClient.invalidateQueries({ 
                    queryKey: ["/api/diane/conversations", selectedConversationId] 
                  });
                  queryClient.invalidateQueries({ 
                    queryKey: ["/api/diane/conversations"] 
                  });
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from Diane",
        variant: "destructive",
      });
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const handleSampleQuestion = (question: string) => {
    if (!selectedConversationId) {
      createConversationMutation.mutate(undefined, {
        onSuccess: () => {
          setTimeout(() => {
            sendMessage(question);
          }, 500);
        },
      });
    } else {
      sendMessage(question);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversationId) {
      createConversationMutation.mutate(undefined, {
        onSuccess: () => {
          setTimeout(() => {
            sendMessage(inputMessage);
          }, 500);
        },
      });
    } else {
      sendMessage(inputMessage);
    }
  };

  const messages = currentConversation?.messages || [];

  return (
    <main className="flex-1 overflow-hidden">
      <div className="flex h-[calc(100vh-3.5rem)]">
        <div className="w-80 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg" data-testid="text-diane-title">Diane</h2>
                <p className="text-xs text-muted-foreground">Dietician Specialist</p>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="chat" className="gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Knowledge
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {activeTab === "chat" && (
              <Button 
                onClick={() => createConversationMutation.mutate()} 
                className="w-full gap-2"
                disabled={createConversationMutation.isPending}
                data-testid="button-new-conversation"
              >
                <Plus className="h-4 w-4" />
                New Conversation
              </Button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {activeTab === "chat" ? (
              <div className="p-2 space-y-1">
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-xs">Start chatting with Diane!</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversationId === conv.id
                          ? "bg-primary/10 text-primary"
                          : "hover-elevate"
                      }`}
                      onClick={() => setSelectedConversationId(conv.id)}
                      data-testid={`conversation-item-${conv.id}`}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate text-sm">{conv.title}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversationMutation.mutate(conv.id);
                        }}
                        data-testid={`button-delete-conversation-${conv.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                <div 
                  className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                    knowledgeCategory === "all" ? "bg-primary/10 text-primary" : "hover-elevate"
                  }`}
                  onClick={() => { setKnowledgeCategory("all"); setSelectedKnowledgeEntry(null); }}
                  data-testid="knowledge-category-all"
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-sm">All Entries</span>
                  <Badge variant="secondary" className="text-xs">{knowledgeEntries.length}</Badge>
                </div>
                <Separator className="my-2" />
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                  const Icon = CATEGORY_ICONS[key] || FileText;
                  const count = knowledgeEntries.filter(e => e.category === key).length;
                  if (count === 0) return null;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        knowledgeCategory === key ? "bg-primary/10 text-primary" : "hover-elevate"
                      }`}
                      onClick={() => { setKnowledgeCategory(key); setSelectedKnowledgeEntry(null); }}
                      data-testid={`knowledge-category-${key}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-sm">{label}</span>
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-muted/50">
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="h-3 w-3 text-rose-500" />
                <span>Candida Diet Expert</span>
              </div>
              <div className="flex items-center gap-2">
                <Apple className="h-3 w-3 text-amber-500" />
                <span>Keto & Gerson Therapy</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="h-3 w-3 text-cyan-500" />
                <span>Alkaline & Organic Living</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {activeTab === "knowledge" ? (
            <div className="flex-1 flex flex-col">
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold" data-testid="text-knowledge-title">
                      Healing Knowledge Base
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Curated protocols, recipes, and research from verified sources
                    </p>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    {knowledgeEntries.length} Entries
                  </Badge>
                </div>
              </div>
              
              {selectedKnowledgeEntry ? (
                <div className="flex-1 min-h-0 overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mb-4 gap-2"
                      onClick={() => setSelectedKnowledgeEntry(null)}
                      data-testid="button-back-to-list"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      Back to list
                    </Button>
                    
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <Badge variant="secondary" className="mb-2">
                              {CATEGORY_LABELS[selectedKnowledgeEntry.category] || selectedKnowledgeEntry.category}
                            </Badge>
                            <CardTitle className="text-2xl">{selectedKnowledgeEntry.title}</CardTitle>
                            <CardDescription className="text-base">{selectedKnowledgeEntry.summary}</CardDescription>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 pt-4">
                          {selectedKnowledgeEntry.tags?.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-transparent p-0 border-0">
                            {selectedKnowledgeEntry.content}
                          </pre>
                        </div>
                        
                        {selectedKnowledgeEntry.relatedProducts && selectedKnowledgeEntry.relatedProducts.length > 0 && (
                          <div className="pt-4 border-t">
                            <h4 className="text-sm font-medium mb-2">Related Products</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedKnowledgeEntry.relatedProducts.map((product, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {product}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Source: {selectedKnowledgeEntry.sourceDocument}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto">
                    {loadingKnowledge ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredKnowledge.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No knowledge entries found</p>
                        <p className="text-sm">Knowledge base is being populated</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {filteredKnowledge.map((entry) => {
                          const Icon = CATEGORY_ICONS[entry.category] || FileText;
                          return (
                            <Card 
                              key={entry.id} 
                              className="cursor-pointer hover:border-primary/50 transition-colors"
                              onClick={() => setSelectedKnowledgeEntry(entry)}
                              data-testid={`knowledge-entry-${entry.id}`}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                                      <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {CATEGORY_LABELS[entry.category] || entry.category}
                                    </Badge>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <CardTitle className="text-base mt-3">{entry.title}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {entry.summary}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {entry.tags?.slice(0, 3).map((tag, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {entry.tags && entry.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{entry.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : !selectedConversationId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 mx-auto">
                    <Bot className="h-10 w-10 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold" data-testid="text-welcome-title">
                    Meet Diane, Your Dietician Specialist
                  </h1>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    I'm here to guide you through your nutritional journey with expertise in candida diet, ketogenic nutrition, 
                    Gerson therapy, and the teachings of Dr. Joel Wallach and Barbara O'Neil. How may I assist you today?
                  </p>
                </div>

                <Card className="bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Info className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-cyan-800 dark:text-cyan-200 mb-1">
                          British Expertise, Heartfelt Care
                        </p>
                        <p className="text-cyan-700/80 dark:text-cyan-300/80">
                          Diane combines proper British intellect with passionate advocacy for natural healing. 
                          She's well-versed in the dangers of GMOs, pesticides, and industrial food processing.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-center">Try asking about:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {SAMPLE_QUESTIONS.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start text-left h-auto py-3 px-4 gap-2"
                        onClick={() => handleSampleQuestion(question)}
                        data-testid={`button-sample-question-${index}`}
                      >
                        <Sparkles className="h-4 w-4 shrink-0 text-cyan-500" />
                        <span className="text-sm">{question}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-cyan-100 dark:border-cyan-900/50">
                  <form onSubmit={handleSubmit} className="w-full flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask Diane about nutrition, diets, or healing protocols..."
                      disabled={isStreaming}
                      className="flex-1 bg-background/50 backdrop-blur-sm border-cyan-200 dark:border-cyan-800"
                      data-testid="input-message-welcome"
                    />
                    <Button 
                      type="submit" 
                      disabled={!inputMessage.trim() || isStreaming}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                      data-testid="button-send-message-welcome"
                    >
                      {isStreaming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Diane provides educational information only. Always consult with your practitioner.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-gradient-to-br from-cyan-400 to-blue-600">
                    <AvatarFallback className="bg-transparent text-white">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">Diane the Dietician</h3>
                    <p className="text-xs text-muted-foreground">
                      {currentConversation?.title || "Conversation"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Powered
                </Badge>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-4" style={{ overscrollBehavior: 'contain' }}>
                <div className="max-w-3xl mx-auto space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 && !isStreaming ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Start your conversation with Diane</p>
                      <p className="text-sm">Ask about nutrition, healing protocols, or clean eating</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.role === "user" ? "justify-end" : "justify-start"
                          }`}
                          data-testid={`message-${message.role}-${message.id}`}
                        >
                          {message.role === "assistant" && (
                            <Avatar className="h-8 w-8 shrink-0 bg-gradient-to-br from-cyan-400 to-blue-600">
                              <AvatarFallback className="bg-transparent text-white text-xs">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          {message.role === "user" && (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback>You</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}

                      {isStreaming && streamingContent && (
                        <div className="flex gap-3 justify-start">
                          <Avatar className="h-8 w-8 shrink-0 bg-gradient-to-br from-cyan-400 to-blue-600">
                            <AvatarFallback className="bg-transparent text-white text-xs">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted">
                            <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                          </div>
                        </div>
                      )}

                      {isStreaming && !streamingContent && (
                        <div className="flex gap-3 justify-start">
                          <Avatar className="h-8 w-8 shrink-0 bg-gradient-to-br from-cyan-400 to-blue-600">
                            <AvatarFallback className="bg-transparent text-white text-xs">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Diane is thinking...</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask Diane about nutrition, diets, or healing protocols..."
                    disabled={isStreaming}
                    className="flex-1"
                    data-testid="input-message"
                  />
                  <Button 
                    type="submit" 
                    disabled={!inputMessage.trim() || isStreaming}
                    data-testid="button-send-message"
                  >
                    {isStreaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Diane provides educational information only. Always consult with your practitioner.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
