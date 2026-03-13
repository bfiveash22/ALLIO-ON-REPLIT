import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { Program } from "@shared/schema";
import { Syringe, Pill, Activity, ChevronRight, Clock, Users } from "lucide-react";

const programIcons = {
  iv: Syringe,
  peptide: Pill,
  protocol: Activity,
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
            Comprehensive Programs
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Advanced protocols and programs designed by root cause doctors for
            optimal health, healing, and regeneration.
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
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : programs && programs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => {
              const IconComponent =
                programIcons[program.type as keyof typeof programIcons] ||
                Activity;

              return (
                <Card
                  key={program.id}
                  className="border-card-border hover-elevate"
                  data-testid={`card-program-${program.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {program.type}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{program.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                    </div>
                    <div className="mb-4">
                      {isAuthenticated ? (
                        <p className="text-lg font-semibold text-primary">
                          {formatPrice(program.price)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Sign in to view pricing
                        </p>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      asChild
                      data-testid={`button-program-${program.id}`}
                    >
                      <Link href={`/programs/${program.slug}`}>
                        Learn More
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-card-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Activity className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                Programs Coming Soon
              </h3>
              <p className="mb-4 text-center text-muted-foreground max-w-md">
                Our comprehensive IV, Peptide, and Protocol programs are being
                developed. Check back soon for more information.
              </p>
              <Button asChild data-testid="button-browse-products">
                <Link href="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
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
                <CardTitle className="mt-4">IV Program</CardTitle>
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
                <CardTitle className="mt-4">Peptide Program</CardTitle>
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
                    Bioregulator stacks
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
                <CardTitle className="mt-4">Protocols</CardTitle>
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
                    Anti-parasitic protocols
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Detoxification programs
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Hormone optimization
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
