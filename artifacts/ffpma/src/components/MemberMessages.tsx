import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Mail, MailOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  senderId: string;
  senderRole: string;
  senderName: string | null;
  recipientId: string;
  recipientRole: string;
  recipientName: string | null;
  content: string;
  readAt: string | null;
  createdAt: string;
}

interface MessagesResponse {
  messages: Message[];
  unreadCount: number;
}

interface DoctorThread {
  id: string;
  name: string;
  lastMessage: Message;
  messageCount: number;
  unread: number;
}

export function MemberMessages() {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messagesData } = useQuery<MessagesResponse>({
    queryKey: ['/api/member/messages'],
    refetchInterval: 10000,
  });

  const messages = messagesData?.messages || [];
  const unreadCount = messagesData?.unreadCount || 0;

  const doctorThreads = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    const otherId = msg.senderRole === "doctor" ? msg.senderId : msg.recipientId;
    if (!acc[otherId]) acc[otherId] = [];
    acc[otherId].push(msg);
    return acc;
  }, {});

  Object.values(doctorThreads).forEach(thread => {
    thread.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  const doctorList: DoctorThread[] = Object.entries(doctorThreads).map(([id, msgs]) => {
    const lastMsg = msgs[msgs.length - 1];
    const name = lastMsg.senderRole === "doctor" ? lastMsg.senderName : lastMsg.recipientName;
    const unread = msgs.filter((m) => m.senderRole === "doctor" && !m.readAt).length;
    return { id, name: name || "Doctor", lastMessage: lastMsg, messageCount: msgs.length, unread };
  });

  const selectedMessages = selectedDoctorId ? (doctorThreads[selectedDoctorId] || []) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages]);

  const markReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await apiRequest("PUT", `/api/member/messages/${messageId}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/member/messages'] });
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedDoctorId) throw new Error("No doctor selected");
      const res = await apiRequest("POST", `/api/member/messages/${selectedDoctorId}`, {
        messageText: text,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/member/messages'] });
      setReplyText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (selectedDoctorId && selectedMessages.length > 0) {
      selectedMessages
        .filter((m) => m.senderRole === "doctor" && !m.readAt)
        .forEach((m) => markReadMutation.mutate(m.id));
    }
  }, [selectedDoctorId]);

  if (messages.length === 0) {
    return (
      <Card className="bg-black/20 border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-lg">Messages from Your Doctor</h3>
        </div>
        <div className="text-center py-8 text-white/40">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No messages yet. Your doctor will reach out here.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-black/20 border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-lg">Messages</h3>
          {unreadCount > 0 && (
            <Badge className="bg-blue-500 text-white border-0">{unreadCount} new</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {doctorList.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoctorId(doc.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedDoctorId === doc.id
                  ? "bg-blue-500/20 border border-blue-500/50"
                  : "bg-white/5 hover:bg-white/10 border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Dr. {doc.name}</span>
                {doc.unread > 0 && (
                  <Badge className="bg-blue-500/80 text-white text-[10px] px-1.5 py-0 border-0">
                    {doc.unread}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-white/50 mt-1 truncate">
                {doc.lastMessage.content?.substring(0, 50)}...
              </p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 flex flex-col h-[400px] rounded-xl bg-white/5 p-4 border border-white/10">
          {selectedDoctorId ? (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                {selectedMessages.map((msg) => {
                  const isFromDoctor = msg.senderRole === "doctor";
                  return (
                    <div key={msg.id} className={`flex ${isFromDoctor ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${isFromDoctor ? 'bg-white/10' : 'bg-cyan-500/20'}`}>
                        <p className="text-xs text-white/50 mb-1">
                          {isFromDoctor ? `Dr. ${msg.senderName}` : "You"}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-white/40">
                            {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                          </p>
                          {isFromDoctor && (
                            msg.readAt
                              ? <MailOpen className="w-3 h-3 text-white/30" />
                              : <Mail className="w-3 h-3 text-blue-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <Input
                  placeholder="Reply to your doctor..."
                  className="flex-1 bg-white/5 border-white/10"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && replyText.trim()) {
                      sendReplyMutation.mutate(replyText);
                    }
                  }}
                />
                <Button
                  className="bg-cyan-500 hover:bg-cyan-600"
                  onClick={() => replyText.trim() && sendReplyMutation.mutate(replyText)}
                  disabled={sendReplyMutation.isPending || !replyText.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-white/40">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
