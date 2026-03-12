import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Users, BookOpen, Home, RefreshCw } from "lucide-react";

interface MembershipSession {
  payment_status: string;
  amount_total: number;
  metadata: {
    type: string;
    firstName: string;
    lastName: string;
    email: string;
    clinicId?: string;
  };
}

export default function MembershipSuccessPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const sessionId = params.get("session_id");
  const [accountCreated, setAccountCreated] = useState(false);

  const { data: session, isLoading, error } = useQuery<MembershipSession>({
    queryKey: ["/api/checkout/session", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await fetch(`/api/checkout/session/${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch session");
      return response.json();
    },
    enabled: !!sessionId,
  });

  const activateMembershipMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error("No session ID");
      const response = await fetch(`/api/memberships/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to activate membership" }));
        throw new Error(error.error);
      }
      return response.json();
    },
    onSuccess: () => {
      setAccountCreated(true);
    },
  });

  useEffect(() => {
    if (session?.payment_status === "paid" && !accountCreated && !activateMembershipMutation.isPending) {
      activateMembershipMutation.mutate();
    }
  }, [session, accountCreated]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Confirming your membership...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Confirm Membership</h2>
            <p className="text-muted-foreground text-center mb-4">
              We couldn't verify your payment. If you completed payment, please contact support.
            </p>
            <Button asChild variant="outline">
              <Link href="/" data-testid="link-home">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-cyan-500" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-membership-confirmed">
            Welcome to Forgotten Formula PMA!
          </CardTitle>
          <CardDescription>
            Your lifetime membership has been activated successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-md p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Name</span>
              <span className="font-medium">
                {session.metadata?.firstName} {session.metadata?.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{session.metadata?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Membership Type</span>
              <span className="font-medium text-cyan-600">Lifetime Member</span>
            </div>
            {session.amount_total && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-medium">${(session.amount_total / 100).toFixed(2)}</span>
              </div>
            )}
          </div>

          {activateMembershipMutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Setting up your account...</span>
            </div>
          )}

          {accountCreated && (
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p className="text-cyan-600 font-medium">Account created successfully!</p>
              <p>Check your email for login credentials.</p>
              <p>Complete the required PMA training modules to get started.</p>
            </div>
          )}

          {activateMembershipMutation.error && (
            <div className="text-center text-sm text-destructive">
              {activateMembershipMutation.error.message}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/login" data-testid="link-login">
              <Users className="h-4 w-4 mr-2" />
              Login to Your Account
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/training" data-testid="link-training">
              <BookOpen className="h-4 w-4 mr-2" />
              Start Training
            </Link>
          </Button>
          <Button asChild variant="ghost" className="flex-1">
            <Link href="/" data-testid="link-home">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
