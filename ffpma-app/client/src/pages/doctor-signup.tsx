import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ArrowLeft,
  ClipboardSignature,
  Shield,
  Users,
  Stethoscope,
  RefreshCw,
  Sparkles
} from "lucide-react";


const doctorSignupSchema = z.object({
  doctorName: z.string().min(2, "Name must be at least 2 characters"),
  doctorEmail: z.string().email("Please enter a valid email"),
  clinicId: z.number().optional(),
  clinicName: z.string().optional(),
  licenseNumber: z.string().optional(),
  specialization: z.string().optional(),
  phone: z.string().optional(),
  templateId: z.string().optional(),
});

type DoctorSignupForm = z.infer<typeof doctorSignupSchema>;

interface SignNowStatus {
  configured: boolean;
  environment: string;
  connected?: boolean;
  user?: { email: string };
  error?: string;
}

interface Clinic {
  id: string;
  wpClinicId: number | null;
  name: string;
  signNowTemplateId: string | null;
}

interface AgreementResult {
  documentId: string;
  signingUrl: string;
  contractId: string;
  contractUrl: string;
}

export default function DoctorSignupPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [step, setStep] = useState<"info" | "signing">("info");
  const [signingUrl, setSigningUrl] = useState<string>("");
  const [documentId, setDocumentId] = useState<string>("");
  const [contractId, setContractId] = useState<string>("");
  const [agreementError, setAgreementError] = useState<string>("");
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  const form = useForm<DoctorSignupForm>({
    resolver: zodResolver(doctorSignupSchema),
    defaultValues: {
      doctorName: "",
      doctorEmail: "",
      clinicId: undefined,
      clinicName: "",
      licenseNumber: "",
      specialization: "",
      phone: "",
      templateId: "",
    },
  });

  const { data: clinics } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  const { data: signNowStatus, isLoading: statusLoading, error: statusError, refetch: refetchStatus } = useQuery<SignNowStatus>({
    queryKey: ["/api/signnow/status"],
    retry: 1,
  });

  useEffect(() => {
    if (clinics && searchString) {
      const params = new URLSearchParams(searchString);
      const clinicIdParam = params.get("clinic_id");
      if (clinicIdParam) {
        const wpClinicId = parseInt(clinicIdParam, 10);
        const clinic = clinics.find(c => c.wpClinicId === wpClinicId);
        if (clinic) {
          setSelectedClinic(clinic);
          form.setValue("clinicId", wpClinicId);
          form.setValue("clinicName", clinic.name);
          if (clinic.signNowTemplateId) {
            form.setValue("templateId", clinic.signNowTemplateId);
          }
        }
      }
    }
  }, [clinics, searchString, form]);


  const createAgreementMutation = useMutation({
    mutationFn: async (data: DoctorSignupForm) => {
      const response = await fetch("/api/signnow/doctor-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: data.templateId,
          doctorName: data.doctorName,
          doctorEmail: data.doctorEmail,
          clinicName: data.clinicName,
          licenseNumber: data.licenseNumber,
          specialization: data.specialization,
          phone: data.phone,
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
      setDocumentId(data.documentId);
      setContractId(data.contractId);
      setAgreementError("");
      if (data.signingUrl) {
        setSigningUrl(data.signingUrl);
      }
      toast({
        title: "Agreement Created",
        description: "Redirecting you to the signing page...",
      });
      // Redirect to the embedded signing page
      if (data.contractId) {
        setLocation(`/contracts/${data.contractId}/sign`);
      } else {
        setStep("signing");
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

  const handleInfoSubmit = form.handleSubmit((data) => {
    if (!data.doctorName || !data.doctorEmail) {
      return;
    }
    // Directly create the agreement using the default template
    setAgreementError("");
    createAgreementMutation.mutate(data);
  });

  const goBackToInfo = () => {
    setStep("info");
  };

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

  if (statusError || !signNowStatus?.configured) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto border-card-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">E-Signature System Unavailable</h2>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {statusError 
                  ? "Unable to connect to the e-signature service. Please try again later."
                  : "The e-signature system is not currently configured. Please contact an administrator."}
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
            <span className="text-sm font-medium">Join Our Network</span>
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight">
            Join <span className="text-primary">Allio</span> Network
          </h1>
          <p className="mb-2 text-xl font-medium text-foreground">
            Doctor Onboarding
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Join the Forgotten Formula PMA network as a healthcare practitioner.
            Complete your information and sign the doctor agreement to get started.
          </p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className={`flex items-center gap-2 ${step === "info" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === "info" ? "bg-primary text-primary-foreground" : "bg-primary/50 text-primary-foreground"
            }`}>
              {step === "info" ? "1" : <CheckCircle2 className="h-4 w-4" />}
            </div>
            <span className="hidden sm:inline">Your Info</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 ${step === "signing" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === "signing" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}>
              2
            </div>
            <span className="hidden sm:inline">Sign Agreement</span>
          </div>
        </div>

        <Form {...form}>
          {step === "info" && (
            <Card className="max-w-2xl mx-auto border-card-border" data-testid="card-doctor-info">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Practitioner Information
                </CardTitle>
                <CardDescription>
                  Please provide your professional details below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInfoSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="doctorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Dr. Jane Smith" 
                              data-testid="input-doctor-name"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="doctorEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="doctor@example.com" 
                              data-testid="input-doctor-email"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedClinic && searchString?.includes("clinic_id") ? (
                    <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                          <Users className="h-5 w-5 text-cyan-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Signing up for clinic:</p>
                          <p className="font-medium">{selectedClinic.name}</p>
                        </div>
                      </div>
                    </div>
                  ) : clinics && clinics.length > 0 ? (
                    <FormField
                      control={form.control}
                      name="clinicId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Your Clinic (optional)</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              const wpId = parseInt(value, 10);
                              field.onChange(wpId);
                              const clinic = clinics.find(c => c.wpClinicId === wpId);
                              if (clinic) {
                                form.setValue("clinicName", clinic.name);
                                if (clinic.signNowTemplateId) {
                                  form.setValue("templateId", clinic.signNowTemplateId);
                                }
                              }
                            }} 
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-clinic">
                                <SelectValue placeholder="Select your clinic" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clinics.filter(c => c.wpClinicId).map((clinic) => (
                                <SelectItem key={clinic.id} value={clinic.wpClinicId!.toString()}>
                                  {clinic.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="clinicName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clinic/Practice Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Wellness Clinic" 
                              data-testid="input-clinic-name"
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="MD12345" 
                              data-testid="input-license"
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialization</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-specialization">
                              <SelectValue placeholder="Select specialty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="integrative">Integrative Medicine</SelectItem>
                            <SelectItem value="functional">Functional Medicine</SelectItem>
                            <SelectItem value="naturopathic">Naturopathic</SelectItem>
                            <SelectItem value="regenerative">Regenerative Medicine</SelectItem>
                            <SelectItem value="anti-aging">Anti-Aging Medicine</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      data-testid="button-next-step"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {step === "signing" && (
            <Card className="max-w-2xl mx-auto border-card-border" data-testid="card-signing">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardSignature className="h-5 w-5" />
                  Sign Your Agreement
                </CardTitle>
                <CardDescription>
                  Review and electronically sign your doctor agreement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {signingUrl ? (
                  <>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-4">
                        Click the button below to open the secure signing page. You will be able to 
                        review the full agreement and provide your electronic signature.
                      </p>
                      <Button
                        className="w-full"
                        onClick={() => window.open(signingUrl, "_blank")}
                        data-testid="button-open-signing"
                      >
                        Open Signing Page
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">What happens next?</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                          <span>Sign the agreement on the secure SignNow page</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                          <span>You'll receive a copy of the signed agreement via email</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                          <span>Your doctor account will be activated within 24-48 hours</span>
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-16 w-16 text-cyan-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Agreement Created!</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-4">
                      Your doctor agreement has been created. Check your email at{" "}
                      <span className="font-medium">{form.getValues("doctorEmail")}</span>{" "}
                      for the signing link.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Didn't receive the email? Contact support@forgottenformula.com for assistance.
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground text-center border-t pt-4">
                  <p>Document ID: {documentId}</p>
                  <p className="mt-1">
                    Signed as: {form.getValues("doctorName")} ({form.getValues("doctorEmail")})
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </Form>

        <div className="mt-12 grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          <Card className="border-card-border">
            <CardContent className="pt-6 text-center">
              <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Secure E-Signatures</h4>
              <p className="text-sm text-muted-foreground">
                All agreements are signed using SignNow's legally binding e-signature platform.
              </p>
            </CardContent>
          </Card>
          <Card className="border-card-border">
            <CardContent className="pt-6 text-center">
              <Users className="h-10 w-10 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Join Our Network</h4>
              <p className="text-sm text-muted-foreground">
                Connect with other practitioners and access exclusive protocols and training.
              </p>
            </CardContent>
          </Card>
          <Card className="border-card-border">
            <CardContent className="pt-6 text-center">
              <Stethoscope className="h-10 w-10 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Doctor Pricing</h4>
              <p className="text-sm text-muted-foreground">
                Get access to special doctor pricing on all peptides, IV supplies, and more.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
