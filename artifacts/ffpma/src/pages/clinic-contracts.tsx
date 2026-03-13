import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  ArrowLeft,
  PenTool,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  Users,
  LinkIcon,
} from "lucide-react";
import type { Clinic, Contract } from "@shared/schema";

export default function ClinicContractsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  const { data: clinics, isLoading: clinicsLoading } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  const { data: contracts, isLoading: contractsLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const filteredClinics = (clinics || []).filter((clinic) => {
    const query = searchQuery.toLowerCase();
    return (
      clinic.name.toLowerCase().includes(query) ||
      (clinic.doctorName || "").toLowerCase().includes(query)
    );
  });

  const totalClinics = clinics?.length || 0;
  const activeSignNowLinks = clinics?.filter((c) => c.signNowMemberLink).length || 0;
  const pendingContracts = contracts?.filter((c) => c.status === "pending" || c.status === "sent").length || 0;

  return (
    <main className="flex-1 overflow-auto bg-slate-950">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/clinic">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-page-title">
              Clinic Contracts
            </h1>
            <p className="text-slate-400">SignNow contract directory and signing activity</p>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
          <Card className="bg-slate-900 border-slate-800" data-testid="stat-total-clinics">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Clinics</p>
                  {clinicsLoading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-cyan-400" data-testid="text-total-clinics">
                      {totalClinics}
                    </p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10">
                  <Building2 className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800" data-testid="stat-active-signnow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Active SignNow Links</p>
                  {clinicsLoading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-emerald-400" data-testid="text-active-signnow">
                      {activeSignNowLinks}
                    </p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800" data-testid="stat-pending-contracts">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pending Contracts</p>
                  {contractsLoading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-amber-400" data-testid="text-pending-contracts">
                      {pendingContracts}
                    </p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                  <Clock className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by clinic or doctor name..."
              className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1" data-testid="badge-results-count">
            {filteredClinics.length} {filteredClinics.length === 1 ? "clinic" : "clinics"}
          </Badge>
        </div>

        {clinicsLoading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredClinics.length === 0 ? (
          <Card className="border-dashed bg-slate-900 border-slate-700" data-testid="card-empty-state">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 mb-4">
                <Building2 className="h-8 w-8 text-slate-500" />
              </div>
              <CardTitle className="text-xl mb-2 text-white">No Clinics Found</CardTitle>
              <CardDescription className="text-center max-w-md text-slate-400">
                {searchQuery
                  ? "No clinics match your search. Try a different name or doctor."
                  : "No clinics are available yet."}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {filteredClinics.map((clinic) => (
              <Card
                key={clinic.id}
                className="bg-slate-900 border-slate-800 hover:border-slate-600 transition-colors"
                data-testid={`card-clinic-${clinic.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-white" data-testid={`text-clinic-name-${clinic.id}`}>
                      {clinic.name}
                    </CardTitle>
                    {clinic.signNowMemberLink ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30" data-testid={`badge-signnow-active-${clinic.id}`}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        SignNow Active
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30" data-testid={`badge-signnow-inactive-${clinic.id}`}>
                        <XCircle className="h-3 w-3 mr-1" />
                        No SignNow
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span data-testid={`text-doctor-name-${clinic.id}`}>
                        {clinic.doctorName || "No doctor assigned"}
                      </span>
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {clinic.signupUrl && (
                    <a
                      href={clinic.signupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 transition-colors"
                      data-testid={`link-signup-url-${clinic.id}`}
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      WordPress Signup
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
                    disabled={!clinic.signNowMemberLink}
                    onClick={() => setSelectedClinic(clinic)}
                    data-testid={`button-sign-contract-${clinic.id}`}
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    {clinic.signNowMemberLink ? "Sign Contract" : "SignNow Not Configured"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-slate-900 border-slate-800 mt-6" data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-400" />
              Recent Contract Activity
            </CardTitle>
            <CardDescription className="text-slate-400">
              Latest signing activity across all clinics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contractsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : !contracts || contracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Clock className="h-10 w-10 text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">No contract activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contracts.slice(0, 10).map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    data-testid={`row-contract-${contract.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/10">
                        <FileText className="h-4 w-4 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white" data-testid={`text-contract-clinic-${contract.id}`}>
                          {contract.clinicName || "Unknown Clinic"}
                        </p>
                        <p className="text-xs text-slate-400" data-testid={`text-contract-doctor-${contract.id}`}>
                          {contract.doctorName || "Unknown Doctor"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {contract.signedAt && (
                        <span className="text-xs text-slate-500" data-testid={`text-contract-date-${contract.id}`}>
                          {new Date(contract.signedAt).toLocaleDateString()}
                        </span>
                      )}
                      <Badge
                        className={
                          contract.status === "signed" || contract.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : contract.status === "sent"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        }
                        data-testid={`badge-contract-status-${contract.id}`}
                      >
                        {contract.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedClinic} onOpenChange={(open) => !open && setSelectedClinic(null)}>
        <DialogContent className="max-w-4xl h-[90vh] bg-slate-900 border-slate-700 flex flex-col" data-testid="dialog-signnow">
          <DialogHeader>
            <DialogTitle className="text-white" data-testid="text-dialog-title">
              Sign Contract — {selectedClinic?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Complete the SignNow agreement below. After signing, you'll be redirected to checkout on forgottenformula.com. You can return to this app afterward.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {selectedClinic?.signNowMemberLink && (
              <iframe
                src={selectedClinic.signNowMemberLink}
                className="w-full h-full rounded-lg border border-slate-700"
                style={{ aspectRatio: "3/4", minHeight: "500px" }}
                title={`SignNow Contract for ${selectedClinic.name}`}
                data-testid="iframe-signnow"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
