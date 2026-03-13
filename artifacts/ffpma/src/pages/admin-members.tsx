import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Building2, 
  UserPlus,
  Search,
  Filter,
  Download,
  Stethoscope,
  Store,
  Home,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { Clinic, Contract } from "@shared/schema";

interface MemberDetails {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  clinicId: string | null;
  clinicName: string | null;
  sponsorId: string | null;
  sponsorName: string | null;
  wpUsername: string | null;
  wpRoles: string | null;
  source: string;
  createdAt: string;
}

interface MemberStats {
  byRole: Record<string, number>;
  byWpRole: Record<string, number>;
  bySource: Record<string, number>;
  byClinic: Array<{ clinicId: string; clinicName: string; count: number }>;
}

export default function AdminMembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [wpRoleFilter, setWpRoleFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [clinicFilter, setClinicFilter] = useState<string>("all");

  const { data: members = [], isLoading: membersLoading } = useQuery<MemberDetails[]>({
    queryKey: ["/api/admin/members"],
  });

  const { data: memberStats, isLoading: statsLoading } = useQuery<MemberStats>({
    queryKey: ["/api/admin/member-stats"],
  });

  const { data: clinics = [] } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  const { data: contracts = [], isLoading: contractsLoading } = useQuery<Contract[]>({
    queryKey: ["/api/admin/contracts"],
  });

  // Get unique WP roles from member stats
  const wpRoles = memberStats?.byWpRole ? Object.keys(memberStats.byWpRole).sort() : [];

  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchQuery || 
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.wpUsername?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesWpRole = wpRoleFilter === "all" || member.wpRoles?.toLowerCase() === wpRoleFilter.toLowerCase();
    const matchesSource = sourceFilter === "all" || member.source === sourceFilter;
    const matchesClinic = clinicFilter === "all" || member.clinicId === clinicFilter;
    
    return matchesSearch && matchesRole && matchesWpRole && matchesSource && matchesClinic;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge variant="destructive">Admin</Badge>;
      case "doctor": return <Badge className="bg-cyan-600">Doctor</Badge>;
      case "clinic": return <Badge variant="secondary">Clinic</Badge>;
      default: return <Badge variant="outline">Member</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "clinic": return <Badge variant="secondary" className="gap-1"><Building2 className="h-3 w-3" />Clinic</Badge>;
      case "in-house": return <Badge variant="outline" className="gap-1"><Home className="h-3 w-3" />In-House</Badge>;
      default: return <Badge variant="outline" className="gap-1"><Store className="h-3 w-3" />Retail</Badge>;
    }
  };

  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case "signed": return <Badge className="bg-cyan-600 gap-1"><CheckCircle className="h-3 w-3" />Signed</Badge>;
      case "pending": return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case "expired": return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Expired</Badge>;
      default: return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" />{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Members Management</h1>
              <p className="text-muted-foreground">View and manage all members by role, clinic, and source</p>
            </div>
            <Button variant="outline" className="gap-2" data-testid="button-export-members">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {statsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : memberStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card data-testid="stat-card-admins">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                  <Users className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memberStats.byWpRole?.administrator || 0}</div>
                  <p className="text-xs text-muted-foreground">Site administrators</p>
                </CardContent>
              </Card>
              <Card data-testid="stat-card-doctors">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Doctors</CardTitle>
                  <Stethoscope className="h-4 w-4 text-cyan-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memberStats.byWpRole?.doctor || 0}</div>
                  <p className="text-xs text-muted-foreground">Licensed practitioners</p>
                </CardContent>
              </Card>
              <Card data-testid="stat-card-wholesalers">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wholesalers</CardTitle>
                  <Building2 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memberStats.byWpRole?.wholesaler || 0}</div>
                  <p className="text-xs text-muted-foreground">Wholesale accounts</p>
                </CardContent>
              </Card>
              <Card data-testid="stat-card-members">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Members</CardTitle>
                  <UserPlus className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memberStats.byWpRole?.member || 0}</div>
                  <p className="text-xs text-muted-foreground">Regular members</p>
                </CardContent>
              </Card>
              <Card data-testid="stat-card-total">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Store className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(memberStats.byWpRole || {}).reduce((sum, count) => sum + count, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">All synced users</p>
                </CardContent>
              </Card>
            </div>
          )}

          {memberStats?.byWpRole && Object.keys(memberStats.byWpRole).length > 0 && (
            <Card data-testid="card-wp-roles">
              <CardHeader>
                <CardTitle className="text-lg">WordPress Roles Breakdown</CardTitle>
                <CardDescription>All roles synced from WordPress/WooCommerce</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(memberStats.byWpRole)
                    .sort(([, a], [, b]) => b - a)
                    .map(([role, count]) => (
                      <Badge 
                        key={role} 
                        variant="outline" 
                        className="text-sm py-1 px-3"
                        data-testid={`badge-wp-role-${role}`}
                      >
                        {role}: <span className="font-bold ml-1">{count}</span>
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="members" className="space-y-4">
            <TabsList data-testid="tabs-admin-members">
              <TabsTrigger value="members" data-testid="tab-members">
                <Users className="h-4 w-4 mr-2" />
                All Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="by-clinic" data-testid="tab-by-clinic">
                <Building2 className="h-4 w-4 mr-2" />
                By Clinic
              </TabsTrigger>
              <TabsTrigger value="contracts" data-testid="tab-contracts">
                <FileText className="h-4 w-4 mr-2" />
                Contracts ({contracts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filter Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, email, or username..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                          data-testid="input-search-members"
                        />
                      </div>
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[130px]" data-testid="select-role-filter">
                        <SelectValue placeholder="App Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All App Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="clinic">Clinic</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={wpRoleFilter} onValueChange={setWpRoleFilter}>
                      <SelectTrigger className="w-[150px]" data-testid="select-wp-role-filter">
                        <SelectValue placeholder="WP Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All WP Roles</SelectItem>
                        {wpRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role} ({memberStats?.byWpRole?.[role] || 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="w-[150px]" data-testid="select-source-filter">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="clinic">Clinic</SelectItem>
                        <SelectItem value="in-house">In-House</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={clinicFilter} onValueChange={setClinicFilter}>
                      <SelectTrigger className="w-[180px]" data-testid="select-clinic-filter">
                        <SelectValue placeholder="Clinic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clinics</SelectItem>
                        {clinics.map((clinic) => (
                          <SelectItem key={clinic.id} value={clinic.id}>{clinic.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Members Roster ({filteredMembers.length})</CardTitle>
                  <CardDescription>
                    All members with their roles, clinics, and signup source
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {membersLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {filteredMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                            data-testid={`member-row-${member.id}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <Users className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {member.firstName || member.lastName 
                                    ? `${member.firstName || ''} ${member.lastName || ''}`.trim()
                                    : member.wpUsername || 'Unknown'}
                                </div>
                                <div className="text-sm text-muted-foreground">{member.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {member.clinicName && (
                                <Badge variant="outline" className="gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {member.clinicName}
                                </Badge>
                              )}
                              {getSourceBadge(member.source)}
                              {getRoleBadge(member.role)}
                              <span className="text-xs text-muted-foreground">{formatDate(member.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                        {filteredMembers.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No members found matching your filters.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="by-clinic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {memberStats?.byClinic.map((clinic) => (
                  <Card key={clinic.clinicId} className="hover-elevate" data-testid={`clinic-card-${clinic.clinicId}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-purple-600" />
                        {clinic.clinicName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{clinic.count}</div>
                      <p className="text-sm text-muted-foreground">members assigned</p>
                    </CardContent>
                  </Card>
                ))}
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-muted-foreground">
                      <UserPlus className="h-5 w-5" />
                      Unassigned Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-muted-foreground">
                      {members.filter(m => !m.clinicId).length}
                    </div>
                    <p className="text-sm text-muted-foreground">retail or in-house</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contracts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Doctor Onboarding Contracts
                  </CardTitle>
                  <CardDescription>
                    SignNow agreements for doctor onboarding
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contractsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : contracts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No contracts have been created yet.
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {contracts.map((contract) => (
                          <div
                            key={contract.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                            data-testid={`contract-row-${contract.id}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium">{contract.doctorName || 'Unknown Doctor'}</div>
                                <div className="text-sm text-muted-foreground">{contract.doctorEmail}</div>
                                {contract.clinicName && (
                                  <div className="text-xs text-muted-foreground">Clinic: {contract.clinicName}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {contract.specialization && (
                                <Badge variant="outline">{contract.specialization}</Badge>
                              )}
                              {getContractStatusBadge(contract.status || 'pending')}
                              <span className="text-xs text-muted-foreground">
                                {contract.createdAt ? formatDate(contract.createdAt.toString()) : 'Unknown'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
