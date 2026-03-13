import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Calculator,
  BookOpen,
  GraduationCap,
  FileText,
  ExternalLink,
  Video,
  Users,
  Heart,
  Headphones,
  Dna,
  Salad,
  Truck,
  Package,
  Sparkles,
  ArrowRight,
  Leaf,
  Microscope,
  Palette,
  Image,
  Shield,
  Droplets,
  FlaskConical,
  Footprints,
  Zap,
  Wind,
  Atom,
  Brain,
} from "lucide-react";
import { allResearchDocuments } from "./advanced-research-data";

const aiConsoles = [
  {
    title: "Support Hub",
    description: "Connect with our team of specialized AI support agents for any questions",
    icon: Headphones,
    href: "/support",
    badge: "AI Hub",
    badgeColor: "bg-amber-500 text-black",
    color: "bg-slate-100 dark:bg-slate-800/50",
    iconColor: "text-slate-600 dark:text-slate-300",
    agents: ["Pete - Peptides", "Diane - Nutrition", "Sam - Shipping", "Pat - Products"],
  },
  {
    title: "Diane the Dietician",
    description: "British-accented nutrition specialist with expertise in healing diets",
    icon: Salad,
    href: "/diane",
    badge: "AI Agent",
    badgeColor: "bg-teal-500 text-white",
    color: "bg-teal-100 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
    agents: ["Candida Diet", "Keto", "Gerson Therapy", "Dr. Wallach"],
  },
  {
    title: "FF Peptide Console",
    description: "AI-powered peptide guidance and protocol recommendations",
    icon: Dna,
    href: "/resources/peptide-console",
    badge: "AI Tool",
    badgeColor: "bg-amber-500 text-black",
    color: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    agents: ["BPC-157", "TB-500", "GLP-1", "Bioregulators"],
  },
];

const healingProtocols = [
  {
    title: "Gut Microbiome Restoration",
    description: "Comprehensive protocol for restoring gut microbiome balance through nutrition and supplementation",
    icon: Shield,
    slug: "gut-microbiome-restoration",
    category: "Gut Health",
  },
  {
    title: "Parasite Cleansing Protocol",
    description: "Evidence-based parasite elimination using herbal and nutritional approaches",
    icon: Droplets,
    slug: "parasite-protocol",
    category: "Parasite Cleansing",
  },
  {
    title: "IV Therapy Standards",
    description: "Clinical standards for Myers' Cocktail, high-dose vitamin C, NAD+, and glutathione",
    icon: FlaskConical,
    slug: "iv-therapy-standards",
    category: "IV Therapy",
  },
  {
    title: "Toxicology & Detox Protocols",
    description: "Detoxification protocols for heavy metals, mold, and environmental toxins",
    icon: Wind,
    slug: "toxicology-detox-protocols",
    category: "Detox",
  },
  {
    title: "Earthing & Grounding",
    description: "Reduce inflammation and improve sleep through Earth's natural electrical balance",
    icon: Footprints,
    slug: "earthing-grounding-protocol",
    category: "Earthing",
  },
  {
    title: "Stem Cell Therapy FAQ",
    description: "Guidelines for stem cell therapy and natural stem cell activation strategies",
    icon: Dna,
    slug: "stem-cell-faq",
    category: "Stem Cell",
  },
  {
    title: "Ozone Therapy Protocol",
    description: "Clinical ozone therapy covering MAH, rectal insufflation, and home-use protocols",
    icon: Zap,
    slug: "ozone-therapy-protocol",
    category: "Ozone Therapy",
  },
];

const resources = [
  {
    title: "Dosage Calculator",
    description: "Calculate peptide reconstitution and IV dosages",
    icon: Calculator,
    href: "/resources/dosage-calculator",
    badge: "Tool",
    color: "secondary",
  },
  {
    title: "ECS Assessment Tool",
    description: "Evaluate your Endocannabinoid System health and get personalized support recommendations",
    icon: Leaf,
    href: "/resources/ecs-tool",
    badge: "New",
    color: "secondary",
  },
  {
    title: "Blood Sample Library",
    description: "AI-powered blood microscopy analysis with comprehensive sample reference library",
    icon: Microscope,
    href: "/resources/blood-samples",
    badge: "AI",
    color: "secondary",
  },
  {
    title: "Marketing Studio",
    description: "AI-powered image and asset generation for healing-focused marketing",
    icon: Palette,
    href: "/resources/marketing-studio",
    badge: "AI",
    color: "secondary",
  },
  {
    title: "Asset Gallery",
    description: "Browse ALLIO brand assets from Drive - 100+ images for marketing",
    icon: Image,
    href: "/resources/asset-gallery",
    badge: "Media",
    color: "secondary",
  },
  {
    title: "Training Hub",
    description: "Learn peptide protocols and product usage",
    icon: GraduationCap,
    href: "/training",
    badge: "Active",
    color: "secondary",
  },
  {
    title: "Learning Library",
    description: "Access protocols, articles, and training materials",
    icon: BookOpen,
    href: "/library",
    badge: "New",
    color: "secondary",
  },
];

const partners = [
  {
    name: "Integrative Peptides",
    url: "https://integrativepeptides.com/",
    logo: "https://www.forgottenformula.com/wp-content/uploads/2025/01/logo-3-300x43.webp",
  },
  {
    name: "Pulsed Technologies",
    url: "https://pulsedtech.com/",
    logo: "https://www.forgottenformula.com/wp-content/uploads/2025/12/Pulsed-Technologies-logo-300x300.png",
  },
  {
    name: "Holistic Care",
    url: "https://holisticcare.com/",
    logo: "https://www.forgottenformula.com/wp-content/uploads/2025/01/cropped-HOLISTIC-AZUL-1536x407-1-1-1-300x79.webp",
  },
  {
    name: "American BioDental",
    url: "https://americanbiodental.com/",
    logo: "https://www.forgottenformula.com/wp-content/uploads/2025/01/americanbiodental-logo-300px-300x121.webp",
  },
  {
    name: "Holtorf Medical",
    url: "https://holtorfmed.com/",
    logo: "https://www.forgottenformula.com/wp-content/uploads/2025/01/holtorf-300x169.png",
  },
];

export default function ResourcesPage() {
  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="text-page-title">
            Resources
          </h1>
          <p className="text-muted-foreground">
            AI-powered tools, training, and educational materials for our members
          </p>
        </div>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">AI-Powered Consoles</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Connect with our specialized AI agents for personalized guidance and support
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {aiConsoles.map((console) => (
              <Card
                key={console.title}
                className="hover-elevate overflow-hidden"
                data-testid={`card-console-${console.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${console.color}`}>
                      <console.icon className={`h-6 w-6 ${console.iconColor}`} />
                    </div>
                    <Badge className={console.badgeColor}>
                      {console.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{console.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {console.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {console.agents.map((agent, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {agent}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                    asChild
                    data-testid={`button-console-${console.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={console.href}>
                      Open Console
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Healing Protocols</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Evidence-based healing protocols covering gut health, detox, IV therapy, and regenerative medicine
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {healingProtocols.map((protocol) => (
              <Card
                key={protocol.slug}
                className="hover-elevate"
                data-testid={`card-protocol-${protocol.slug}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <protocol.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary">{protocol.category}</Badge>
                  </div>
                  <CardTitle className="text-base mt-3">{protocol.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {protocol.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild
                    data-testid={`button-protocol-${protocol.slug}`}
                  >
                    <Link href={`/library/${protocol.slug}`}>
                      Read Protocol
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Tools & Training</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <Card
                key={resource.title}
                className={`hover-elevate ${resource.color === "muted" ? "opacity-60" : ""}`}
                data-testid={`card-resource-${resource.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary/10">
                      <resource.icon className="h-5 w-5 text-secondary" />
                    </div>
                    <Badge variant={resource.color === "muted" ? "outline" : "secondary"}>
                      {resource.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-3">{resource.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild={resource.color !== "muted"}
                    disabled={resource.color === "muted"}
                    data-testid={`button-resource-${resource.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {resource.color !== "muted" ? (
                      <Link href={resource.href}>
                        Open Tool
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    ) : (
                      <span>Coming Soon</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="h-5 w-5 text-purple-500" />
            <h2 className="text-xl font-semibold">Science & Research</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Advanced research documents from our QUANTUM and ENTHEOS divisions
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allResearchDocuments.map((doc) => {
              const iconMap: Record<string, typeof Atom> = {
                "QUANTUM (Science Division)": Atom,
                "ENTHEOS (Consciousness Division)": Brain,
              };
              const DocIcon = iconMap[doc.division] || FlaskConical;
              return (
                <Card
                  key={doc.slug}
                  className="hover-elevate"
                  data-testid={`card-research-${doc.slug}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/30">
                        <DocIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <Badge className="bg-purple-500 text-white">
                        Research
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-3">{doc.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {doc.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {doc.division}
                      </Badge>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/resources/research/${doc.slug}`}>
                        Read Document
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="hover-elevate">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">My Contracts</h3>
                  <p className="text-sm text-muted-foreground">View and sign membership documents</p>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/contracts">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary/10">
                  <Video className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">YouTube Channel</h3>
                  <p className="text-sm text-muted-foreground">Watch educational videos</p>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://www.youtube.com/channel/UCV86meeh-ww1LzuL2gD_CSw" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-cyan-500/10">
                  <Users className="h-6 w-6 text-cyan-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Contact Support</h3>
                  <p className="text-sm text-muted-foreground">Email: Kami@forgottenformula.com</p>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <a href="mailto:Kami@forgottenformula.com">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Partner Network</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Special Member Discounts with Our Partners
              </CardTitle>
              <CardDescription>
                Exclusive offers for Forgotten Formula PMA members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {partners.map((partner) => (
                  <a
                    key={partner.name}
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center justify-center rounded-md border p-4 transition-colors hover:bg-muted/50"
                    data-testid={`link-partner-${partner.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="h-12 w-auto object-contain opacity-70 transition-opacity group-hover:opacity-100"
                    />
                    <span className="mt-2 text-xs text-muted-foreground text-center">
                      {partner.name}
                    </span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
