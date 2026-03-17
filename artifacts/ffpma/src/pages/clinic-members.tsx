import { Link } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowLeft, Search, UserPlus, Mail, Phone, Calendar, MoreVertical, User, Activity, FileText, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClinicMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinDate: string;
  status: "active" | "pending" | "inactive";
  lastVisit?: string;
  membershipType: string;
}

const mockMembers: ClinicMember[] = [
  { id: "1", name: "John Davidson", email: "john.d@email.com", phone: "(555) 123-4567", joinDate: "2024-11-15", status: "active", lastVisit: "2025-01-20", membershipType: "Full Member" },
  { id: "2", name: "Sarah Mitchell", email: "sarah.m@email.com", phone: "(555) 234-5678", joinDate: "2024-12-01", status: "active", lastVisit: "2025-01-22", membershipType: "Full Member" },
  { id: "3", name: "Robert Kim", email: "robert.k@email.com", phone: "(555) 345-6789", joinDate: "2025-01-05", status: "pending", lastVisit: undefined, membershipType: "Trial" },
  { id: "4", name: "Emily Chen", email: "emily.c@email.com", phone: "(555) 456-7890", joinDate: "2024-10-20", status: "active", lastVisit: "2025-01-18", membershipType: "Full Member" },
  { id: "5", name: "Michael Torres", email: "michael.t@email.com", phone: "(555) 567-8901", joinDate: "2024-09-15", status: "inactive", lastVisit: "2024-12-05", membershipType: "Lapsed" },
];

export default function ClinicMembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ClinicMember | null>(null);

  const filteredMembers = mockMembers.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "inactive": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      default: return "";
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/clinic">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Clinic Members</h1>
            <p className="text-muted-foreground">Manage your clinic's member roster</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {mockMembers.length} Members
            </Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search members by name or email..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search" 
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-black" 
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-member"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card data-testid="card-stat-active">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Members</p>
                  <p className="text-3xl font-bold text-green-500">
                    {mockMembers.filter(m => m.status === "active").length}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-pending">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                  <p className="text-3xl font-bold text-amber-500">
                    {mockMembers.filter(m => m.status === "pending").length}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                  <User className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-this-month">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Joined This Month</p>
                  <p className="text-3xl font-bold text-teal-500">
                    {mockMembers.filter(m => m.joinDate.startsWith("2025-01")).length}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10">
                  <Calendar className="h-6 w-6 text-teal-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {filteredMembers.length === 0 ? (
          <Card className="border-dashed" data-testid="card-empty-state">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 mb-4">
                <Users className="h-8 w-8 text-amber-500" />
              </div>
              <CardTitle className="text-xl mb-2">No Members Found</CardTitle>
              <CardDescription className="text-center max-w-md">
                {searchQuery || statusFilter !== "all" 
                  ? "No members match your search criteria. Try adjusting your filters."
                  : "Your clinic's member roster is empty. Start by adding members who are part of the Forgotten Formula PMA network."}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <Card data-testid="card-member-list">
            <CardHeader>
              <CardTitle>Member Directory</CardTitle>
              <CardDescription>
                Showing {filteredMembers.length} of {mockMembers.length} members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedMember(member)}
                    data-testid={`member-row-${member.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-amber-500/10 text-amber-500 font-medium">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <Badge className={getStatusColor(member.status)}>
                          {member.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {member.lastVisit ? `Last visit: ${member.lastVisit}` : "No visits yet"}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <User className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Activity className="h-4 w-4 mr-2" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Documents
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>
                Add a new member to your clinic's member roster.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" data-testid="input-first-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" data-testid="input-last-name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" data-testid="input-email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="(555) 123-4567" data-testid="input-phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="membershipType">Membership Type</Label>
                <Select>
                  <SelectTrigger data-testid="select-membership-type">
                    <SelectValue placeholder="Select membership type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="full">Full Member</SelectItem>
                    <SelectItem value="premium">Premium Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-black" onClick={() => setShowAddDialog(false)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          {selectedMember && (
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-amber-500/10 text-amber-500 font-medium">
                      {getInitials(selectedMember.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedMember.name}</p>
                    <Badge className={getStatusColor(selectedMember.status)}>
                      {selectedMember.status}
                    </Badge>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Membership</p>
                    <p className="font-medium">{selectedMember.membershipType}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{selectedMember.joinDate}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedMember.email}
                  </div>
                  {selectedMember.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedMember.phone}
                    </div>
                  )}
                  {selectedMember.lastVisit && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Last visit: {selectedMember.lastVisit}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex-1">
                  <Activity className="h-4 w-4 mr-2" />
                  View History
                </Button>
                <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-black">
                  <FileText className="h-4 w-4 mr-2" />
                  Schedule Visit
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </main>
  );
}
