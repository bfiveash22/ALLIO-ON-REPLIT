import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import type { Clinic, MemberProfile } from "@shared/schema";
import {
  Users,
  FileText,
  Settings,
  ChevronRight,
  UserPlus,
  Eye,
  EyeOff,
  Building2,
  Activity,
  Shield,
} from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ClinicPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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

  const { data: clinic, isLoading: clinicLoading } = useQuery<Clinic>({
    queryKey: ["/api/clinic"],
    enabled: isAuthenticated,
  });

  const { data: members, isLoading: membersLoading } = useQuery<
    MemberProfile[]
  >({
    queryKey: ["/api/clinic/members"],
    enabled: isAuthenticated,
  });

  if (authLoading || clinicLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="mb-8 h-10 w-64" />
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-2">
              Clinic Management
            </Badge>
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              {clinic?.name || "My Clinic"}
            </h1>
            <p className="text-muted-foreground">
              Manage your clinic, members, and settings.
            </p>
          </div>
          <Button asChild data-testid="button-clinic-settings">
            <Link href="/clinic/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-card-border" data-testid="card-stat-members">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{members?.length || 0}</p>
              )}
            </CardContent>
          </Card>

          <Card
            className="border-card-border"
            data-testid="card-stat-active-members"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Members
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">
                  {members?.filter((m) => m.isActive).length || 0}
                </p>
              )}
            </CardContent>
          </Card>

          <Card
            className="border-card-border"
            data-testid="card-stat-contracts"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Signed Contracts
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">
                  {members?.filter((m) => m.contractSigned).length || 0}
                </p>
              )}
            </CardContent>
          </Card>

          <Card
            className="border-card-border"
            data-testid="card-stat-pricing-visible"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pricing Visibility
              </CardTitle>
              {clinic?.pricingVisibility === "always" ? (
                <Eye className="h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold capitalize">
                {clinic?.pricingVisibility?.replace("_", " ") || "Members Only"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="border-card-border" data-testid="card-members">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Clinic Members</CardTitle>
                <Button size="sm" asChild data-testid="button-add-member">
                  <Link href="/clinic/members/add">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : members && members.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Contract</TableHead>
                        <TableHead>Pricing</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow
                          key={member.id}
                          data-testid={`row-member-${member.id}`}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                Member #{member.id.slice(0, 8)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {member.city}, {member.state}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={member.isActive ? "default" : "secondary"}
                            >
                              {member.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                member.contractSigned ? "default" : "outline"
                              }
                            >
                              {member.contractSigned ? "Signed" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {member.pricingVisible ? (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              data-testid={`button-view-member-${member.id}`}
                            >
                              <Link href={`/clinic/members/${member.id}`}>
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 font-semibold">No members yet</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Start by adding members to your clinic.
                    </p>
                    <Button asChild data-testid="button-add-first-member">
                      <Link href="/clinic/members/add">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Your First Member
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card
              className="border-card-border"
              data-testid="card-pricing-settings"
            >
              <CardHeader>
                <CardTitle className="text-lg">Pricing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show pricing to members</Label>
                    <p className="text-sm text-muted-foreground">
                      Members can see product prices when logged in
                    </p>
                  </div>
                  <Switch
                    defaultChecked={clinic?.pricingVisibility === "always"}
                    data-testid="switch-pricing-visibility"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border" data-testid="card-quick-links">
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  data-testid="button-link-contracts"
                >
                  <Link href="/clinic/contracts">
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Contracts
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  data-testid="button-link-iv-program"
                >
                  <Link href="/clinic/iv-program">
                    <Activity className="mr-2 h-4 w-4" />
                    IV Program
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  data-testid="button-link-pma-network"
                >
                  <Link href="/clinic/pma-network">
                    <Shield className="mr-2 h-4 w-4" />
                    PMA Network
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  data-testid="button-link-settings"
                >
                  <Link href="/clinic/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Clinic Settings
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-card-border" data-testid="card-clinic-info">
              <CardHeader>
                <CardTitle className="text-lg">Clinic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {clinic ? (
                  <>
                    <div>
                      <p className="text-muted-foreground">Address</p>
                      <p>{clinic.address || "Not set"}</p>
                      <p>
                        {clinic.city}, {clinic.state} {clinic.zipCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p>{clinic.phone || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p>{clinic.email || "Not set"}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Set up your clinic profile to display information here.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-card-border" data-testid="card-pma-documents">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  PMA Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Unified Membership Contract</p>
                  <p className="text-muted-foreground">FFPMA-UMC-4.0 — Member enrollment</p>
                </div>
                <div>
                  <p className="font-medium">Clinic Principal Charter Agreement</p>
                  <p className="text-muted-foreground">FFPMA-CPA-1.0 — Doctor onboarding</p>
                </div>
                <div>
                  <p className="font-medium">Clinic Portal</p>
                  <a
                    href="https://ffpmaclinicpmacreation.replit.app/portal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs"
                    data-testid="link-clinic-portal"
                  >
                    ffpmaclinicpmacreation.replit.app/portal
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Your clinic operates as an Affiliated Clinic Association under the Mother PMA constitutional framework.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
