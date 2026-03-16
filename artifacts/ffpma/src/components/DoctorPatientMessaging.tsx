import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Phone, Video, Upload } from "lucide-react";
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

interface Member {
  id: string | number;
  name: string;
  email: string;
  status: string;
}

interface MembersResponse {
  members: Member[];
}

interface DoctorPatientMessagingProps {
  doctorId?: string;
  preselectedPatientId?: string;
}

export function DoctorPatientMessaging({ doctorId, preselectedPatientId }: DoctorPatientMessagingProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(preselectedPatientId || null);
  const [messageText, setMessageText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preselectedPatientId) {
      setSelectedPatientId(preselectedPatientId);
    }
  }, [preselectedPatientId]);

  const { data: membersData } = useQuery<MembersResponse>({
    queryKey: ['/api/doctor/members'],
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ['/api/doctor/messages', selectedPatientId],
    enabled: !!selectedPatientId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedPatientId) throw new Error("No patient selected");
      const res = await apiRequest("POST", `/api/doctor/messages/${selectedPatientId}`, {
        messageText: text
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/messages', selectedPatientId] });
      setMessageText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error Sending Message",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText);
  };

  const selectedMember = membersData?.members?.find(m => m.id.toString() === selectedPatientId);

  return (
    <Card className="bg-black/20 border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            Patient Messaging
          </h2>
          <p className="text-white/60 text-sm mt-1">Secure communication with your patients</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3 max-h-[500px] overflow-y-auto pr-2">
          <h3 className="font-medium text-white/80 mb-3">Your Patients</h3>
          {membersData?.members?.map((member) => (
            <div 
              key={member.id} 
              onClick={() => setSelectedPatientId(member.id.toString())}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedPatientId === member.id.toString() ? "bg-blue-500/20 border border-blue-500/50" : "bg-white/5 hover:bg-white/10 border border-white/5"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{member.name || member.email}</span>
              </div>
              <p className="text-sm text-white/60 truncate capitalize">{member.status}</p>
            </div>
          ))}
          {!membersData?.members?.length && (
             <div className="text-center p-4 text-white/50 text-sm">No patients found.</div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col h-[500px] rounded-xl bg-white/5 p-4 border border-white/10">
          {selectedPatientId ? (
            <>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold">
                    {selectedMember?.name?.substring(0,2).toUpperCase() || "PT"}
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedMember?.name || "Patient"}
                    </p>
                    <p className="text-xs text-white/50">Secure Thread</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" title="Voice call — coming soon" className="text-white/30">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Video call — coming soon" className="text-white/30">
                    <Video className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {!messages || messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-white/40 text-sm">
                    No messages in this conversation yet. Send a message to start.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isDoctor = msg.senderId === doctorId || msg.senderRole === "doctor";
                    return (
                      <div key={msg.id} className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${isDoctor ? 'bg-cyan-500/20 text-white' : 'bg-white/10'}`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs text-white/40 mt-1 text-right">
                            {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/10">
                <Button variant="ghost" size="sm" className="hidden sm:flex text-white/50" title="Attachments — coming in Phase 2">
                  <Upload className="w-4 h-4" />
                </Button>
                <Input 
                  placeholder="Type your message..." 
                  className="flex-1 bg-white/5 border-white/10"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                />
                <Button 
                  className="bg-cyan-500 hover:bg-cyan-600"
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending || !messageText.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-white/40">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Select a patient to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
