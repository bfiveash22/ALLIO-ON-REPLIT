import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { Program } from "@shared/schema";
import { Syringe, Pill, Activity, ChevronRight, Clock, CheckCircle2, DollarSign } from "lucide-react";

const programIcons = {
  iv: Syringe,
  peptide: Pill,
  protocol: Activity,
};

const programTypeLabels: Record<string, string> = {
  iv: "IV Therapy",
  peptide: "Peptide Therapy",
  protocol: "Protocol",
};

const programIncludes: Record<string, string[]> = {
  "iv-vitamin-therapy-starter": [
    "4 customized IV infusions",
    "Initial health assessment",
    "Baseline and follow-up labs",
    "Personalized protocol design",
    "Maintenance plan for ongoing care",
  ],
  "peptide-healing-protocol": [
    "All necessary peptides (8-week supply)",
    "Injection supplies and training",
    "Weekly check-in calls",
    "Protocol adjustments as needed",
    "Comprehensive lab panel",
  ],
  "5-rs-to-homeostasis": [
    "Complete supplement protocol",
    "Functional lab testing",
    "Bi-weekly coaching calls",
    "Meal plans and recipes",
    "Lifetime access to program materials",
  ],
  "glp-1-weight-management": [
    "16-week peptide supply",
    "Weekly coaching calls",
    "Comprehensive metabolic labs",
    "Nutrition and exercise plans",
    "Body composition tracking",
  ],
  "nad-cellular-revival": [
    "NAD+ IV infusions or subcutaneous protocol",
    "Precursor supplements",
    "Lifestyle optimization guide",
    "Cognitive function testing",
    "Maintenance protocol",
  ],
  "parasite-cleanse-protocol": [
    "Complete herbal cleanse kit",
    "Binders and drainage support",
    "Probiotic restoration protocol",
    "Dietary guidelines",
    "Follow-up testing recommendations",
  ],
};

const getPricingTier = (price: string | number | null): { label: string; color: string } => {
  if (!price) return { label: "Contact Us", color: "bg-gray-500/20 text-gray-300" };
  const numPrice = Number(price);
  if (numPrice <= 1000) return { label: "Essential", color: "bg-emerald-500/20 text-emerald-300" };
  if (numPrice <= 2500) return { label: "Standard", color: "bg-blue-500/20 text-blue-300" };
  if (numPrice <= 3500) return { label: "Premium", color: "bg-violet-500/20 text-violet-300" };
  return { label: "Comprehensive", color: "bg-amber-500/20 text-amber-300" };
};

export default function ProgramsPage() {
  const { isAuthenticated } = useAuth();

  const { data: programs, isLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const formatPrice = (price: string | number | null) => {
    if (!price) return "Contact for pricing";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4">
            Healing Programs
          </Badge>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            Comprehensive Healing Programs
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Evidence-based protocols designed by root cause doctors for
            optimal health, deep healing, and cellular regeneration. Each program
            includes practitioner guidance and personalized support.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-card-border">
                <CardHeader>
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <Skeleton className="mt-4 h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="mb-4 h-20 w-full" />
                  <Skeleton className="mb-2 h-4 w-full" />
                  <Skeleton className="mb-2 h-4 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : programs && programs.length === 0 ? (
          <Card className="border-card-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Activity className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                No Programs Available
              </h3>
              <p className="mb-4 text-center text-muted-foreground max-w-md">
                New healing programs are being developed. Browse our training
                courses and protocols in the meantime.
              </p>
              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/training">View Training</Link>
                </Button>
                <Button asChild>
                  <Link href="/protocols">View Protocols</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(programs || []).map((program) => {
              const IconComponent =
                programIcons[program.type as keyof typeof programIcons] ||
                Activity;
              const includes = programIncludes[program.slug] || [];
              const pricingTier = getPricingTier(program.price);

              return (
                <Card
                  key={program.id}
                  className="border-card-border hover-elevate flex flex-col"
                  data-testid={`card-program-${program.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="capitalize text-xs">
                          {programTypeLabels[program.type] || program.type}
                        </Badge>
                        <Badge className={`${pricingTier.color} border-0 text-xs`}>
                          {pricingTier.label}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="mt-4">{program.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {program.shortDescription && (
                      <p className="mb-4 text-sm text-muted-foreground line-clamp-3">
                        {program.shortDescription}
                      </p>
                    )}

                    <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                      {program.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {program.duration}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {isAuthenticated
                          ? formatPrice(program.price)
                          : "Sign in for pricing"}
                      </span>
                    </div>

                    {includes.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          What's Included
                        </p>
                        <ul className="space-y-1.5">
                          {includes.slice(0, 4).map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                          {includes.length > 4 && (
                            <li className="text-xs text-primary">
                              +{includes.length - 4} more included
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="mt-auto">
                      <Button
                        className="w-full"
                        asChild
                        data-testid={`button-program-${program.id}`}
                      >
                        <Link href={`/programs/${program.slug}`}>
                          View Program Details
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Program Categories
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-card-border" data-testid="card-iv-category">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary/10">
                  <Syringe className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="mt-4">IV Therapy Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Intravenous therapy protocols for optimal nutrient delivery,
                  cellular regeneration, and enhanced bioavailability. Our IV
                  programs are designed by experienced practitioners.
                </p>
                <ul className="mb-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    High-dose vitamin C protocols
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Glutathione infusions
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Myers' Cocktail variations
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    NAD+ therapy
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="border-card-border"
              data-testid="card-peptide-category"
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary/10">
                  <Pill className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="mt-4">Peptide Therapy Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Advanced peptide protocols for healing, anti-aging, and
                  performance optimization. Bioregulators and injectable
                  peptides for targeted cellular support.
                </p>
                <ul className="mb-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    BPC-157 healing protocols
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Thymosin peptides
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    GH secretagogues
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    GLP-1 weight management
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="border-card-border"
              data-testid="card-protocol-category"
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary/10">
                  <Activity className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="mt-4">Root Cause Protocols</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Comprehensive treatment protocols developed by our network of
                  root cause doctors. Evidence-based approaches to common health
                  challenges.
                </p>
                <ul className="mb-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    FF PMA 5R Framework
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Anti-parasitic protocols
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Detoxification programs
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Cellular regeneration
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
