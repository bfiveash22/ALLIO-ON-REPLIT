import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import type { Contract } from "@shared/schema";
import { FileText, Download, Eye, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ContractsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: contracts, isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    enabled: isAuthenticated,
  });

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: string | number | null) => {
    if (!price) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(price));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "signed":
        return <CheckCircle2 className="h-4 w-4 text-cyan-500" />;
      case "sent":
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
      case "signed":
        return "default";
      case "sent":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="mb-8 h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              My Contracts
            </h1>
            <p className="text-muted-foreground">
              View and manage your membership contracts.
            </p>
          </div>
        </div>

        <Card className="border-card-border" data-testid="card-contracts">
          <CardHeader>
            <CardTitle>Contract History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : contracts && contracts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow
                      key={contract.id}
                      data-testid={`row-contract-${contract.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(contract.status || "pending")}
                          <span className="font-mono text-sm">
                            #{contract.id.slice(0, 8)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(contract.createdAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusVariant(contract.status || "pending")}
                        >
                          {contract.status || "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{formatPrice(contract.feeAmount)}</span>
                          {contract.feePaid && (
                            <Badge variant="outline" className="text-xs">
                              Paid
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            data-testid={`button-view-contract-${contract.id}`}
                          >
                            <Link href={`/contracts/${contract.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          {contract.contractUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              data-testid={`button-download-contract-${contract.id}`}
                            >
                              <a
                                href={contract.contractUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No contracts yet</h3>
                <p className="mb-4 max-w-sm text-muted-foreground">
                  You don't have any contracts yet. Contracts are created when
                  you join a clinic or enroll in a program.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
          <Card className="border-card-border" data-testid="card-contract-info">
            <CardHeader>
              <CardTitle>About Contracts</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                As a Private Member Association, Forgotten Formula PMA operates
                under constitutional protections. Contracts establish the
                member-to-member relationship and outline the terms of your
                membership.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold">Membership Contract</h4>
                  <p className="text-sm text-muted-foreground">
                    Required for all members. Establishes your rights and
                    responsibilities within the PMA.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold">Clinic Agreement</h4>
                  <p className="text-sm text-muted-foreground">
                    Links you to a specific clinic and doctor for personalized
                    care and pricing.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold">Program Enrollment</h4>
                  <p className="text-sm text-muted-foreground">
                    Specific contracts for IV, Peptide, or Protocol program
                    enrollment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
