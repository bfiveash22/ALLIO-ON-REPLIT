import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Program, ProgramEnrollment } from "@shared/schema";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  CheckCircle2,
  PlayCircle,
  Calendar,
  Users,
  Syringe,
  Pill,
  Activity,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

const programIcons = {
  iv: Syringe,
  peptide: Pill,
  protocol: Activity,
};

const programDetails: Record<string, {
  weeks: Array<{ week: number; title: string; description: string }>;
  includes: string[];
  outcomes: string[];
}> = {
  "iv-vitamin-therapy-starter": {
    weeks: [
      { week: 1, title: "Assessment & First Infusion", description: "Initial health assessment, baseline labs, and your first customized IV infusion" },
      { week: 2, title: "Immune Support Protocol", description: "High-dose Vitamin C and glutathione infusion for immune optimization" },
      { week: 3, title: "Energy & Recovery", description: "B-complex and NAD+ precursor infusion for cellular energy" },
      { week: 4, title: "Maintenance & Review", description: "Final infusion and program review with personalized maintenance plan" },
    ],
    includes: [
      "4 customized IV infusions",
      "Initial health assessment",
      "Baseline and follow-up labs",
      "Personalized protocol design",
      "Maintenance plan for ongoing care",
    ],
    outcomes: [
      "Improved energy levels",
      "Enhanced immune function",
      "Better hydration and nutrient status",
      "Foundation for ongoing wellness",
    ],
  },
  "peptide-healing-protocol": {
    weeks: [
      { week: 1, title: "Assessment & Setup", description: "Health assessment, peptide education, and injection training" },
      { week: 2, title: "BPC-157 Introduction", description: "Begin gut healing and tissue repair protocol" },
      { week: 3, title: "Thymosin Alpha-1", description: "Immune modulation and optimization phase" },
      { week: 4, title: "GHK-Cu Protocol", description: "Skin and tissue regeneration focus" },
      { week: 5, title: "Combined Protocol", description: "Synergistic peptide stacking for enhanced effects" },
      { week: 6, title: "Optimization", description: "Dose adjustment and protocol refinement" },
      { week: 7, title: "Advanced Healing", description: "Full protocol implementation" },
      { week: 8, title: "Transition & Maintenance", description: "Program review and long-term maintenance plan" },
    ],
    includes: [
      "All necessary peptides (8-week supply)",
      "Injection supplies and training",
      "Weekly check-in calls",
      "Protocol adjustments as needed",
      "Comprehensive lab panel",
    ],
    outcomes: [
      "Accelerated tissue healing",
      "Reduced inflammation",
      "Improved gut health",
      "Enhanced immune function",
    ],
  },
  "5-rs-to-homeostasis": {
    weeks: [
      { week: 1, title: "Remove - Phase 1", description: "Identify and begin removing toxins, pathogens, and inflammatory triggers" },
      { week: 2, title: "Remove - Phase 2", description: "Deeper detox protocols and elimination diet" },
      { week: 3, title: "Replace", description: "Restore digestive enzymes, HCl, and bile support" },
      { week: 4, title: "Replace", description: "Essential nutrient repletion based on testing" },
      { week: 5, title: "Regenerate - Phase 1", description: "Gut lining repair with targeted supplements" },
      { week: 6, title: "Regenerate - Phase 2", description: "Microbiome restoration protocols" },
      { week: 7, title: "Restore", description: "Optimize organ function and hormone balance" },
      { week: 8, title: "Restore", description: "Mitochondrial and cellular energy support" },
      { week: 9, title: "Rebalance - Phase 1", description: "Stress management and sleep optimization" },
      { week: 10, title: "Rebalance - Phase 2", description: "Movement and lifestyle integration" },
      { week: 11, title: "Integration", description: "Full protocol integration and fine-tuning" },
      { week: 12, title: "Maintenance Planning", description: "Long-term maintenance and lifestyle plan" },
    ],
    includes: [
      "Complete supplement protocol",
      "Functional lab testing",
      "Bi-weekly coaching calls",
      "Meal plans and recipes",
      "Lifetime access to program materials",
    ],
    outcomes: [
      "Reduced chronic inflammation",
      "Improved digestive function",
      "Balanced energy levels",
      "Sustainable health habits",
    ],
  },
  "glp-1-weight-management": {
    weeks: [
      { week: 1, title: "Assessment & Education", description: "Metabolic assessment, education on GLP-1 peptides, and goal setting" },
      { week: 2, title: "Initiation", description: "Begin low-dose protocol with dietary guidance" },
      { week: 3, title: "Dose Titration", description: "Gradual dose increase based on tolerance" },
      { week: 4, title: "Optimization", description: "Reach therapeutic dose with nutrition focus" },
      { week: 5, title: "Protein Focus", description: "Maximize protein intake to preserve muscle" },
      { week: 6, title: "Strength Training", description: "Begin resistance training protocol" },
      { week: 7, title: "Mid-Program Check", description: "Labs, measurements, and protocol adjustment" },
      { week: 8, title: "Advanced Protocol", description: "Full therapeutic protocol implementation" },
      { week: 9, title: "Body Composition", description: "Focus on muscle preservation and fat loss" },
      { week: 10, title: "Metabolic Health", description: "Address metabolic markers and insulin sensitivity" },
      { week: 11, title: "Lifestyle Integration", description: "Sustainable habits for long-term success" },
      { week: 12, title: "Transition Phase", description: "Begin dose tapering if appropriate" },
      { week: 13, title: "Maintenance Prep", description: "Prepare for maintenance phase" },
      { week: 14, title: "Maintenance Planning", description: "Long-term maintenance protocol" },
      { week: 15, title: "Follow-up", description: "Check-in and adjustment" },
      { week: 16, title: "Program Completion", description: "Final assessment and ongoing plan" },
    ],
    includes: [
      "16-week peptide supply",
      "Weekly coaching calls",
      "Comprehensive metabolic labs",
      "Nutrition and exercise plans",
      "Body composition tracking",
    ],
    outcomes: [
      "Significant weight loss",
      "Improved metabolic markers",
      "Preserved muscle mass",
      "Sustainable lifestyle habits",
    ],
  },
  "nad-cellular-revival": {
    weeks: [
      { week: 1, title: "Assessment", description: "Baseline assessment and NAD+ education" },
      { week: 2, title: "Loading Phase", description: "Begin NAD+ loading protocol with IV or subcutaneous" },
      { week: 3, title: "Optimization", description: "Continue loading with lifestyle optimization" },
      { week: 4, title: "Integration", description: "Add precursors and cofactors" },
      { week: 5, title: "Maintenance Transition", description: "Transition to maintenance dosing" },
      { week: 6, title: "Program Review", description: "Final assessment and ongoing maintenance plan" },
    ],
    includes: [
      "NAD+ IV infusions or subcutaneous protocol",
      "Precursor supplements",
      "Lifestyle optimization guide",
      "Cognitive function testing",
      "Maintenance protocol",
    ],
    outcomes: [
      "Enhanced cellular energy",
      "Improved cognitive function",
      "Better physical endurance",
      "Healthy aging support",
    ],
  },
  "parasite-cleanse-protocol": {
    weeks: [
      { week: 1, title: "Preparation", description: "Prepare the body with binders and drainage support" },
      { week: 2, title: "Phase 1 Cleanse", description: "Begin anti-parasitic herbs and protocols" },
      { week: 3, title: "Intensification", description: "Full-dose cleanse protocol" },
      { week: 4, title: "Maintenance", description: "Continue cleanse with biofilm support" },
      { week: 5, title: "Rebuild", description: "Gut restoration and probiotic support" },
      { week: 6, title: "Completion", description: "Final cleanse phase and maintenance plan" },
    ],
    includes: [
      "Complete herbal cleanse kit",
      "Binders and drainage support",
      "Probiotic restoration protocol",
      "Dietary guidelines",
      "Follow-up testing recommendations",
    ],
    outcomes: [
      "Reduced digestive symptoms",
      "Improved energy",
      "Clearer skin",
      "Better nutrient absorption",
    ],
  },
};

export default function ProgramDetailPage() {
  const [match, params] = useRoute("/programs/:slug");
  const slug = params?.slug;
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: program, isLoading: programLoading } = useQuery<Program>({
    queryKey: ["/api/programs", slug],
    queryFn: async () => {
      const res = await fetch(`/api/programs/${slug}`);
      if (!res.ok) throw new Error("Failed to load program");
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: enrollment, isLoading: enrollmentLoading } = useQuery<ProgramEnrollment | null>({
    queryKey: ["/api/programs/enrollment", slug],
    queryFn: async () => {
      const res = await fetch(`/api/programs/${slug}/enrollment`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to check enrollment");
      return res.json();
    },
    enabled: !!slug && isAuthenticated,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/programs/${slug}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to enroll");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Enrolled Successfully!", description: "Welcome to the program. Your journey begins now." });
      queryClient.invalidateQueries({ queryKey: ["/api/programs/enrollment", slug] });
    },
    onError: () => {
      toast({ title: "Enrollment Failed", description: "Please try again or contact support.", variant: "destructive" });
    },
  });

  if (!match || !slug) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Program not found</p>
        </Card>
      </div>
    );
  }

  if (programLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Program not found</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/programs">Back to Programs</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const IconComponent = programIcons[program.type as keyof typeof programIcons] || Activity;
  const details = programDetails[program.slug];
  const isEnrolled = !!enrollment;
  const currentWeek = enrollment ? Math.ceil((enrollment.progress || 0) / (100 / (details?.weeks.length || 1))) : 0;

  const formatPrice = (price: string | number | null) => {
    if (!price) return "Contact for pricing";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(price));
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/programs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Programs
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                    <IconComponent className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">{program.type}</Badge>
                      {isEnrolled && (
                        <Badge className="bg-green-500">Enrolled</Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{program.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {program.description || program.shortDescription}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                  {program.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {program.duration}
                    </span>
                  )}
                  {details?.weeks && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {details.weeks.length} Weeks
                    </span>
                  )}
                </div>

                {isEnrolled && enrollment && (
                  <div className="bg-muted/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Your Progress</span>
                      <span className="text-sm text-muted-foreground">{enrollment.progress}%</span>
                    </div>
                    <Progress value={enrollment.progress || 0} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Week {currentWeek} of {details?.weeks.length || "N/A"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {details?.weeks && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Program Timeline</CardTitle>
                  <CardDescription>Your week-by-week journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {details.weeks.map((week, index) => {
                      const isCompleted = isEnrolled && currentWeek > week.week;
                      const isCurrent = isEnrolled && currentWeek === week.week;
                      
                      return (
                        <div
                          key={week.week}
                          className={`flex gap-4 p-3 rounded-lg transition-colors ${
                            isCurrent ? "bg-primary/10 border border-primary/20" :
                            isCompleted ? "bg-muted/30" : ""
                          }`}
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                            isCompleted ? "bg-green-500 text-white" :
                            isCurrent ? "bg-primary text-primary-foreground" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : week.week}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{week.title}</p>
                            <p className="text-sm text-muted-foreground">{week.description}</p>
                          </div>
                          {isCurrent && (
                            <Badge variant="secondary" className="shrink-0">Current</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {details?.includes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What's Included</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {details.includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {details?.outcomes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Expected Outcomes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {details.outcomes.map((outcome, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Activity className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">
                  {isEnrolled ? "Your Enrollment" : "Enroll Now"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEnrolled && (
                  <div className="text-center py-4">
                    <p className="text-3xl font-bold text-primary mb-1">
                      {formatPrice(program.price)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {program.duration}
                    </p>
                  </div>
                )}

                {isEnrolled ? (
                  <>
                    <div className="text-center py-2">
                      <Badge className="bg-green-500 mb-2">Active Enrollment</Badge>
                      <p className="text-sm text-muted-foreground">
                        Started {enrollment?.startedAt ? new Date(enrollment.startedAt).toLocaleDateString() : "recently"}
                      </p>
                    </div>
                    <Button className="w-full" variant="outline">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Continue Program
                    </Button>
                    <Button className="w-full" variant="ghost" asChild>
                      <Link href="/support">
                        Need Help?
                      </Link>
                    </Button>
                  </>
                ) : isAuthenticated ? (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => enrollMutation.mutate()}
                      disabled={enrollMutation.isPending}
                      data-testid="button-enroll-program"
                    >
                      {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Payment will be processed through our WooCommerce store
                    </p>
                    <Button className="w-full" variant="outline" asChild>
                      <a href={`https://forgottenformula.com/product/${program.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View in Store
                      </a>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full" size="lg" asChild>
                      <Link href="/login">Sign In to Enroll</Link>
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Create a free account to access pricing and enroll
                    </p>
                  </>
                )}

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium mb-2">Questions?</p>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/support">
                      <Users className="mr-2 h-4 w-4" />
                      Talk to Our Team
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
