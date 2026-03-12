'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Beaker, 
  Calendar, 
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  Download
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ConversationData {
  id: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  peptide: {
    id: string;
    name: string;
    discoveryYear: string;
    era: string;
    personaTrait: string;
    imageUrl: string;
  };
  messages: Message[];
}

export default function ConversationViewer({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/conversations/${conversationId}`);
      
      if (!res.ok) {
        throw new Error('Failed to load conversation');
      }
      
      const data = await res.json();
      setConversation(data.conversation);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadConversation = () => {
    if (!conversation) return;
    
    const transcript = conversation.messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversation.user.name}-${conversation.peptide.name}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading conversation...</div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Conversation not found'}</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="glass border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 rounded-lg hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Conversation Details
                </h1>
                <p className="text-sm text-slate-400">Admin View</p>
              </div>
            </div>
            <button
              onClick={downloadConversation}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              Download Transcript
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Conversation Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 border border-slate-800 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Info */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                User Information
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">{conversation.user.name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>{conversation.user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Joined {new Date(conversation.user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Peptide Info */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Beaker className="w-5 h-5 text-purple-400" />
                Peptide Information
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <Beaker className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">{conversation.peptide.name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Sparkles className="w-4 h-4 text-slate-500" />
                  <span>{conversation.peptide.personaTrait}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Discovered {conversation.peptide.discoveryYear} • {conversation.peptide.era}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conversation Stats */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">{conversation.messages.length} messages</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-slate-400">
                  Started {new Date(conversation.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6 border border-slate-800"
        >
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            Full Conversation
          </h2>
          <div className="space-y-4">
            {conversation.messages.map((msg, i) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start gap-2 max-w-[85%]">
                  <div
                    className={`flex-1 rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                        : 'bg-slate-900/50 border border-slate-800 text-slate-200'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1 text-xs text-cyan-400">
                        <Beaker className="w-3 h-3" />
                        {conversation.peptide.name}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(msg.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(msg.content, i)}
                    className="p-2 rounded-lg glass hover:bg-slate-700 transition flex-shrink-0 mt-1"
                    title="Copy message"
                  >
                    {copiedIndex === i ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
