import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LegalDoc {
  title: string;
  slug: string;
  lastUpdated: string;
  content: string;
}

function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function renderMarkdown(md: string): string {
  const sanitized = sanitizeText(md);
  return sanitized
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-cyan-400 mb-6 text-center">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-cyan-300 mt-10 mb-4">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-amber-400 mt-6 mb-3">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="text-white/75 ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="text-white/75 ml-4 list-decimal">$2</li>')
    .replace(/^---$/gm, '<hr class="border-white/10 my-6">')
    .replace(/^_(.+)_$/gm, '<p class="text-white/50 italic">$1</p>')
    .replace(/^(?!&lt;[h|l|p|u|o|s|d])((?!^$).+)$/gm, '<p class="text-white/80 leading-relaxed mb-3">$1</p>');
}

export default function LegalDocument() {
  const [, params] = useRoute("/legal/:slug");
  const slug = params?.slug || "";

  const { data: doc, isLoading, error } = useQuery<LegalDoc>({
    queryKey: [`/api/legal/documents/${slug}`],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-white/60">Loading document...</div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-black/40 border-white/10 max-w-md">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-white/30" />
            <h2 className="text-xl font-bold text-white mb-2">Document Not Found</h2>
            <p className="text-white/60 mb-6">The requested legal document could not be found.</p>
            <Link href="/">
              <Button variant="outline" className="border-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="text-white/60 hover:text-white gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-white/40">
              <Calendar className="w-4 h-4" />
              Last updated: {doc.lastUpdated}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <Card className="bg-black/30 border-white/10">
          <CardContent className="p-8 md:p-12">
            <div
              className="space-y-1"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.content) }}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
