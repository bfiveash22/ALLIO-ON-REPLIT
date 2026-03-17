import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  AlertTriangle,
  ExternalLink,
  UserPlus,
  FileSignature,
  CreditCard,
  Globe,
  Loader2,
  ArrowLeft,
  Copy,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MemberLookupResult {
  found: boolean;
  message?: string;
  member?: {
    id: string | null;
    userId: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    status: string | null;
    enrolledAt: string | null;
    doctorCode: string | null;
  };
  verification?: {
    contractSigned: boolean;
    paymentComplete: boolean;
    wpAccountActive: boolean;
    enrollmentExists: boolean;
    profileExists: boolean;
  };
  fullyVerified?: boolean;
}

interface EnrollMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signupUrl: string | null;
}

type ModalStep = "contract-check" | "lookup" | "results";

export function EnrollMemberModal({ open, onOpenChange, signupUrl }: EnrollMemberModalProps) {
  const [step, setStep] = useState<ModalStep>("contract-check");
  const [showContractWarning, setShowContractWarning] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResult, setLookupResult] = useState<MemberLookupResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const lookupMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await fetch("/api/doctor/member-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("Lookup failed");
      return res.json() as Promise<MemberLookupResult>;
    },
    onSuccess: (data) => {
      setLookupResult(data);
      setStep("results");
    },
    onError: () => {
      toast({ title: "Lookup Failed", description: "Could not look up this member. Please try again.", variant: "destructive" });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!lookupResult?.member) throw new Error("No member data");
      const res = await fetch("/api/doctor/member-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          memberId: lookupResult.member.id,
          memberEmail: lookupResult.member.email,
          memberName: lookupResult.member.name,
        }),
      });
      if (!res.ok) throw new Error("Failed to add member");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Member Added", description: "This member has been added to your member roster." });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/members"] });
      handleClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Could not add member. Please try again.", variant: "destructive" });
    },
  });

  const handleClose = () => {
    setStep("contract-check");
    setShowContractWarning(false);
    setLookupQuery("");
    setLookupResult(null);
    onOpenChange(false);
  };

  const handleLookup = () => {
    if (!lookupQuery.trim()) return;
    lookupMutation.mutate(lookupQuery.trim());
  };

  const copySignupUrl = () => {
    if (signupUrl) {
      navigator.clipboard.writeText(signupUrl);
      toast({ title: "Copied!", description: "Signup URL copied to clipboard" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            Enroll New Member
          </DialogTitle>
          <DialogDescription className="text-white/50">
            {step === "contract-check" && "Verify the member's contract status before proceeding."}
            {step === "lookup" && "Enter the member's email address, user ID, or profile URL to look up their status."}
            {step === "results" && "Review the member's enrollment status below."}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "contract-check" && (
            <motion.div
              key="contract-check"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 py-2"
            >
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <FileSignature className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-300">Has this member signed their PMA membership contract?</p>
                    <p className="text-sm text-white/60 mt-1">
                      Members must complete their Private Membership Association contract before being enrolled.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                  onClick={() => setStep("lookup")}
                  data-testid="button-contract-yes"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Yes, Contract Signed
                </Button>
                <Button
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                  onClick={() => setShowContractWarning(true)}
                  data-testid="button-contract-no"
                  variant="outline"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  No
                </Button>
              </div>

              <AnimatePresence>
                {showContractWarning && (
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-300 text-sm">Contract Required</p>
                      <p className="text-sm text-white/60 mt-1">
                        The member must complete their PMA membership contract before they can be added to your member roster. 
                        Share the signup URL below so they can complete the process.
                      </p>
                      {signupUrl && (
                        <div className="mt-3 flex items-center gap-2">
                          <Input
                            value={signupUrl}
                            readOnly
                            className="flex-1 bg-white/5 border-white/10 text-cyan-300 font-mono text-xs"
                          />
                          <Button size="sm" variant="ghost" onClick={copySignupUrl} className="text-white/50 hover:text-white">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {signupUrl && (
                        <Button
                          size="sm"
                          variant="link"
                          className="mt-2 text-cyan-400 hover:text-cyan-300 p-0 h-auto"
                          onClick={() => window.open(signupUrl, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Open Signup Page
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === "lookup" && (
            <motion.div
              key="lookup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-2"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("contract-check")}
                className="text-white/50 hover:text-white p-0 h-auto mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Member User ID, Email, or Profile URL</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. john@example.com or user ID..."
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    data-testid="input-member-lookup"
                  />
                  <Button
                    onClick={handleLookup}
                    disabled={!lookupQuery.trim() || lookupMutation.isPending}
                    className="bg-cyan-500 hover:bg-cyan-600"
                    data-testid="button-lookup"
                  >
                    {lookupMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span className="ml-2">Lookup</span>
                  </Button>
                </div>
                <p className="text-xs text-white/40">
                  Enter the member's email address, user ID, or their profile URL to check their enrollment status.
                </p>
              </div>
            </motion.div>
          )}

          {step === "results" && lookupResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-2"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStep("lookup"); setLookupResult(null); }}
                className="text-white/50 hover:text-white p-0 h-auto mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Search
              </Button>

              {!lookupResult.found ? (
                <Card className="bg-red-500/10 border-red-500/20 p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-300">Member Not Found</p>
                      <p className="text-sm text-white/60 mt-1">{lookupResult.message}</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <>
                  <Card className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-sm">
                        {lookupResult.member?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-bold">{lookupResult.member?.name}</p>
                        <p className="text-sm text-white/50">{lookupResult.member?.email}</p>
                      </div>
                    </div>
                    {lookupResult.member?.phone && (
                      <p className="text-sm text-white/60">Phone: {lookupResult.member.phone}</p>
                    )}
                  </Card>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white/70">Verification Status</p>
                    <div className="grid grid-cols-1 gap-2">
                      <StatusRow
                        label="Contract Signed"
                        icon={FileSignature}
                        verified={lookupResult.verification?.contractSigned || false}
                      />
                      <StatusRow
                        label="Payment Complete"
                        icon={CreditCard}
                        verified={lookupResult.verification?.paymentComplete || false}
                      />
                      <StatusRow
                        label="WordPress Account Active"
                        icon={Globe}
                        verified={lookupResult.verification?.wpAccountActive || false}
                      />
                    </div>
                  </div>

                  {lookupResult.fullyVerified ? (
                    <div className="space-y-3">
                      <Card className="bg-emerald-500/10 border-emerald-500/20 p-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          <p className="text-sm font-medium text-emerald-300">Fully Verified — Ready to Add</p>
                        </div>
                      </Card>
                      <Button
                        className="w-full bg-cyan-500 hover:bg-cyan-600"
                        onClick={() => addMemberMutation.mutate()}
                        disabled={addMemberMutation.isPending}
                        data-testid="button-confirm-add"
                      >
                        {addMemberMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        Confirm & Add to My Members
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Card className="bg-red-500/10 border-red-500/20 p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-300">Cannot Add — Verification Incomplete</p>
                            <p className="text-xs text-white/60 mt-1">
                              This member must complete all verification steps before they can be added to your member roster. 
                              Please share the signup URL so they can complete the remaining steps.
                            </p>
                            {signupUrl && (
                              <div className="mt-3 flex items-center gap-2">
                                <Input
                                  value={signupUrl}
                                  readOnly
                                  className="flex-1 bg-white/5 border-white/10 text-cyan-300 font-mono text-xs"
                                />
                                <Button size="sm" variant="ghost" onClick={copySignupUrl} className="text-white/50 hover:text-white">
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function StatusRow({ label, icon: Icon, verified }: { label: string; icon: React.ElementType; verified: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-white/50" />
        <span className="text-sm">{label}</span>
      </div>
      {verified ? (
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      ) : (
        <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      )}
    </div>
  );
}
