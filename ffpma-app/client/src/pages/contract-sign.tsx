import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  ClipboardSignature, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  FileText,
  ExternalLink,
  ArrowLeft,
  CreditCard
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Contract {
  id: string;
  userId: string;
  clinicId: string | null;
  templateId: string | null;
  signNowDocumentId: string | null;
  embeddedSigningUrl: string | null;
  doctorName: string | null;
  doctorEmail: string | null;
  clinicName: string | null;
  status: string;
  signedAt: string | null;
  createdAt: string;
}

export default function ContractSignPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/contracts/:id/sign");
  const contractId = params?.id;
  const [iframeError, setIframeError] = useState(false);

  const { data: contract, isLoading, error, refetch } = useQuery<Contract>({
    queryKey: ["/api/contracts", contractId],
    enabled: !!contractId,
    retry: 1,
  });

  const refreshUrlMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/contracts/${contractId}/refresh-url`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", contractId] });
      toast({
        title: "URL Refreshed",
        description: "The signing URL has been refreshed. Please try again.",
      });
      setIframeError(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const proceedToPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/doctors/signup", {
        doctorName: contract?.doctorName,
        doctorEmail: contract?.doctorEmail,
        clinicName: contract?.clinicName,
        contractId: contract?.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleIframeError = () => {
    setIframeError(true);
  };

  if (!match || !contractId) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Contract</AlertTitle>
            <AlertDescription>
              No contract ID provided. Please access this page from your doctor signup flow.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="mb-8 h-10 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Contract Not Found</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Unable to load contract details. It may have been removed or you don't have access.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (contract.status === "signed" || contract.status === "completed") {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto border-card-border" data-testid="card-contract-signed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 className="h-20 w-20 text-cyan-500 mb-6" />
              <h2 className="text-2xl font-bold mb-2">Contract Signed!</h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Your doctor agreement has been signed successfully. 
                Complete your registration by proceeding to payment.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg mb-6 text-sm">
                <p className="font-medium">{contract.doctorName}</p>
                <p className="text-muted-foreground">{contract.doctorEmail}</p>
                {contract.clinicName && (
                  <p className="text-muted-foreground">{contract.clinicName}</p>
                )}
              </div>
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg mb-6">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4" />
                  Doctor Clinic Package - $5,000
                </h4>
                <p className="text-sm text-muted-foreground">
                  This includes your unique clinic URL, member management dashboard, 
                  and access to wholesale pricing for your patients.
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => proceedToPaymentMutation.mutate()}
                  disabled={proceedToPaymentMutation.isPending}
                  data-testid="button-proceed-payment"
                >
                  {proceedToPaymentMutation.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Proceed to Payment
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/dashboard")} 
                  data-testid="button-go-dashboard"
                >
                  Pay Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/doctor-signup")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardSignature className="h-6 w-6" />
                Sign Your Agreement
              </h1>
              <p className="text-muted-foreground">
                {contract.doctorName} - Doctor Agreement
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contract.embeddedSigningUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(contract.embeddedSigningUrl!, "_blank")}
                data-testid="button-open-external"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </Button>
            )}
          </div>
        </div>

        {iframeError ? (
          <Card className="border-card-border" data-testid="card-iframe-error">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to Load Signing Page</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                The embedded signing page couldn't be loaded. This may be due to an expired link or browser security settings.
              </p>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => refreshUrlMutation.mutate()}
                  disabled={refreshUrlMutation.isPending}
                  data-testid="button-refresh-url"
                >
                  {refreshUrlMutation.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh Link
                </Button>
                {contract.embeddedSigningUrl && (
                  <Button
                    onClick={() => window.open(contract.embeddedSigningUrl!, "_blank")}
                    data-testid="button-open-new-tab"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : contract.embeddedSigningUrl ? (
          <Card className="border-card-border overflow-hidden" data-testid="card-signing-iframe">
            <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>SignNow Document - {contract.doctorName}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshUrlMutation.mutate()}
                disabled={refreshUrlMutation.isPending}
                data-testid="button-refresh-inline"
              >
                <RefreshCw className={`h-4 w-4 ${refreshUrlMutation.isPending ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <iframe
              src={contract.embeddedSigningUrl}
              className="w-full h-[700px] border-0"
              title="SignNow Document Signing"
              allow="camera; microphone"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
              onError={handleIframeError}
              data-testid="iframe-signing"
            />
          </Card>
        ) : (
          <Card className="border-card-border" data-testid="card-no-url">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Signing URL Not Available</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                A signing link couldn't be generated. Check your email at{" "}
                <span className="font-medium">{contract.doctorEmail}</span> for the signing invitation,
                or contact support if you need assistance.
              </p>
              <Button
                variant="outline"
                onClick={() => refreshUrlMutation.mutate()}
                disabled={refreshUrlMutation.isPending}
                data-testid="button-try-generate"
              >
                {refreshUrlMutation.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Try to Generate Link
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-sm text-muted-foreground text-center">
          <p>
            Having trouble? Contact <a href="mailto:support@forgottenformula.com" className="text-primary underline">support@forgottenformula.com</a> for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
