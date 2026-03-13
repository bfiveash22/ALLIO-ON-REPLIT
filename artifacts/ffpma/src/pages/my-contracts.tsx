import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Download,
  ClipboardSignature,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";


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

export default function MyContractsPage() {
  const { data: contracts = [], isLoading, error } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed":
      case "completed":
        return (
          <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100" data-testid="badge-status-signed">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Signed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100" data-testid="badge-status-pending">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100" data-testid="badge-status-expired">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" data-testid="badge-status-default">
            {status}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="mb-8 h-10 w-64" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive" data-testid="card-error">
            <CardContent className="flex items-center gap-4 py-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <h3 className="font-semibold">Error Loading Contracts</h3>
                <p className="text-muted-foreground">Unable to load your contracts. Please try again later.</p>
              </div>
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
        <div className="container relative mx-auto px-4">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Document Management</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3" data-testid="heading-my-contracts">
            <ClipboardSignature className="h-10 w-10" />
            <span className="text-primary">Allio</span> Contracts
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl">
            View and manage your signed agreements and pending contracts.
          </p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">

        {contracts.length === 0 ? (
          <Card className="border-card-border" data-testid="card-no-contracts">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Contracts Yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You don't have any contracts yet. Start your membership journey or doctor onboarding to create your first agreement.
              </p>
              <div className="flex gap-3">
                <Button asChild data-testid="button-member-onboard">
                  <Link href="/member-onboarding">Member Onboarding</Link>
                </Button>
                <Button variant="outline" asChild data-testid="button-doctor-onboard">
                  <Link href="/doctor-signup">Doctor Onboarding</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {contracts.map((contract) => (
              <Card key={contract.id} className="border-card-border" data-testid={`card-contract-${contract.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {contract.clinicName 
                          ? `Doctor Agreement - ${contract.clinicName}`
                          : contract.doctorName 
                            ? `Agreement - ${contract.doctorName}`
                            : "Membership Agreement"
                        }
                      </CardTitle>
                      <CardDescription>
                        Created {format(new Date(contract.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                    {getStatusBadge(contract.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    {contract.doctorEmail && (
                      <span>Email: {contract.doctorEmail}</span>
                    )}
                    {contract.signedAt && (
                      <span>Signed: {format(new Date(contract.signedAt), "MMM d, yyyy")}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {contract.status === "pending" && contract.embeddedSigningUrl && (
                      <Button asChild data-testid={`button-sign-${contract.id}`}>
                        <Link href={`/contracts/${contract.id}/sign`}>
                          <ClipboardSignature className="mr-2 h-4 w-4" />
                          Sign Now
                        </Link>
                      </Button>
                    )}
                    {contract.status === "pending" && !contract.embeddedSigningUrl && (
                      <Button asChild variant="outline" data-testid={`button-continue-${contract.id}`}>
                        <Link href={`/contracts/${contract.id}/sign`}>
                          Continue Signing
                        </Link>
                      </Button>
                    )}
                    {(contract.status === "signed" || contract.status === "completed") && contract.signNowDocumentId && (
                      <Button 
                        variant="outline" 
                        onClick={() => window.open(`/api/signnow/documents/${contract.signNowDocumentId}/download`, "_blank")}
                        data-testid={`button-download-${contract.id}`}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
