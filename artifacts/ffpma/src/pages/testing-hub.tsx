import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  TestTubes,
  Droplets,
  Dna,
  Bug,
  Leaf,
  Heart,
  ArrowLeft,
  ExternalLink,
  Package,
  Clock,
  Shield,
  CheckCircle,
  Star,
  Truck,
  FlaskConical,
  Microscope,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface TestingPartner {
  name: string;
  website: string;
  location: string;
  category: string[];
  whiteLabel: boolean;
  apiIntegration: boolean;
  minOrder: string;
  turnaround: string;
  certifications: string[];
  tests: string[];
  description: string;
  highlight?: string;
  recommended?: boolean;
}

const testingPartners: TestingPartner[] = [
  {
    name: "Choose Health",
    website: "choosehealth.io/white-label",
    location: "United States",
    category: ["blood", "hormones"],
    whiteLabel: true,
    apiIntegration: true,
    minOrder: "Contact",
    turnaround: "3-5 days",
    certifications: ["CLIA", "CAP"],
    tests: ["Total Testosterone", "Free Testosterone", "SHBG", "PSA", "Estradiol", "Thyroid Panel", "Vitamin D", "Cholesterol"],
    description: "Full white-label DBS kits with custom branding, API integration for results delivery into ALLIO, and ~100 biomarkers available.",
    highlight: "Fastest launch (2-6 weeks), full API for platform integration",
    recommended: true,
  },
  {
    name: "SiPhox Health",
    website: "siphoxhealth.com",
    location: "United States",
    category: ["blood"],
    whiteLabel: true,
    apiIntegration: true,
    minOrder: "30 kits",
    turnaround: "3-5 days",
    certifications: ["CLIA"],
    tests: ["30-50 Blood Biomarkers", "Hormones", "Cholesterol", "Vitamin D", "Metabolic Markers"],
    description: "Low minimum orders with gray-label at 100 kits, full white-label at 500 kits. Quick 1-week onboarding with admin dashboard.",
    highlight: "Lowest barrier to entry — 30 kit minimum",
    recommended: true,
  },
  {
    name: "ZRT Laboratory",
    website: "zrtlab.com",
    location: "United States",
    category: ["blood", "hormones"],
    whiteLabel: true,
    apiIntegration: false,
    minOrder: "Contact",
    turnaround: "5-7 days",
    certifications: ["CLIA"],
    tests: ["Testosterone", "Estradiol", "Progesterone", "DHEA-S", "Cortisol", "Thyroid (TSH, T3, T4)", "PSA", "SHBG", "Vitamin D"],
    description: "Pioneer in DBS hormone testing. 11M+ tests processed. Used by CDC, NIH, and universities worldwide. Gold standard for hormone panels.",
    highlight: "Industry leader — 11 million tests, CDC/NIH partner",
  },
  {
    name: "Vitas Analytical Services",
    website: "vitas.no",
    location: "Oslo, Norway",
    category: ["blood", "omega"],
    whiteLabel: true,
    apiIntegration: false,
    minOrder: "100 kits",
    turnaround: "10-20 days",
    certifications: ["GMP", "CE-IVD"],
    tests: ["Omega-3/6 Ratio", "11 Fatty Acids", "Vitamin D", "HbA1c", "Gut Metabolites (IPA, Kynurenine)"],
    description: "Zinzino's lab partner. 2M+ DBS samples processed. GMP-certified contract lab with 28+ years experience. Kit manufacturing included.",
    highlight: "Zinzino's partner — proven at-scale DBS model",
  },
  {
    name: "imaware",
    website: "poweredbyimaware.com",
    location: "United States",
    category: ["blood"],
    whiteLabel: true,
    apiIntegration: true,
    minOrder: "Contact",
    turnaround: "Varies",
    certifications: ["CLIA", "CAP"],
    tests: ["Custom Health Panels", "Autoimmune", "Heart Health", "Metabolic"],
    description: "'Powered by imaware' program connects brands to top-tier labs with secure data infrastructure and custom test development.",
    highlight: "Full infrastructure for custom test development",
  },
  {
    name: "Vibrant Wellness",
    website: "vibrantwellness.com",
    location: "United States",
    category: ["blood", "toxins", "mold", "gut"],
    whiteLabel: false,
    apiIntegration: false,
    minOrder: "Contact",
    turnaround: "5-10 days",
    certifications: ["CLIA", "CAP"],
    tests: ["Total Tox Burden (20 Heavy Metals)", "Mycotoxins", "Pesticides", "Environmental Toxins", "Micronutrient Panel"],
    description: "Comprehensive toxin testing combining heavy metals, mycotoxins, and pesticides in one panel. Strong functional medicine focus.",
    highlight: "Total Tox Burden — metals + mycotoxins + pesticides in one test",
  },
  {
    name: "Diagnostic Solutions (GI-MAP)",
    website: "diagnosticsolutionslab.com",
    location: "United States",
    category: ["gut"],
    whiteLabel: false,
    apiIntegration: false,
    minOrder: "Practitioner account",
    turnaround: "5-7 days",
    certifications: ["CLIA"],
    tests: ["GI Pathogens", "Bacteria", "Parasites", "Fungi", "Inflammation Markers", "Immune Function"],
    description: "Gold standard GI-MAP stool test. Practitioner-ordered only, fits the FFPMA doctor network model perfectly.",
    highlight: "Gold standard gut test for practitioners",
  },
  {
    name: "tellmeGen",
    website: "tellmegen.com",
    location: "International",
    category: ["dna"],
    whiteLabel: true,
    apiIntegration: true,
    minOrder: "Contact",
    turnaround: "4-6 weeks",
    certifications: ["CE-IVD"],
    tests: ["430+ Health Reports", "Ancestry", "Drug Response", "Nutrigenetics", "Disease Risk", "Carrier Status"],
    description: "DNA testing with dedicated B2B portal. Accepts raw data from 23andMe/MyHeritage. 13M+ variants analyzed across 430+ reports.",
    highlight: "B2B portal ready — 430+ genetic health reports",
  },
  {
    name: "Doctor's Data",
    website: "doctorsdata.com",
    location: "United States",
    category: ["toxins"],
    whiteLabel: false,
    apiIntegration: false,
    minOrder: "Practitioner account",
    turnaround: "7-10 days",
    certifications: ["CLIA"],
    tests: ["31 Heavy Metal Toxins (Hair)", "Essential Elements", "Nutritional Analysis"],
    description: "Hair mineral analysis testing 31 toxins from just 0.25g of hair. CLIA accredited with established practitioner program.",
    highlight: "Hair analysis — non-invasive, 31 toxins tested",
  },
  {
    name: "MyLabs Direct",
    website: "mylabsdirect.com/partner-with-us",
    location: "United States",
    category: ["blood"],
    whiteLabel: true,
    apiIntegration: false,
    minOrder: "Contact",
    turnaround: "Varies",
    certifications: ["CLIA"],
    tests: ["Hormone Panels", "Thyroid", "Metabolic", "General Lab Tests"],
    description: "White-label at-home lab test kits with revenue-sharing model for partners. HIPAA-secure real-time results delivery.",
    highlight: "Revenue-sharing partner model",
  },
  {
    name: "IHDLab",
    website: "ihdlab.com/for-partners",
    location: "United States",
    category: ["blood"],
    whiteLabel: true,
    apiIntegration: true,
    minOrder: "Contact",
    turnaround: "Varies",
    certifications: ["CLIA"],
    tests: ["Multi-Category At-Home Tests"],
    description: "End-to-end white-label service: build kits, ship to members, run lab tests, deliver results. Full service for digital health partners.",
    highlight: "End-to-end fulfillment — build, ship, test, deliver",
  },
  {
    name: "myLAB Box",
    website: "mylabbox.com",
    location: "United States",
    category: ["sti", "toxins"],
    whiteLabel: false,
    apiIntegration: false,
    minOrder: "Contact",
    turnaround: "3-5 days",
    certifications: ["CLIA", "CAP"],
    tests: ["STI Panels (Chlamydia, Gonorrhea, HIV, Syphilis)", "Heavy Metals (Arsenic, Cadmium, Lead, Mercury)"],
    description: "At-home STI and toxin testing with healthcare provider partnerships available. Mid-range pricing.",
    highlight: "STI + heavy metals testing",
  },
  {
    name: "LetsGetChecked",
    website: "letsgetchecked.com",
    location: "United States / Ireland",
    category: ["blood", "hormones", "sti"],
    whiteLabel: false,
    apiIntegration: true,
    minOrder: "Contact",
    turnaround: "2-5 days",
    certifications: ["CLIA", "CAP"],
    tests: ["Hormones", "STI", "Thyroid", "Cholesterol", "Vitamin D", "Liver", "Kidney"],
    description: "B2B/corporate wellness options with broad test menu. API integration available for enterprise partners.",
    highlight: "Enterprise B2B with broad test menu",
  },
  {
    name: "Lipomic Healthcare",
    website: "lipomic.com/dbs-testing-kit",
    location: "India",
    category: ["blood"],
    whiteLabel: true,
    apiIntegration: false,
    minOrder: "Bulk (100+)",
    turnaround: "Varies",
    certifications: ["ISO"],
    tests: ["Custom DBS Kits", "Hormones", "Lipids", "Metabolites", "Toxicology"],
    description: "DBS collection kit manufacturer with full white-label customization: custom branding, barcodes, documentation, OCR-compatible sheets.",
    highlight: "Kit manufacturing specialist — full branding customization",
  },
  {
    name: "5Strands",
    website: "5strands.com",
    location: "United States",
    category: ["food", "toxins"],
    whiteLabel: false,
    apiIntegration: false,
    minOrder: "N/A (retail)",
    turnaround: "4 days",
    certifications: [],
    tests: ["67 Food Sensitivities", "Heavy Metals (Al, Hg, Pb)", "112 Vitamins & Minerals", "Environmental Sensitivities"],
    description: "Hair-based testing for food sensitivities, metals, and nutrient deficiencies. Fast 4-day turnaround, budget-friendly.",
    highlight: "Hair-based — non-invasive, 4-day results",
  },
  {
    name: "Toolbox Genomics",
    website: "toolboxgenomics.com",
    location: "United States",
    category: ["dna"],
    whiteLabel: true,
    apiIntegration: false,
    minOrder: "Practitioner account",
    turnaround: "4-6 weeks",
    certifications: ["CLIA"],
    tests: ["DNA Health Panels", "Nutrigenomics", "Fitness Genetics", "Wellness Genomics"],
    description: "DNA test panels designed for licensed practitioners. Health & wellness professional support with practitioner-focused program.",
    highlight: "Practitioner-focused DNA testing",
  },
];

const categoryInfo: Record<string, { label: string; icon: any; color: string; description: string }> = {
  blood: { label: "Blood Biomarkers", icon: Droplets, color: "text-red-400", description: "Finger prick DBS panels for hormones, vitamins, metabolic health" },
  hormones: { label: "Hormones", icon: Heart, color: "text-pink-400", description: "Testosterone, estradiol, cortisol, thyroid, DHEA-S" },
  gut: { label: "Gut Health", icon: Bug, color: "text-green-400", description: "Microbiome, pathogens, inflammation, digestive function" },
  dna: { label: "DNA & Genetics", icon: Dna, color: "text-purple-400", description: "Nutrigenomics, disease risk, drug response, ancestry" },
  toxins: { label: "Heavy Metals & Toxins", icon: FlaskConical, color: "text-orange-400", description: "Lead, mercury, arsenic, cadmium, environmental toxins" },
  mold: { label: "Mold & Mycotoxins", icon: Leaf, color: "text-yellow-400", description: "Mycotoxin exposure, mold sensitivity markers" },
  food: { label: "Food Sensitivity", icon: Leaf, color: "text-emerald-400", description: "IgG food reactions, intolerance, allergy panels" },
  sti: { label: "Sexual Health", icon: Shield, color: "text-blue-400", description: "STI screening panels for comprehensive health" },
  omega: { label: "Omega Balance", icon: TestTubes, color: "text-cyan-400", description: "Omega-3/6 ratio, fatty acid profiles" },
};

function PartnerCard({ partner }: { partner: TestingPartner }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`bg-slate-900/60 border-white/10 hover:border-cyan-500/30 transition-all ${partner.recommended ? "ring-1 ring-amber-500/30" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-white text-lg">{partner.name}</CardTitle>
                {partner.recommended && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                    <Star className="h-3 w-3 mr-1" /> Recommended
                  </Badge>
                )}
              </div>
              <CardDescription className="text-slate-400 text-xs">{partner.location}</CardDescription>
            </div>
            <div className="flex gap-1.5">
              {partner.whiteLabel && (
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">
                  <Package className="h-3 w-3 mr-1" /> White Label
                </Badge>
              )}
              {partner.apiIntegration && (
                <Badge variant="outline" className="border-green-500/30 text-green-400 text-[10px]">
                  API
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-slate-300 text-sm">{partner.description}</p>
          
          {partner.highlight && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
              <CheckCircle className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
              <p className="text-cyan-300 text-xs">{partner.highlight}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {partner.category.map((cat) => {
              const info = categoryInfo[cat];
              if (!info) return null;
              return (
                <Badge key={cat} variant="outline" className={`border-white/10 ${info.color} text-[10px]`}>
                  {info.label}
                </Badge>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-slate-500 mb-0.5">Min Order</p>
              <p className="text-white font-medium">{partner.minOrder}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-0.5">Turnaround</p>
              <p className="text-white font-medium flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" /> {partner.turnaround}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-0.5">Certifications</p>
              <p className="text-white font-medium flex items-center gap-1">
                {partner.certifications.length > 0 ? (
                  <>
                    <BadgeCheck className="h-3 w-3 text-green-400" />
                    {partner.certifications.join(", ")}
                  </>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Hide" : "Show"} available tests ({partner.tests.length})
          </button>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1.5"
            >
              {partner.tests.map((test) => (
                <Badge key={test} variant="secondary" className="bg-slate-800 text-slate-300 text-[10px]">
                  {test}
                </Badge>
              ))}
            </motion.div>
          )}

          <div className="flex gap-2 pt-2">
            <a href={`https://${partner.website}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="border-white/10 text-slate-300 hover:text-white text-xs">
                <ExternalLink className="h-3 w-3 mr-1" /> Visit Website
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TestingHubPage() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showWhiteLabelOnly, setShowWhiteLabelOnly] = useState(false);
  const [showApiOnly, setShowApiOnly] = useState(false);

  const filteredPartners = testingPartners.filter((p) => {
    if (activeCategory !== "all" && !p.category.includes(activeCategory)) return false;
    if (showWhiteLabelOnly && !p.whiteLabel) return false;
    if (showApiOnly && !p.apiIntegration) return false;
    return true;
  });

  const categories = Object.entries(categoryInfo);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/resources")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Resources
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-amber-500/20 border border-cyan-500/20">
              <Microscope className="h-8 w-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-white to-amber-400 bg-clip-text text-transparent">
                At-Home Testing Hub
              </h1>
              <p className="text-slate-400 text-sm">
                Branded testing kits shipped directly to members
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Truck className="h-8 w-8 text-cyan-400" />
              <div>
                <p className="text-white font-semibold text-sm">Ship to Members</p>
                <p className="text-slate-400 text-xs">Branded kits mailed directly to member addresses</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <TestTubes className="h-8 w-8 text-amber-400" />
              <div>
                <p className="text-white font-semibold text-sm">CLIA/CAP Certified</p>
                <p className="text-slate-400 text-xs">All partner labs meet clinical accuracy standards</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-white font-semibold text-sm">Results in ALLIO</p>
                <p className="text-slate-400 text-xs">API partners deliver results directly into member dashboards</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/40 border-white/10">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={activeCategory === "all" ? "default" : "outline"}
                onClick={() => setActiveCategory("all")}
                className={activeCategory === "all" ? "bg-cyan-600 hover:bg-cyan-700" : "border-white/10 text-slate-300"}
              >
                All ({testingPartners.filter(p => {
                  if (showWhiteLabelOnly && !p.whiteLabel) return false;
                  if (showApiOnly && !p.apiIntegration) return false;
                  return true;
                }).length})
              </Button>
              {categories.map(([key, info]) => {
                const Icon = info.icon;
                const count = testingPartners.filter(p => {
                  if (!p.category.includes(key)) return false;
                  if (showWhiteLabelOnly && !p.whiteLabel) return false;
                  if (showApiOnly && !p.apiIntegration) return false;
                  return true;
                }).length;
                if (count === 0) return null;
                return (
                  <Button
                    key={key}
                    size="sm"
                    variant={activeCategory === key ? "default" : "outline"}
                    onClick={() => setActiveCategory(key)}
                    className={activeCategory === key ? "bg-cyan-600 hover:bg-cyan-700" : "border-white/10 text-slate-300"}
                  >
                    <Icon className={`h-3.5 w-3.5 mr-1 ${info.color}`} />
                    {info.label} ({count})
                  </Button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWhiteLabelOnly}
                  onChange={(e) => setShowWhiteLabelOnly(e.target.checked)}
                  className="rounded border-white/20 bg-slate-800"
                />
                White Label Only
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showApiOnly}
                  onChange={(e) => setShowApiOnly(e.target.checked)}
                  className="rounded border-white/20 bg-slate-800"
                />
                API Integration Only
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPartners.map((partner) => (
            <PartnerCard key={partner.name} partner={partner} />
          ))}
        </div>

        {filteredPartners.length === 0 && (
          <Card className="bg-slate-900/40 border-white/10">
            <CardContent className="p-8 text-center">
              <Microscope className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No partners match the current filters.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setActiveCategory("all"); setShowWhiteLabelOnly(false); setShowApiOnly(false); }}
                className="text-cyan-400 mt-2"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-amber-400 text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" /> Quick Reference: What to Ask Partners
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-white font-medium">Pricing & Logistics</p>
                <ul className="space-y-1 text-slate-400 list-disc list-inside text-xs">
                  <li>Bulk pricing tiers (100 / 500 / 1,000+ kits/month)</li>
                  <li>White-label setup fees and branding options</li>
                  <li>Shipping logistics (US domestic + international)</li>
                  <li>Return mailer process and prepaid postage</li>
                  <li>Revenue-share vs wholesale pricing models</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-white font-medium">Technical & Compliance</p>
                <ul className="space-y-1 text-slate-400 list-disc list-inside text-xs">
                  <li>API documentation and integration timeline</li>
                  <li>HIPAA compliance and data handling</li>
                  <li>CLIA/CAP certification documentation</li>
                  <li>Custom panel configuration options</li>
                  <li>Results format (PDF, JSON, HL7/FHIR)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
