import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  FileText,
  PenTool,
  RefreshCw,
  CheckCircle2,
  Clock,
  Star,
  Shield,
  Scale,
  Loader2,
  Eye,
  X,
} from "lucide-react";

interface SigningDocument {
  slug: string;
  title: string;
  category: "trademark" | "copyright";
  description: string;
  docType: string;
  content: string;
  legalDocId: string | null;
  signNowDocId: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export function LegalSigningSection() {
  const { toast } = useToast();
  const [selectedDoc, setSelectedDoc] = useState<SigningDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preparingSlug, setPreparingSlug] = useState<string | null>(null);
  const [signingIframeUrl, setSigningIframeUrl] = useState<string | null>(null);
  const [signingDocTitle, setSigningDocTitle] = useState<string>("");

  const { data: signingDocuments = [], refetch } = useQuery<SigningDocument[]>({
    queryKey: ["/api/legal/signing-documents"],
  });

  const prepareMutation = useMutation({
    mutationFn: async (slug: string) => {
      setPreparingSlug(slug);
      const res = await apiRequest("POST", `/api/legal/signing-documents/${slug}/prepare`);
      return res.json();
    },
    onSuccess: (data, slug) => {
      setPreparingSlug(null);
      const doc = signingDocuments.find(d => d.slug === slug);
      if (data.embeddedUrl || data.signingUrl) {
        const url = data.embeddedUrl || data.signingUrl;
        setSigningDocTitle(doc?.title || "Legal Document");
        setSigningIframeUrl(url);
        toast({
          title: "Document ready for signing",
          description: "The signing experience has been loaded below.",
        });
      } else {
        toast({
          title: "Document prepared",
          description: data.message || "Document saved to Legal Documents. SignNow connection may need configuration.",
        });
      }
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/legal/documents"] });
    },
    onError: (error: any) => {
      setPreparingSlug(null);
      toast({
        title: "Error",
        description: error.message || "Failed to prepare document",
        variant: "destructive",
      });
    },
  });

  const prepareAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/legal/signing-documents/prepare-all");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "All documents prepared",
        description: data.message || "Documents are ready for signing.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/legal/documents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to prepare documents",
        variant: "destructive",
      });
    },
  });

  const signingLinkMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiRequest("POST", `/api/legal/signing-documents/${slug}/signing-link`);
      return res.json();
    },
    onSuccess: (data, slug) => {
      const doc = signingDocuments.find(d => d.slug === slug);
      if (data.embeddedUrl || data.signingUrl) {
        const url = data.embeddedUrl || data.signingUrl;
        setSigningDocTitle(doc?.title || "Legal Document");
        setSigningIframeUrl(url);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate signing link",
        variant: "destructive",
      });
    },
  });

  const trademarkDocs = signingDocuments.filter(d => d.category === "trademark");
  const copyrightDocs = signingDocuments.filter(d => d.category === "copyright");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
      case "filed":
        return <Badge className="bg-green-500/20 text-green-300"><CheckCircle2 className="w-3 h-3 mr-1" />Signed</Badge>;
      case "pending_signature":
        return <Badge className="bg-amber-500/20 text-amber-300"><Clock className="w-3 h-3 mr-1" />Pending Signature</Badge>;
      case "review":
        return <Badge className="bg-blue-500/20 text-blue-300"><Eye className="w-3 h-3 mr-1" />In Review</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-300"><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    return category === "trademark"
      ? <Star className="w-5 h-5 text-amber-400" />
      : <Shield className="w-5 h-5 text-indigo-400" />;
  };

  const renderDocumentCard = (doc: SigningDocument) => (
    <div
      key={doc.slug}
      className="p-4 rounded-xl bg-black/20 border border-white/10 hover:border-white/20 transition-all"
      data-testid={`signing-doc-${doc.slug}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          doc.category === "trademark" ? "bg-amber-500/20" : "bg-indigo-500/20"
        }`}>
          {getCategoryIcon(doc.category)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-white">{doc.title}</h4>
            {getStatusBadge(doc.status)}
          </div>
          <p className="text-xs text-white/50 mt-1 line-clamp-2">{doc.description}</p>
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/10 h-8 px-3 text-xs"
              onClick={() => { setSelectedDoc(doc); setPreviewOpen(true); }}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              Preview
            </Button>

            {doc.signNowDocId ? (
              <Button
                size="sm"
                className="bg-indigo-500 hover:bg-indigo-600 h-8 px-3 text-xs"
                onClick={() => signingLinkMutation.mutate(doc.slug)}
                disabled={signingLinkMutation.isPending}
              >
                {signingLinkMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <PenTool className="w-3.5 h-3.5 mr-1" />
                )}
                Review & Sign
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 h-8 px-3 text-xs"
                onClick={() => prepareMutation.mutate(doc.slug)}
                disabled={preparingSlug === doc.slug}
              >
                {preparingSlug === doc.slug ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <PenTool className="w-3.5 h-3.5 mr-1" />
                )}
                Prepare & Sign
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card className="bg-gradient-to-br from-amber-500/5 to-indigo-500/5 border-amber-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <PenTool className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <CardTitle>Legal Documents for Signing</CardTitle>
                <CardDescription>Trademark & copyright documents ready for Trustee signature via SignNow</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-300">{signingDocuments.length} Documents</Badge>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 hover:bg-white/10"
                onClick={() => prepareAllMutation.mutate()}
                disabled={prepareAllMutation.isPending}
              >
                {prepareAllMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Prepare All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {trademarkDocs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Trademark Documents</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {trademarkDocs.map(renderDocumentCard)}
              </div>
            </div>
          )}

          {copyrightDocs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">Copyright Protection Documents</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {copyrightDocs.map(renderDocumentCard)}
              </div>
            </div>
          )}

          {signingDocuments.length === 0 && (
            <div className="text-center py-8">
              <Scale className="w-12 h-12 mx-auto mb-3 text-white/20" />
              <p className="text-white/50">Loading signing documents...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {signingIframeUrl && (
        <Card className="bg-gradient-to-br from-green-500/5 to-cyan-500/5 border-green-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Sign Document</CardTitle>
                  <CardDescription>{signingDocTitle}</CardDescription>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-white/60 hover:text-white"
                onClick={() => {
                  setSigningIframeUrl(null);
                  setSigningDocTitle("");
                  refetch();
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-white/10 bg-white">
              <iframe
                src={signingIframeUrl}
                className="w-full border-0"
                style={{ height: "700px" }}
                title={`Sign: ${signingDocTitle}`}
                allow="camera; microphone"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
            <p className="text-xs text-white/40 mt-2 text-center">
              Complete the signing process above. The document will be automatically updated once signed.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-950 border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDoc && getCategoryIcon(selectedDoc.category)}
              {selectedDoc?.title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono leading-relaxed">
              {selectedDoc?.content}
            </pre>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            {selectedDoc && (
              selectedDoc.signNowDocId ? (
                <Button
                  className="bg-indigo-500 hover:bg-indigo-600"
                  onClick={() => {
                    signingLinkMutation.mutate(selectedDoc.slug);
                    setPreviewOpen(false);
                  }}
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  Review & Sign
                </Button>
              ) : (
                <Button
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={() => {
                    prepareMutation.mutate(selectedDoc.slug);
                    setPreviewOpen(false);
                  }}
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  Prepare & Sign
                </Button>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
