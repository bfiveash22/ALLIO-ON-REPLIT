import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  Eye,
  Clock,
  Sparkles,
  ChevronRight,
  User,
  BarChart3,
} from "lucide-react";

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
}

interface DianeAnalytics {
  totalConversations: number;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  averageMessagesPerConversation: number;
  conversationsByDay: Record<string, number>;
  uniqueUsers: number;
}

export default function AdminDianePage() {
  const [selectedConversation, setSelectedConversation] = useState<DianeConversation | null>(null);

  const { data: analytics, isLoading: loadingAnalytics } = useQuery<DianeAnalytics>({
    queryKey: ["/api/admin/diane/analytics"],
  });

  const { data: conversations = [], isLoading: loadingConversations } = useQuery<DianeConversation[]>({
    queryKey: ["/api/admin/diane/conversations"],
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery<DianeMessage[]>({
    queryKey: ["/api/admin/diane/conversations", selectedConversation?.id, "messages"],
    enabled: !!selectedConversation,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-500/10">
              <Bot className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                Diane AI Monitor
              </h1>
              <p className="text-muted-foreground">
                Track and monitor all AI dietician conversations
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-conversations">
                {analytics?.totalConversations || 0}
              </div>
              <p className="text-xs text-muted-foreground">All-time conversations with Diane</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-messages">
                {analytics?.totalMessages || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics?.userMessages || 0} user / {analytics?.assistantMessages || 0} Diane
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-unique-users">
                {analytics?.uniqueUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Members using Diane AI</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Messages/Conv</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-avg-messages">
                {analytics?.averageMessagesPerConversation || 0}
              </div>
              <p className="text-xs text-muted-foreground">Messages per conversation</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Recent Conversations
                </CardTitle>
                <CardDescription>
                  Click to view conversation details
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[500px]">
                  <div className="px-4 space-y-1">
                    {loadingConversations ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading conversations...
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No conversations yet</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedConversation?.id === conv.id
                              ? "bg-primary/10 border border-primary/20"
                              : "hover-elevate"
                          }`}
                          onClick={() => setSelectedConversation(conv)}
                          data-testid={`admin-conversation-${conv.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{conv.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  <User className="h-3 w-3 mr-1" />
                                  {conv.userName || "Anonymous"}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground shrink-0">
                              {formatDate(conv.updatedAt)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Conversation Details
                </CardTitle>
                <CardDescription>
                  {selectedConversation 
                    ? `Viewing: ${selectedConversation.title}` 
                    : "Select a conversation to view details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                {!selectedConversation ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Select a conversation from the left panel</p>
                      <p className="text-sm">to view the full message history</p>
                    </div>
                  </div>
                ) : loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Loading messages...
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] px-4">
                    <div className="space-y-4 pb-4">
                      <div className="p-3 rounded-lg bg-muted/50 text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{selectedConversation.userName || "Anonymous"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Started {formatDate(selectedConversation.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{messages.length} messages</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.role === "user" ? "justify-end" : "justify-start"
                          }`}
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
                            <p className="text-xs opacity-60 mt-1">
                              {formatDate(message.createdAt)}
                            </p>
                          </div>
                          {message.role === "user" && (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
