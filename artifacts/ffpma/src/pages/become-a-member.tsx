import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { FFLogoFull } from "@/components/ff-logo";
import { Link } from "wouter";
import {
  Shield,
  AlertTriangle,
  Scale,
  Lock,
  FileText,
  ChevronRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";

export default function BecomeAMemberPage() {
  const [acknowledged, setAcknowledged] = useState(false);

  const { data, isLoading, error } = useQuery<{ signNowMemberLink: string }>({
    queryKey: ["/api/public/member-signing-link"],
    queryFn: async () => {
      const res = await fetch("/api/public/member-signing-link");
      if (!res.ok) throw new Error("Failed to fetch signing link");
      return res.json();
    },
  });

  const handleProceed = () => {
    if (data?.signNowMemberLink && acknowledged) {
      window.location.href = data.signNowMemberLink;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <FFLogoFull className="h-8 cursor-pointer" />
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4">
            <Shield className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Private Membership Association
          </h1>
          <p className="text-muted-foreground text-lg">
            Please review the following notice before proceeding
          </p>
        </div>

        <Card className="border-amber-500/40 shadow-lg shadow-amber-500/5 mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              PRIVATE DOMAIN NOTICE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <Scale className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm font-medium">
                The Forgotten Formula Private Membership Association (FFPMA) is a
                <strong> private domain-only</strong> association operating under the
                constitutional protections afforded by the{" "}
                <strong>First Amendment</strong> (freedom of association) and the{" "}
                <strong>Fourteenth Amendment</strong> (liberty interests and equal
                protection) of the United States Constitution.
              </AlertDescription>
            </Alert>

            <Alert className="border-red-500/30 bg-red-500/5">
              <FileText className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-sm font-medium">
                The membership contract you are about to sign is{" "}
                <strong>real, legally binding, and enforceable</strong>. By signing,
                you are entering into a private agreement that carries full legal
                weight and obligation.
              </AlertDescription>
            </Alert>

            <Alert className="border-red-500/30 bg-red-500/5">
              <Lock className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-sm font-medium">
                Any attempt to join this association with the intent to{" "}
                <strong>
                  cause harm, defame, infiltrate, or undermine
                </strong>{" "}
                the FFPMA or any of its affiliated network PMAs constitutes a{" "}
                <strong>
                  direct attack on constitutionally protected rights
                </strong>{" "}
                — including the right to privacy, freedom of association, and the
                integrity of the cause. Such actions will be treated accordingly
                under the full extent of applicable law.
              </AlertDescription>
            </Alert>

            <div className="border border-border/60 rounded-lg p-4 bg-muted/30 mt-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                  className="mt-0.5 border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <label
                  htmlFor="acknowledge"
                  className="text-sm leading-relaxed cursor-pointer select-none"
                >
                  I acknowledge that I am entering a{" "}
                  <strong>private membership agreement</strong> voluntarily and in
                  good faith. I understand that this contract is legally binding and
                  that the FFPMA operates within the private domain under
                  constitutional protections. I have no intention to harm, defame,
                  infiltrate, or undermine this association or its network.
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-4">
          {isLoading ? (
            <Button disabled size="lg" className="w-full max-w-md">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
          ) : error ? (
            <Alert className="border-red-500/30 bg-red-500/5 max-w-md">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-sm">
                Unable to load the membership signing link. Please try again later
                or contact support.
              </AlertDescription>
            </Alert>
          ) : (
            <Button
              size="lg"
              disabled={!acknowledged}
              onClick={handleProceed}
              className="w-full max-w-md bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold shadow-xl shadow-amber-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              Proceed to Membership Contract
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center max-w-md">
            You will be redirected to SignNow to review and sign your Unified
            Membership Contract. Already a member?{" "}
            <Link href="/login" className="text-primary underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
