import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Clinic } from "@shared/schema";
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ClipboardSignature,
  Shield,
  Heart,
  Users,
  RefreshCw,
  Sparkles,
  Building2,
  MapPin,
  Globe,
  BadgeDollarSign,
  UserCheck,
} from "lucide-react";


const memberOnboardingSchema = z.object({
  clinicId: z.string().min(1, "Please select a clinic"),
  memberName: z.string().min(2, "Name must be at least 2 characters"),
  memberEmail: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
});

type MemberOnboardingForm = z.infer<typeof memberOnboardingSchema>;

interface SignNowStatus {
  configured: boolean;
  connected?: boolean;
  error?: string;
}

interface AgreementResult {
  documentId: string;
  signingUrl: string;
  contractId: string;
  contractUrl: string;
}

export default function MemberOnboardingPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [agreementError, setAgreementError] = useState<string>("");

  const form = useForm<MemberOnboardingForm>({
    resolver: zodResolver(memberOnboardingSchema),
    defaultValues: {
      clinicId: "",
      memberName: "",
      memberEmail: "",
      phone: "",
    },
  });

  const { data: clinics } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  const activeClinics = (clinics || []).filter(c => c.pmaStatus === "active");
  const selectedClinicId = form.watch("clinicId");
  const selectedClinic = activeClinics.find(c => c.id === selectedClinicId);

  const { data: signNowStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<SignNowStatus>({
    queryKey: ["/api/signnow/status"],
    retry: 1,
  });

  const createAgreementMutation = useMutation({
    mutationFn: async (data: MemberOnboardingForm) => {
      const response = await fetch("/api/signnow/member-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberName: data.memberName,
          memberEmail: data.memberEmail,
          clinicId: data.clinicId,
        }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to create agreement" }));
        throw new Error(error.error || "Failed to create agreement");
      }
      return response.json() as Promise<AgreementResult>;
    },
    onSuccess: (data) => {
      setAgreementError("");
      toast({
        title: "Unified Contract Created",
        description: "Redirecting you to sign your membership contract...",
      });
      if (data.contractId) {
        setLocation(`/contracts/${data.contractId}/sign`);
      }
    },
    onError: (error: Error) => {
      setAgreementError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    setAgreementError("");
    createAgreementMutation.mutate(data);
  });

  if (statusLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="mb-8 h-10 w-64" />
          <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
        </div>
      </div>
    );
  }

  if (!signNowStatus?.configured) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto border-card-border" data-testid="card-signnow-unavailable">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">E-Signature System Unavailable</h2>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                The e-signature system is not currently configured. Please contact an administrator.
              </p>
              <Button onClick={() => refetchStatus()} variant="outline" data-testid="button-retry-status">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-5"
          style={{ backgroundImage: `url('/assets/allio_hero_banner_landscape.png')` }}
        />
        <div className="container relative mx-auto px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Begin Your Healing Journey</span>
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight" data-testid="heading-member-onboarding">
            Join <span className="text-primary">Allio</span>
          </h1>
          <p className="mb-2 text-xl font-medium text-foreground">
            Member Onboarding
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Welcome to the Forgotten Formula PMA family. By signing the Unified Membership Contract, you'll become a member of both the Mother PMA and your selected Affiliated Clinic Association — all in one simple step.
          </p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto mb-6">
          <Alert className="border-cyan-500/30 bg-cyan-500/5" data-testid="alert-pma-notice">
            <Shield className="h-4 w-4 text-cyan-400" />
            <AlertDescription className="text-sm">
              You are joining the Forgotten Formula Private Membership Association (PMA) network, operating within the private domain under the protections afforded by the First Amendment (freedom of association) and Fourteenth Amendment (equal protection and liberty interests) of the United States Constitution. The Association does not concede that public regulations, statutes, or licensing requirements governing the delivery of services in the public domain apply to private association activities. Your Unified Membership Contract enrolls you in both the Mother PMA and your chosen Affiliated Clinic Association simultaneously.
            </AlertDescription>
          </Alert>
          <Alert className="border-emerald-500/30 bg-emerald-500/5 mt-3" data-testid="alert-portability-notice">
            <Globe className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-sm">
              Your membership is portable nationwide — you can access services at any Affiliated Clinic Association in the FFPMA network without requiring a separate membership application or additional enrollment fee.
            </AlertDescription>
          </Alert>
        </div>

        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
              1
            </div>
            <span className="hidden sm:inline">Select Clinic</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
              2
            </div>
            <span className="hidden sm:inline">Your Info</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
              3
            </div>
            <span className="hidden sm:inline">Sign Unified Contract</span>
          </div>
        </div>

        <Form {...form}>
          <Card className="max-w-2xl mx-auto border-card-border mb-6" data-testid="card-clinic-selector">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Select Your Clinic
              </CardTitle>
              <CardDescription>
                Choose the clinic you'd like to join — your Unified Membership Contract will enroll you in both the Forgotten Formula Mother PMA and this clinic's Affiliated Clinic Association
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="clinicId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Affiliated Clinic Association *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-clinic">
                          <SelectValue placeholder="Select a clinic..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeClinics.map((clinic) => (
                          <SelectItem key={clinic.id} value={clinic.id} data-testid={`option-clinic-${clinic.id}`}>
                            {clinic.name} {clinic.doctorName ? `-- Dr. ${clinic.doctorName}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedClinic && (
                <Card className="mt-4 border-cyan-500/20 bg-cyan-500/5" data-testid="card-selected-clinic-details">
                  <CardContent className="pt-4 pb-4 space-y-2">
                    {selectedClinic.pmaName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="font-medium" data-testid="text-selected-pma-name">{selectedClinic.pmaName}</span>
                      </div>
                    )}
                    {selectedClinic.parentPmaId && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span data-testid="text-selected-parent-pma">Forgotten Formula PMA (Parent)</span>
                      </div>
                    )}
                    {(selectedClinic.city || selectedClinic.state) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span data-testid="text-selected-clinic-location">
                          {[selectedClinic.address, selectedClinic.city, selectedClinic.state].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card className="max-w-2xl mx-auto border-card-border" data-testid="card-member-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Member Information
              </CardTitle>
              <CardDescription>
                Please provide your details to begin your membership. A one-time $10.00 fee covers your lifetime enrollment in both the Mother PMA and your Affiliated Clinic Association.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agreementError && (
                <Alert variant="destructive" className="mb-6" data-testid="alert-agreement-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{agreementError}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="memberName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John Smith" 
                            data-testid="input-member-name"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="memberEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="member@example.com" 
                            data-testid="input-member-email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="(555) 123-4567" 
                          data-testid="input-phone"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Alert className="border-amber-500/30 bg-amber-500/5" data-testid="alert-fee-notice">
                  <BadgeDollarSign className="h-4 w-4 text-amber-400" />
                  <AlertDescription className="text-sm">
                    One-time membership fee: <strong>$10.00</strong> — this single fee covers your lifetime enrollment in both the Forgotten Formula Mother PMA and your selected Affiliated Clinic Association. No additional enrollment fee, no annual renewal fees, no recurring obligations.
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30" data-testid="card-agreement-acknowledgments">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    Membership Acknowledgments
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    By proceeding, you acknowledge the following:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-5">
                    <li>I acknowledge that all individuals present within any Affiliated Clinic Association's facilities — including members, clients, staff, practitioners, and visitors — must be active, signed members of the Forgotten Formula PMA network.</li>
                    <li>The Unified Membership Contract requires three signatures: (1) myself as the Member, (2) the Trustee representing the Mother PMA, and (3) the Clinic Representative at my selected Affiliated Clinic Association.</li>
                    <li>My membership is portable nationwide — I may access services at any Affiliated Clinic Association location within the FFPMA network without requiring a separate membership application or additional enrollment fee.</li>
                    <li>I am joining voluntarily, have not been coerced, and freely exercise my constitutional right of association.</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={createAgreementMutation.isPending}
                    data-testid="button-continue"
                  >
                    {createAgreementMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creating Unified Contract...
                      </>
                    ) : (
                      <>
                        Continue to Sign Unified Contract
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </Form>

        <div className="mt-12 grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          <Card className="border-card-border" data-testid="card-benefit-security">
            <CardContent className="pt-6 text-center">
              <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Constitutional Protection</h4>
              <p className="text-sm text-muted-foreground">
                Your membership operates within the private domain under the First Amendment (freedom of association) and Fourteenth Amendment (equal protection and liberty interests) of the U.S. Constitution.
              </p>
            </CardContent>
          </Card>
          <Card className="border-card-border" data-testid="card-benefit-community">
            <CardContent className="pt-6 text-center">
              <Globe className="h-10 w-10 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Nationwide Network</h4>
              <p className="text-sm text-muted-foreground">
                One Unified Membership Contract gives you lifetime access to the entire FFPMA network. Visit any Affiliated Clinic Association, anywhere in the country.
              </p>
            </CardContent>
          </Card>
          <Card className="border-card-border" data-testid="card-benefit-signature">
            <CardContent className="pt-6 text-center">
              <ClipboardSignature className="h-10 w-10 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Three-Party Contract</h4>
              <p className="text-sm text-muted-foreground">
                Your Unified Membership Contract is signed by you, the Mother PMA Trustee, and your Clinic Representative — ensuring accountability and trust.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
