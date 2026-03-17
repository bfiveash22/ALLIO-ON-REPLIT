import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FFLogoFull } from "@/components/ff-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { VideoBackground, PEXELS_VIDEOS } from "@/components/video-background";
import { motion } from "framer-motion";
import { FoundingFathersSection } from "@/components/founding-fathers-section";

import allioIntroVideo from "@assets/videos/allio_logo_reveal_1080p.mp4";
import {
  Shield,
  Dna,
  Heart,
  Users,
  Award,
  Syringe,
  Pill,
  Activity,
  ChevronRight,
  CheckCircle2,
  Check,
  Star,
  Zap,
  Leaf,
  Lock,
  Waves,
  Sparkles,
  Target,
  Brain,
  Microscope,
  Network,
  RefreshCw,
  Droplets,
  Atom,
  HeartPulse,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Constitutional Protection",
    description:
      "Operating under First and Fourteenth Amendment protections as a Private Member Association.",
  },
  {
    icon: Dna,
    title: "Root Cause Wellness",
    description:
      "Focus on addressing the underlying causes of illness, not just managing symptoms.",
  },
  {
    icon: Heart,
    title: "Holistic Healing",
    description:
      "Integration of body, mind, and spirit for complete wellness and regeneration.",
  },
  {
    icon: Users,
    title: "Member Community",
    description:
      "A collection of like-minded doctors, clinics, and everyday Americans.",
  },
];

// 5 Stages of Wellness based on FFPMA 2026 Protocol
const stagesOfWellness = [
  {
    stage: 1,
    title: "Detox Phase",
    description: "Address toxin exposure, heavy metals, and environmental factors that undermine health.",
  },
  {
    stage: 2,
    title: "Periodontal Health",
    description: "Identify and resolve dental dangers including amalgam and oral infections.",
  },
  {
    stage: 3,
    title: "Gut Restoration",
    description: "Restore microbiota balance and optimize digestive function for nutrient absorption.",
  },
  {
    stage: 4,
    title: "Nutrient Optimization",
    description: "Address trace mineral deficiencies and restore cellular nutrient levels.",
  },
  {
    stage: 5,
    title: "Holistic Balance",
    description: "Optimize inflammation, viral load, and metabolic functionality at the cellular level.",
  },
];

// 5 Rs to Homeostasis Framework - Forgotten Formula Proprietary Protocol
const fiveRsToHomeostasis = [
  {
    step: 1,
    title: "Reduce",
    icon: Target,
    description: "Detoxification and parasite elimination. Remove heavy metals, environmental toxins, and parasitic organisms that burden cellular function.",
  },
  {
    step: 2,
    title: "Rebalance",
    icon: Droplets,
    description: "Gut biome restoration. Repopulate beneficial bacteria, restore microbiome diversity, and optimize digestive terrain for nutrient absorption.",
  },
  {
    step: 3,
    title: "Reactivate",
    icon: Network,
    description: "Endocannabinoid System (ECS) optimization. Restore receptor sensitivity and ligand pathways for whole-body homeostatic regulation.",
  },
  {
    step: 4,
    title: "Restore",
    icon: Heart,
    description: "Mitochondrial regeneration. Rebuild cellular energy production with Dr. Wallach's 90 essential nutrients - 60 minerals, 16 vitamins, 12 amino acids, and 3 essential fatty acids.",
  },
  {
    step: 5,
    title: "Revitalize",
    icon: Waves,
    description: "Mind-body-spirit integration. Holistic therapies including frequency medicine, meditation, breathwork, and lifestyle optimization for lasting wellness.",
  },
];

// Advanced Modalities
const advancedModalities = [
  {
    icon: Atom,
    title: "Quantum Therapies",
    description: "Frequency medicine and energy-based healing modalities that work at the quantum cellular level.",
    features: ["Scalar energy devices", "PEMF therapy", "Frequency generators", "Bio-resonance"],
  },
  {
    icon: Microscope,
    title: "Stem Cell Regeneration",
    description: "Advanced regenerative therapies harnessing the body's natural healing potential.",
    features: ["Exosome therapy", "Umbilical cord derived", "PRP protocols", "Growth factor activation"],
  },
  {
    icon: Target,
    title: "Cancer Terrain Mapping",
    description: "Systematic approach to understanding and addressing the metabolic terrain of cancer.",
    features: ["Pathway analysis", "Metabolic profiling", "Terrain assessment", "Protocol development"],
  },
  {
    icon: Network,
    title: "ECS Ligand Pathways",
    description: "Research-backed endocannabinoid system optimization from our Library's MasterListofECS database with 708 documented ligand-receptor interactions.",
    features: ["12 cannabinoids", "234 protein targets", "708 interactions", "8 disease domains"],
  },
];

const programs = [
  {
    icon: Microscope,
    title: "Live Blood Analysis",
    description:
      "Learn to identify health patterns through darkfield microscopy. See living blood cells reveal the body's true state.",
    badge: "Training",
    link: "/training",
  },
  {
    icon: Syringe,
    title: "IV Program",
    description:
      "Intravenous therapy protocols for optimal nutrient delivery and cellular regeneration.",
    badge: "Popular",
    link: "/programs",
  },
  {
    icon: Pill,
    title: "Peptide Program",
    description:
      "Advanced peptide protocols for healing, anti-aging, and performance optimization.",
    badge: "Advanced",
    link: "/programs",
  },
  {
    icon: Activity,
    title: "Protocols",
    description:
      "Comprehensive wellness protocols developed by our network of root cause practitioners.",
    badge: "Essential",
    link: "/protocols",
  },
];

// Product categories - NO PRICES for non-members (PMA privacy)
const productCategories = [
  {
    icon: Pill,
    name: "Peptides & Bioregulators",
    description: "Injectable and oral peptides for cellular regeneration and anti-aging.",
  },
  {
    icon: Zap,
    name: "MitoStac & Mitochondria",
    description: "Cellular energy optimization for peak mitochondrial function.",
  },
  {
    icon: Dna,
    name: "Exosomes",
    description: "Advanced regenerative therapy for tissue repair and rejuvenation.",
  },
  {
    icon: Leaf,
    name: "Vitamins & Minerals",
    description: "Whole plant vitamins and trace minerals for foundational health.",
  },
  {
    icon: Atom,
    name: "Quantum & Energy Devices",
    description: "PEMF, scalar energy, and frequency devices for cellular optimization.",
  },
  {
    icon: Microscope,
    name: "Stem Cell Biologics",
    description: "Regenerative stem cell and exosome therapies for advanced healing.",
  },
  {
    icon: Brain,
    name: "ECS Support",
    description: "Cannabinoid-based formulations for endocannabinoid system balance.",
  },
];

const testimonials = [
  {
    quote:
      "Forgotten Formula has given me the freedom to practice medicine the way it should be practiced - focused on healing, not profits. The AI support is incredible.",
    author: "Dr. Sarah M.",
    role: "Naturopathic Physician",
  },
  {
    quote:
      "The peptide protocols and AI-powered guidance have transformed my practice. My members are seeing results they never thought possible.",
    author: "Dr. James L.",
    role: "Chiropractor, D.C.",
  },
  {
    quote:
      "Finally, a platform where AI and human expertise work together for true healing. This is the future of healthcare.",
    author: "Michael R.",
    role: "Member",
  },
];

function formatCount(n: number): string {
  return n.toLocaleString();
}

function LandingStats() {
  const { data: stats, isLoading, isError } = useQuery<{
    memberCount: number;
    clinicCount: number;
    productCount: number;
    programCount: number;
  }>({
    queryKey: ["/api/public/stats"],
  });

  const items = [
    { key: "members", value: stats?.memberCount, label: "Active Members", color: "from-cyan-400 to-teal-400" },
    { key: "clinics", value: stats?.clinicCount, label: "Partner Clinics", color: "from-amber-400 to-orange-400" },
    { key: "products", value: stats?.productCount, label: "Products", color: "from-purple-400 to-pink-400" },
    { key: "programs", value: stats?.programCount, label: "Programs", color: "from-emerald-400 to-teal-400" },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-cyan-950/20">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 text-center md:grid-cols-4">
          {items.map((stat) => (
            <div key={stat.key} data-testid={`stat-${stat.key}`} className="p-6 rounded-xl bg-gradient-to-br from-card/50 to-transparent border border-cyan-500/20">
              <p className={`text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {isLoading ? "—" : isError ? "N/A" : formatCount(stat.value ?? 0)}
              </p>
              <p className="text-muted-foreground mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useTranslation();

  const getDashboardInfo = () => {
    if (!user) return { path: "/login", label: "Member Login" };

    let roles: string[] = [];
    if (Array.isArray(user.wpRoles)) {
      roles = user.wpRoles;
    } else if (typeof user.wpRoles === 'string') {
      try {
        roles = JSON.parse(user.wpRoles);
      } catch (e) {
        roles = user.wpRoles.split(',').map((r: string) => r.trim());
      }
    }

    const email = user.email?.toLowerCase() || '';
    if (roles.includes('administrator') || email.includes('blake')) {
      return { path: "/trustee", label: "Trustee Portal" };
    }
    if (roles.includes('clinic_owner')) {
      return { path: "/clinic", label: "Clinic Portal" };
    }
    if (roles.includes('doctor')) {
      return { path: "/doctors", label: "Doctor Portal" };
    }
    return { path: "/member", label: "Member Dashboard" };
  };

  const dbInfo = getDashboardInfo();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-cyan-500/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <Link href="/" data-testid="link-home-logo">
            <FFLogoFull />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated && (
              <Link
                href="/products"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                data-testid="link-nav-products"
              >
                {t('nav.products')}
              </Link>
            )}
            <Link
              href="/training"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              data-testid="link-nav-training"
            >
              {t('nav.training')}
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              data-testid="link-nav-about"
            >
              {t('nav.about')}
            </Link>
            <Link
              href="/doctor/signup"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              data-testid="link-nav-doctors"
            >
              {t('nav.forDoctors')}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {isLoading ? (
              <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
            ) : isAuthenticated ? (
              <Link href={dbInfo.path}>
                <Button data-testid="button-dashboard">
                  {dbInfo.label}
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button data-testid="button-login">
                  Member Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <VideoBackground
          videoUrl={PEXELS_VIDEOS.oceanWaves}
          fallbackImage="/assets/allio_hero_banner_landscape.png"
          overlay="bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-cyan-900/50"
          className="py-24 lg:py-32"
        >
          <div className="container mx-auto px-4">
            <motion.div 
              className="mx-auto max-w-3xl text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, staggerChildren: 0.2 }}
            >
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.5 }}>
                <Badge className="mb-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white border-0 px-5 py-2 text-sm font-semibold shadow-lg shadow-teal-500/25 cursor-default">
                  <Shield className="mr-2 h-4 w-4" />
                  {t('landing.pma')}
                </Badge>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.5 }}>
                <Badge className="mb-4 bg-gradient-to-r from-amber-500/90 to-orange-500/90 hover:from-amber-400 hover:to-orange-400 text-white border-0 px-5 py-2 text-sm font-semibold shadow-lg shadow-amber-500/25 cursor-default">
                  <Zap className="mr-2 h-4 w-4" />
                  ALLIO v1 Launches April 1, 2026
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="mb-6 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white drop-shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                {t('landing.heroTitle')}
              </motion.h1>
              
              <motion.p 
                className="mb-4 text-xl md:text-2xl font-semibold bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {t('landing.heroSubtitle')}
              </motion.p>
              
              <motion.p 
                className="mb-6 text-lg text-gray-200 sm:text-xl max-w-2xl mx-auto drop-shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {t('landing.heroDescription')}
              </motion.p>
              
              <motion.p 
                className="mb-8 text-base text-gray-300 italic drop-shadow-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                "{t('landing.heroQuote')}"
              </motion.p>
              
              <motion.div 
                className="flex flex-col gap-4 sm:flex-row sm:justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                {isAuthenticated ? (
                  <>
                    <Link href={dbInfo.path}>
                      <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold px-8 shadow-xl shadow-amber-500/30 transition-all hover:scale-105" data-testid="button-hero-dashboard">
                        {dbInfo.label}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/products">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-2 border-cyan-400/80 text-white hover:bg-cyan-500/20 hover:border-cyan-300 backdrop-blur-sm transition-all"
                        data-testid="button-hero-products"
                      >
                        {t('landing.browseProducts')}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/become-a-member">
                      <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold px-8 shadow-xl shadow-amber-500/30 transition-all hover:scale-105" data-testid="button-hero-join">
                        Become a Member
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-2 border-cyan-400/80 text-white hover:bg-cyan-500/20 hover:border-cyan-300 backdrop-blur-sm transition-all"
                        data-testid="button-hero-login"
                      >
                        Member Login
                      </Button>
                    </Link>
                    <Link href="/doctor/signup">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-2 border-cyan-400/80 text-white hover:bg-cyan-500/20 hover:border-cyan-300 backdrop-blur-sm transition-all text-center"
                        data-testid="button-hero-doctors"
                      >
                        {t('nav.forDoctors')}
                      </Button>
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </VideoBackground>

        {/* Intro Video Section */}
        <section className="border-t border-cyan-500/30 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
              <Badge variant="outline" className="mb-4">
                {t('landing.welcomeToAllio')}
              </Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight">
                The Future of Healing
              </h2>
            </div>
            <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-border/50 shadow-2xl relative">
              <video
                src={allioIntroVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full aspect-video object-cover"
                data-testid="video-intro"
              />
              <div
                className="absolute inset-x-0 bottom-[18%] flex items-center justify-center pointer-events-none select-none"
                aria-hidden="true"
              >
                <span
                  className="text-[clamp(0.9rem,2.8vw,1.75rem)] font-bold tracking-wide bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-400 bg-clip-text text-transparent drop-shadow-lg"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}
                >
                  The All-In-One Healing Ecosystem
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-cyan-500/30 py-16 lg:py-24 bg-gradient-to-b from-background via-cyan-950/10 to-background">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Why Choose Forgotten Formula PMA?
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                AI-powered precision meets human wisdom and care.
                Together, we create a healthcare ecosystem free from corporate stockholder influence.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="border-cyan-500/30 bg-gradient-to-br from-card via-card to-cyan-950/20 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
                  data-testid={`card-feature-${index}`}
                >
                  <CardHeader>
                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30">
                      <feature.icon className="h-7 w-7 text-cyan-400" />
                    </div>
                    <CardTitle className="text-lg text-cyan-50">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <FoundingFathersSection />

        <VideoBackground
          videoUrl={PEXELS_VIDEOS.abstractLiquid}
          overlay="bg-gradient-to-br from-slate-900/90 via-amber-950/30 to-slate-900/90"
          className="py-16 lg:py-24"
        >
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <Badge className="mb-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300">
                Our Programs
              </Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                Comprehensive Healing Programs
              </h2>
              <p className="mx-auto max-w-2xl text-gray-300">
                Advanced protocols and programs designed by root cause doctors
                for optimal health and healing.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {programs.map((program, index) => (
                <Card
                  key={index}
                  className="relative overflow-visible border-amber-500/30 bg-gradient-to-br from-card/95 via-card/90 to-amber-950/30 backdrop-blur-sm hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
                  data-testid={`card-program-${index}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-500/40">
                        <program.icon className="h-7 w-7 text-amber-400" />
                      </div>
                      <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0">{program.badge}</Badge>
                    </div>
                    <CardTitle className="mt-4 text-amber-50">{program.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-gray-400">
                      {program.description}
                    </p>
                    <Button
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/20"
                      asChild
                      data-testid={`button-program-${index}`}
                    >
                      <Link href={program.link}>Learn More</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </VideoBackground>

        {/* 5 Stages of Wellness Section */}
        <section className="border-t border-cyan-500/30 py-16 lg:py-24 bg-gradient-to-b from-background via-teal-950/10 to-background">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <Badge className="mb-4 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border-teal-500/40 text-teal-300">
                The Allio Healing Framework
              </Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                5 Stages of Wellness
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground italic">
                "Before you heal someone, ask them if they're willing to give up the things that make them sick."
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              {stagesOfWellness.map((stage, index) => (
                <Card
                  key={index}
                  className="border-teal-500/30 bg-gradient-to-br from-card via-card to-teal-950/20 text-center hover:border-teal-400/50 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300"
                  data-testid={`card-stage-${index}`}
                >
                  <CardHeader className="pb-2">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold text-xl shadow-lg shadow-teal-500/30">
                      {stage.stage}
                    </div>
                    <CardTitle className="text-base text-teal-50">{stage.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {stage.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 5 Rs to Homeostasis Section */}
        <VideoBackground
          videoUrl={PEXELS_VIDEOS.waterSurface}
          overlay="bg-gradient-to-br from-slate-900/85 via-purple-950/30 to-slate-900/85"
          className="py-16 lg:py-24"
        >
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <Badge className="mb-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300">
                Functional Medicine Framework
              </Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                The 5 Rs to Homeostasis
              </h2>
              <p className="mx-auto max-w-2xl text-gray-300">
                A systematic approach to restoring balance and optimal function to the body's interconnected systems.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              {fiveRsToHomeostasis.map((item, index) => (
                <Card
                  key={index}
                  className="border-purple-500/30 bg-gradient-to-br from-card/95 via-card/90 to-purple-950/30 backdrop-blur-sm text-center hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
                  data-testid={`card-5r-${index}`}
                >
                  <CardHeader className="pb-2">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/20 border border-purple-500/40">
                      <item.icon className="h-7 w-7 text-purple-400" />
                    </div>
                    <CardTitle className="text-base text-purple-50">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </VideoBackground>

        {/* Advanced Modalities Section */}
        <section className="border-t border-cyan-500/30 py-16 lg:py-24 bg-gradient-to-b from-background via-emerald-950/10 to-background">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <Badge className="mb-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300">
                Cutting-Edge Therapies
              </Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Advanced Wellness Modalities
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Beyond conventional medicine, we integrate the latest advancements in regenerative and energy medicine.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {advancedModalities.map((modality, index) => (
                <Card
                  key={index}
                  className="border-emerald-500/30 bg-gradient-to-br from-card via-card to-emerald-950/20 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
                  data-testid={`card-modality-${index}`}
                >
                  <CardHeader>
                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                      <modality.icon className="h-7 w-7 text-emerald-400" />
                    </div>
                    <CardTitle className="text-lg text-emerald-50">{modality.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {modality.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {modality.features.map((feature, fIndex) => (
                        <Badge key={fIndex} className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20" asChild data-testid="button-explore-modalities">
                <Link href="/training">
                  Explore Training Programs
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ECS Research Library Section */}
        <VideoBackground
          videoUrl={PEXELS_VIDEOS.cosmicEnergy}
          overlay="bg-gradient-to-br from-slate-900/90 via-indigo-950/30 to-slate-900/90"
          className="py-16 lg:py-24"
        >
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <Badge className="mb-4 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border-indigo-500/40 text-indigo-300">
                  Research Library
                </Badge>
                <h2 className="mb-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                  Endocannabinoid System Research
                </h2>
                <p className="mb-6 text-muted-foreground">
                  Our Library contains the comprehensive <strong>MasterListofECS</strong> research database documenting the complete endocannabinoid system with 12 primary cannabinoid ligands, 234 protein targets, and 708 documented ligand-receptor interactions across 8 major disease domains.
                </p>
                <div className="mb-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 dark:bg-cyan-500/30">
                      <Check className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <strong className="text-foreground">CBD, THC, CBG, CBN, CBC, THCV & More</strong>
                      <p className="text-sm text-muted-foreground">12 primary cannabinoid compounds with detailed receptor affinity data</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 dark:bg-cyan-500/30">
                      <Check className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <strong className="text-foreground">CB1, CB2 & TRPV1 Receptor Pathways</strong>
                      <p className="text-sm text-muted-foreground">Comprehensive mapping of receptor targets and therapeutic applications</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 dark:bg-cyan-500/30">
                      <Check className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <strong className="text-foreground">Disease Domain Integration</strong>
                      <p className="text-sm text-muted-foreground">Pain, inflammation, neurodegeneration, cancer, metabolic & more</p>
                    </div>
                  </div>
                </div>
                {isAuthenticated ? (
                  <Button asChild data-testid="button-explore-library">
                    <Link href="/library">
                      Explore Research Library
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild data-testid="button-join-for-research">
                    <Link href="/login">
                      Join to Access Research
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
              <div className="relative">
                <Card className="border-indigo-500/30 bg-gradient-to-br from-card/95 via-card/90 to-indigo-950/30 backdrop-blur-sm p-6 hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30">
                      <Network className="h-7 w-7 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-indigo-50">ECS Pathway Database</h3>
                      <p className="text-sm text-indigo-300/80">MasterListofECS.xlsx</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-transparent p-4 text-center">
                      <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">12</div>
                      <div className="text-xs text-gray-400">Cannabinoid Ligands</div>
                    </div>
                    <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-transparent p-4 text-center">
                      <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">234</div>
                      <div className="text-xs text-gray-400">Protein Targets</div>
                    </div>
                    <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-transparent p-4 text-center">
                      <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">708</div>
                      <div className="text-xs text-gray-400">Receptor Interactions</div>
                    </div>
                    <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-transparent p-4 text-center">
                      <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">8</div>
                      <div className="text-xs text-gray-400">Disease Domains</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </VideoBackground>

        {/* Premium Products Section - NO PRICES for non-members */}
        <section className="border-t border-cyan-500/30 py-16 lg:py-24 bg-gradient-to-b from-background via-rose-950/10 to-background">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                Premium Member Products
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                CGMP manufactured, whole plant, organic therapeutics with
                Certificates of Analysis. Exclusively available to PMA members.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {productCategories.map((category, index) => (
                <Card
                  key={index}
                  className="border-rose-500/30 bg-gradient-to-br from-card via-card to-rose-950/20 hover:border-rose-400/50 hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300"
                  data-testid={`card-product-preview-${index}`}
                >
                  <CardHeader className="pb-2">
                    <div className="mb-2 aspect-square rounded-xl bg-gradient-to-br from-rose-500/20 via-amber-500/10 to-cyan-500/20 border border-rose-500/30 flex items-center justify-center">
                      <category.icon className="h-16 w-16 text-rose-400" />
                    </div>
                    <CardTitle className="text-base text-rose-50">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    {isAuthenticated ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        asChild
                        data-testid={`button-browse-${index}`}
                      >
                        <Link href="/products">Browse Products</Link>
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground py-2">
                        <Lock className="h-4 w-4" />
                        <span className="text-sm">Members Only</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              {isAuthenticated ? (
                <Button asChild data-testid="button-view-all-products">
                  <Link href="/products">
                    View All Products
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Become a member to access our full product catalog and exclusive pricing.
                  </p>
                  <Button asChild data-testid="button-join-for-products">
                    <Link href="/login">
                      Member Login
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-gradient-to-b from-background via-amber-950/10 to-background">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <Badge className="mb-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-300">
                Member Testimonials
              </Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                What Our Members Say
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className="border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-950/20 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300"
                  data-testid={`card-testimonial-${index}`}
                >
                  <CardContent className="pt-6">
                    <div className="mb-4 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <blockquote className="mb-4 text-gray-300 italic">
                      "{testimonial.quote}"
                    </blockquote>
                    <div>
                      <p className="font-semibold text-amber-50">{testimonial.author}</p>
                      <p className="text-sm text-amber-300/80">
                        {testimonial.role}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <VideoBackground
          videoUrl={PEXELS_VIDEOS.waterDroplets}
          overlay="bg-gradient-to-br from-cyan-900/90 via-teal-900/80 to-slate-900/90"
          className="border-t py-16 lg:py-24"
        >
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white drop-shadow-lg">
              Ready to Take Control of Your Health?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-cyan-100/90">
              Join our network of root cause doctors, clinics, and members
              committed to true healing.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold shadow-xl shadow-amber-500/30 transition-all hover:scale-105"
                asChild
                data-testid="button-cta-join"
              >
                <Link href="/login">
                  Member Login
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-cyan-400/80 text-white hover:bg-cyan-500/20 hover:border-cyan-300 backdrop-blur-sm transition-all"
                asChild
                data-testid="button-cta-doctors"
              >
                <Link href="/doctor/signup">For Doctors & Clinics</Link>
              </Button>
            </div>
          </div>
        </VideoBackground>

        <LandingStats />
      </main>

      <footer className="border-t border-cyan-500/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <FFLogoFull className="mb-4" />
              <p className="text-sm text-muted-foreground">
                Private Member Association protected by the First and Fourteenth
                Amendments.
              </p>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">
                {isAuthenticated ? "Products" : "Membership"}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {isAuthenticated ? (
                  <>
                    <li>
                      <Link href="/products?category=peptides">Peptides</Link>
                    </li>
                    <li>
                      <Link href="/products?category=vitamins">Vitamins</Link>
                    </li>
                    <li>
                      <Link href="/products?category=exosomes">Exosomes</Link>
                    </li>
                    <li>
                      <Link href="/products?category=iv-supplies">IV Supplies</Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/become-a-member" className="text-primary font-medium">Become a Member</Link>
                    </li>
                    <li>
                      <Link href="/login">Member Login</Link>
                    </li>
                    <li>
                      <Link href="/doctor/signup">For Doctors</Link>
                    </li>
                    <li>
                      <Link href="/training">Training</Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">Programs</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/programs">IV Program</Link>
                </li>
                <li>
                  <Link href="/programs">Peptide Program</Link>
                </li>
                <li>
                  <Link href="/protocols">Protocols</Link>
                </li>
                <li>
                  <Link href="/resources">Resources</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about">About Us</Link>
                </li>
                <li>
                  <Link href="/doctor/signup">For Doctors</Link>
                </li>
                <li>
                  <Link href="/support">Support Hub</Link>
                </li>
                <li>
                  <Link href="/training">Training</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-cyan-500/30 pt-8 text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Allio v1. All rights
              reserved.
            </p>
            <p className="mt-2">
              Located in Justin, TX 76247 | Private Member Association
            </p>
            <p className="mt-4 max-w-3xl mx-auto text-xs text-muted-foreground/70 leading-relaxed">
              PMA Disclaimer: Forgotten Formula PMA is a Private Member Association operating in the private domain under the protections of the First and Fourteenth Amendments to the United States Constitution. The information provided on this platform is for educational purposes only and is shared exclusively among private members. Nothing on this platform constitutes medical advice, a diagnosis, or a prescription. All wellness protocols, assessments, and educational materials are shared member-to-member and do not create a trustee-member relationship. Members assume full responsibility for their own health decisions. By accessing this platform, you acknowledge that you are a private member exercising your constitutional rights.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
              <Link href="/legal/pma-agreement" className="text-cyan-400 hover:text-cyan-300 transition-colors">PMA Agreement</Link>
              <span className="text-muted-foreground">|</span>
              <Link href="/legal/privacy-policy" className="text-cyan-400 hover:text-cyan-300 transition-colors">Privacy Policy</Link>
              <span className="text-muted-foreground">|</span>
              <Link href="/legal/terms" className="text-cyan-400 hover:text-cyan-300 transition-colors">Terms of Service</Link>
              <span className="text-muted-foreground">|</span>
              <Link href="/legal/doctor-agreement" className="text-cyan-400 hover:text-cyan-300 transition-colors">Doctor Agreement</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
