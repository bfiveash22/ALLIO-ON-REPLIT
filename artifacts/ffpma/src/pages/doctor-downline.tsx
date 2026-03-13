import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Link2, 
  Copy, 
  Check,
  DollarSign,
  TrendingUp,
  Clock,
  Mail,
  RefreshCw,
} from "lucide-react";

export default function DoctorDownlinePage() {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: membersData, isLoading, refetch } = useQuery<{ members: any[], total: number }>({
    queryKey: ["/api/doctor/members"],
  });

  const { data: referralInfo } = useQuery<{ doctorCode: string, memberSignupUrl: string }>({
    queryKey: ["/api/doctor/referral"],
  });

  const referrals = membersData?.members || [];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
  };

  const referralUrl = referralInfo?.memberSignupUrl || "";

  const activeReferrals = referrals.filter(r => r.status === "completed");
  const pendingReferrals = referrals.filter(r => r.status === "document_sent" || r.status === "document_signed");
  const totalCommission = referrals.length * 150; // Mock commission for display purposes
  const totalPurchases = referrals.length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge>Active</Badge>;
      case "document_sent": return <Badge variant="outline">Pending signature</Badge>;
      case "document_signed": return <Badge variant="secondary">Processing</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Referral Network</h1>
          <p className="text-muted-foreground mt-1">
            Manage your referrals and track your downline
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link to invite new members to join under your network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <Input 
              value={referralUrl || "Loading..."} 
              readOnly 
              className="font-mono text-sm"
              data-testid="input-referral-url"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => copyToClipboard(referralUrl, "Referral URL")}
              disabled={!referralUrl}
              data-testid="button-copy-url"
            >
              {copiedCode === "Referral URL" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referrals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeReferrals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invites</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReferrals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommission.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All Referrals</TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active">Active</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-md">
                      <div className="h-10 w-10 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : referrals.length > 0 ? (
                <div className="space-y-3">
                  {referrals.map((referral) => (
                    <div 
                      key={referral.id} 
                      className="flex items-center justify-between gap-4 p-4 border rounded-md"
                      data-testid={`row-referral-${referral.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {referral.referredName || referral.referredEmail || "Unnamed Referral"}
                          </p>
                          {referral.referredEmail && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {referral.referredEmail}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">${parseFloat(referral.totalPurchases || "0").toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">purchases</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-cyan-600">${parseFloat(referral.commissionEarned || "0").toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">earned</p>
                        </div>
                        {getStatusBadge(referral.status || "pending")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No referrals yet</p>
                  <p className="text-sm">Share your referral link to start building your network</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardContent className="pt-6">
              {activeReferrals.length > 0 ? (
                <div className="space-y-3">
                  {activeReferrals.map((referral) => (
                    <div 
                      key={referral.id} 
                      className="flex items-center justify-between gap-4 p-4 border rounded-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="font-medium">{referral.referredName || "Unnamed"}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined {referral.signupDate ? new Date(referral.signupDate).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-cyan-600">${parseFloat(referral.commissionEarned || "0").toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">commission earned</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active referrals yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              {pendingReferrals.length > 0 ? (
                <div className="space-y-3">
                  {pendingReferrals.map((referral) => (
                    <div 
                      key={referral.id} 
                      className="flex items-center justify-between gap-4 p-4 border rounded-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium">{referral.referredName || referral.referredEmail || "Pending"}</p>
                          <p className="text-sm text-muted-foreground">
                            Invited {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Awaiting Signup</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending invitations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
