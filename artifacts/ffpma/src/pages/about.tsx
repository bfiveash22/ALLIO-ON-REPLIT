import { useState } from "react";
import { FoundingFathersAboutSection } from "@/components/founding-fathers-section";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Heart,
  Leaf,
  Users,
  BookOpen,
  Scale,
  Dna,
  Sparkles,
  Star,
  ChevronRight,
  FileText,
  Lightbulb,
  HandHeart,
  Crown,
  Zap,
  Activity,
  Lock,
  Target,
  Globe,
  ArrowRight,
} from "lucide-react";

const CORE_PRINCIPLES = [
  {
    icon: Shield,
    title: "Constitutional Protection",
    description: "Operating under First and Fourteenth Amendment protections, ensuring your freedom to choose your healthcare path.",
    details: [
      "Private Member Association (PMA) structure",
      "Right to contract privately",
      "Freedom of association and assembly",
      "Protection from regulatory overreach",
      "Member-to-member operation",
    ],
  },
  {
    icon: Target,
    title: "Root Cause Wellness",
    description: "We focus on identifying and addressing underlying causes, not just managing symptoms.",
    details: [
      "Comprehensive assessment approach",
      "Body, mind, spirit integration",
      "Prevention and reversal vs. management",
      "Cellular-level healing",
      "Holistic health assessment",
    ],
  },
  {
    icon: Leaf,
    title: "Natural & Organic",
    description: "Whole plant, organic therapeutics manufactured to the highest standards.",
    details: [
      "Non-GMO formulations",
      "CGMP manufactured products",
      "Phyto-therapeutics",
      "Clean, pure ingredients",
      "Sustainable sourcing",
    ],
  },
  {
    icon: Users,
    title: "Community First",
    description: "A collection of like-minded doctors, clinics, and members supporting each other.",
    details: [
      "Member-to-member education",
      "Nationwide clinic network",
      "Shared protocols and wisdom",
      "Community events and seminars",
      "Collaborative healing approach",
    ],
  },
];

const HEALTH_FOCUS_AREAS = [
  {
    title: "Minerals & Nutrition",
    icon: Sparkles,
    description: "Foundation of cellular health through proper mineral balance",
    topics: ["Trace minerals", "Whole plant vitamins", "ECS activation", "Sirtuin activation", "Nutritional supplementation"],
  },
  {
    title: "Peptides & Bioregulators",
    icon: Dna,
    description: "Cutting-edge peptide therapies for regeneration and healing",
    topics: ["Injectable peptides", "Oral peptides", "Bioregulators", "Advanced protocols", "Cellular signaling"],
  },
  {
    title: "Regenerative Medicine",
    icon: Zap,
    description: "Harnessing the body's natural healing capabilities",
    topics: ["Stem cell therapies", "Exosome modalities", "Cellular regeneration", "Anti-aging protocols", "Tissue repair"],
  },
  {
    title: "Alternative Therapies",
    icon: Activity,
    description: "Time-tested and innovative healing modalities",
    topics: ["Ozone therapy", "IV therapies", "Liposomal delivery", "Anti-parasitic protocols", "Quantum medicine"],
  },
];

const PMA_BENEFITS = [
  {
    title: "Privacy Protection",
    description: "Your health decisions and records remain private within our member community.",
    icon: Lock,
  },
  {
    title: "Freedom of Choice",
    description: "Access modalities not available through conventional channels.",
    icon: Scale,
  },
  {
    title: "Expert Network",
    description: "Connect with experienced practitioners who share your values.",
    icon: Users,
  },
  {
    title: "Educational Access",
    description: "Learn from comprehensive resources, protocols, and training materials.",
    icon: BookOpen,
  },
  {
    title: "Community Support",
    description: "Join a nationwide network of like-minded health seekers.",
    icon: HandHeart,
  },
  {
    title: "Constitutional Rights",
    description: "Protected by First and Fourteenth Amendment guarantees.",
    icon: Shield,
  },
];

const PHILOSOPHY_SECTIONS = [
  {
    id: "root-cause",
    title: "Root Cause Philosophy",
    content: `Our approach centers on identifying and addressing the fundamental causes of illness, rather than merely managing symptoms. We believe that true healing occurs when we go beyond surface-level approaches to understand what's really happening at the cellular level.

Every symptom is a message from your body. Instead of silencing these messages with medications that mask the problem, we work to decode what your body is telling you and address the underlying imbalances.

This means looking at nutrition, toxin exposure, mineral deficiencies, hormonal imbalances, and the interconnection of body systems. When we restore balance at the root level, the body's innate healing wisdom takes over.`,
  },
  {
    id: "old-timer",
    title: "Old Timer Wisdom",
    content: `Before the dominance of pharmaceutical corporations, generations of healers understood the power of natural remedies, whole foods, and the body's ability to heal itself when given the right support.

We honor this traditional wisdom while integrating cutting-edge science. The "forgotten formulas" that gave our organization its name are these time-tested remedies that worked for our grandparents and great-grandparents.

From mineral-rich soil to whole plant medicines, from proper nutrition to rest and recovery, these fundamentals of health remain as valid today as they were centuries ago. We simply have better tools now to understand why they work.`,
  },
  {
    id: "freedom",
    title: "Health Freedom",
    content: `The Constitution of the United States protects your fundamental right to make decisions about your own body and health. The First Amendment guarantees freedom of speech, religion, and the right to peacefully assemble. The Fourteenth Amendment guarantees due process and equal protection.

As a Private Member Association, we operate in the private arena, where members freely contract with each other for mutual benefit. This structure protects both practitioners and members who seek alternatives to conventional medicine.

We believe in informed consent, personal responsibility, and the freedom to explore healing modalities that resonate with your values and beliefs. Your body, your choice, your freedom.`,
  },
  {
    id: "science",
    title: "Science & Innovation",
    content: `While we honor traditional wisdom, we also embrace cutting-edge science and technology. Our approach combines the best of both worlds: time-tested natural remedies enhanced by modern research and innovation.

Peptide therapy, bioregulators, exosome modalities, and regenerative medicine represent the frontier of healing. We stay at the forefront of these developments, carefully vetting new therapies and making them available to our members.

Every product in our catalog comes with a Certificate of Analysis (COA), ensuring quality, purity, and potency. We believe in transparency and scientific rigor while maintaining respect for the mysteries of healing that science has yet to fully explain.`,
  },
];

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <main className="flex-1 overflow-auto">
      <div className="min-h-screen">
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">
                <Shield className="h-3 w-3 mr-1" />
                Private Member Association
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6" data-testid="text-page-title">
                Forgotten Formula PMA Handbook
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                The all-in-one ecosystem for true healing. AI and humanity coexisting to deliver genuine wellness outcomes,
                free from corporate stockholder influence.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/doctor/signup">
                  <Button size="lg" className="gap-2" data-testid="button-become-practitioner">
                    <Crown className="h-4 w-4" />
                    Become a Practitioner
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline" className="gap-2" data-testid="button-explore-products">
                    Explore Products
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="philosophy" data-testid="tab-philosophy">Philosophy</TabsTrigger>
              <TabsTrigger value="pma" data-testid="tab-pma">PMA Benefits</TabsTrigger>
              <TabsTrigger value="focus" data-testid="tab-focus">Health Focus</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                {CORE_PRINCIPLES.map((principle, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <principle.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{principle.title}</CardTitle>
                          <CardDescription className="mt-1">{principle.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {principle.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Our Mission</h3>
                      <p className="text-muted-foreground">
                        "Your Why Should Make You Cry" - We protect the good, the caring, and support curing over profits. 
                        Our mission is to empower individuals with the knowledge, resources, and community support 
                        to take control of their health journey. We believe in healing body, mind, and spirit through 
                        education, natural therapies, and constitutional freedom.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4">Ready to Begin Your Journey?</h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Join our community of healers, practitioners, and health-conscious individuals 
                  who are taking control of their wellness.
                </p>
                <div className="flex justify-center gap-4">
                  <Link href="/diane">
                    <Button variant="outline" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Ask Diane AI
                    </Button>
                  </Link>
                  <Link href="/resources">
                    <Button variant="outline" className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Explore Resources
                    </Button>
                  </Link>
                </div>
              </div>
              <FoundingFathersAboutSection />
            </TabsContent>

            <TabsContent value="philosophy" className="space-y-6">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Our Healing Philosophy</h2>
                  <p className="text-muted-foreground">
                    Understanding the principles that guide our approach to health and wellness
                  </p>
                </div>

                <Accordion type="single" collapsible className="space-y-4">
                  {PHILOSOPHY_SECTIONS.map((section) => (
                    <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="font-semibold">{section.title}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {section.content.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="text-muted-foreground mb-4 last:mb-0">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <Card className="mt-8 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Lightbulb className="h-6 w-6 text-amber-600 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                          The Forgotten Formula
                        </h4>
                        <p className="text-sm text-amber-700/80 dark:text-amber-300/80">
                          Our name reflects the wisdom that has been "forgotten" in modern medicine: that the body 
                          has an innate ability to heal when given proper nutrition, rest, and natural support. 
                          Before Big Pharma dominated healthcare, generations of healers knew these fundamental truths. 
                          We're here to remember and apply them with modern scientific understanding.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pma" className="space-y-8">
              <div className="text-center mb-8">
                <Badge variant="outline" className="mb-4">
                  <Scale className="h-3 w-3 mr-1" />
                  Legal Protection
                </Badge>
                <h2 className="text-2xl font-bold mb-2">Private Member Association Benefits</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  As a PMA, we operate in the private arena with constitutional protections that 
                  allow members to pursue alternative health options freely.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {PMA_BENEFITS.map((benefit, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <benefit.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{benefit.title}</h3>
                          <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="max-w-3xl mx-auto text-center">
                    <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-3">
                      Constitutional Protection
                    </h3>
                    <p className="text-blue-700/80 dark:text-blue-300/80 mb-4">
                      "We operate in the private arena only. Our organization invokes its First and Fourteenth 
                      Amendment rights. Members freely contract with other members for mutual benefit, protected 
                      by the right to assemble, the right to contract, and the right to privacy."
                    </p>
                    <Separator className="my-4 bg-blue-200 dark:bg-blue-800" />
                    <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                      All activities are member-to-member private transactions not subject to public sector regulations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="focus" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Health Focus Areas</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our comprehensive approach addresses health at multiple levels, from cellular nutrition 
                  to advanced regenerative therapies.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {HEALTH_FOCUS_AREAS.map((area, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <area.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{area.title}</CardTitle>
                          <CardDescription>{area.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {area.topics.map((topic, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Globe className="h-6 w-6 text-cyan-600 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-cyan-800 dark:text-cyan-200 mb-2">
                        Nationwide Network
                      </h4>
                      <p className="text-sm text-cyan-700/80 dark:text-cyan-300/80 mb-4">
                        Our growing network of practitioners includes doctors, chiropractors, naturopaths, 
                        and holistic healers across the country. From our Texas roots, we've expanded to 
                        serve members nationwide with the same commitment to quality and constitutional protection.
                      </p>
                      <Link href="/resources">
                        <Button variant="outline" size="sm" className="gap-2">
                          Find a Practitioner
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Star className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Join Our Growing Community</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Forgotten Formula PMA grew 1800% in its first full year. Our small, dedicated corporate team 
                ensures personal attention while our network of practitioners continues to expand nationwide.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/doctor/signup">
                  <Button size="lg" className="gap-2">
                    <Crown className="h-4 w-4" />
                    Practitioner Signup ($5,000)
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline">
                    Browse Products
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
