import { useState, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Award, CheckCircle2, XCircle, Search, Shield, ArrowLeft } from "lucide-react";

interface VerificationResult {
  success: boolean;
  valid?: boolean;
  certification?: {
    certificateNumber: string;
    referenceTitle: string;
    issuedAt: string;
    status: string;
    score: number;
  };
  error?: string;
}

export default function VerifyCertificatePage() {
  const [, params] = useRoute("/verify/:code");
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastSearchedCode, setLastSearchedCode] = useState<string | null>(null);

  const codeFromUrl = params?.code;

  const verify = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setLastSearchedCode(code.trim());
    try {
      const res = await fetch(`/api/certifications/verify/${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: "Unable to verify. Please try again." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (codeFromUrl && codeFromUrl !== lastSearchedCode) {
      verify(codeFromUrl);
    }
  }, [codeFromUrl, lastSearchedCode, verify]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <Shield className="h-8 w-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Certificate Verification</h1>
          <p className="text-slate-400 text-sm">Forgotten Formula Private Member Association</p>
        </div>

        <Card className="border-white/10 bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg text-white">Verify a Practitioner's Credential</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter verification code"
                value={manualCode || codeFromUrl || ""}
                onChange={(e) => setManualCode(e.target.value)}
                className="bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
                onKeyDown={(e) => e.key === "Enter" && verify(manualCode || codeFromUrl || "")}
              />
              <Button
                onClick={() => verify(manualCode || codeFromUrl || "")}
                disabled={loading}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {hasSearched && result && (
              <div className="mt-4">
                {result.success && result.valid ? (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                      <span className="text-emerald-400 font-semibold">Valid Certificate</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Certificate</span>
                        <span className="text-white font-medium">{result.certification?.certificateNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Credential</span>
                        <span className="text-white font-medium">{result.certification?.referenceTitle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Score</span>
                        <span className="text-white font-medium">{result.certification?.score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Issued</span>
                        <span className="text-white font-medium">
                          {result.certification?.issuedAt
                            ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(result.certification.issuedAt))
                            : "—"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-400" />
                      <span className="text-xs text-slate-400">Verified by Forgotten Formula PMA</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
                      <div>
                        <span className="text-red-400 font-semibold block">Not Found</span>
                        <span className="text-slate-400 text-sm">
                          {result.error || "No valid certificate matches this code."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a href="/" className="text-cyan-400 hover:text-cyan-300 text-sm inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Back to Forgotten Formula PMA
          </a>
        </div>
      </div>
    </div>
  );
}
