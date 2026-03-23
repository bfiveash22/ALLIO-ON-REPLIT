import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Shield,
  Lock,
  Sparkles,
  Leaf,
  Pill,
  Droplets,
  FlaskConical,
  Heart,
  Zap,
  Dna,
  Beaker,
} from "lucide-react";
import { FFLogoFull } from "@/components/ff-logo";

const guestCategories = [
  {
    name: "Peptides",
    description: "Advanced peptide therapies for regeneration and healing",
    icon: Dna,
    slug: "peptides",
    gradient: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500/30",
    iconColor: "text-cyan-400",
    count: "40+ Products",
  },
  {
    name: "Advanced Protocols",
    description: "Comprehensive healing protocol kits and bundles",
    icon: FlaskConical,
    slug: "advanced-protocols",
    gradient: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/30",
    iconColor: "text-violet-400",
    count: "25+ Protocols",
  },
  {
    name: "Oral Peptides",
    description: "Easy-to-take oral peptide formulations",
    icon: Pill,
    slug: "oral-peptides",
    gradient: "from-emerald-500/20 to-green-500/20",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-400",
    count: "15+ Products",
  },
  {
    name: "Minerals & Supplements",
    description: "Essential minerals and nutritional supplements",
    icon: Leaf,
    slug: "minerals-supplements",
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    iconColor: "text-amber-400",
    count: "30+ Products",
  },
  {
    name: "IV Therapy",
    description: "Intravenous nutrient delivery formulations",
    icon: Droplets,
    slug: "iv-therapy",
    gradient: "from-blue-500/20 to-indigo-500/20",
    border: "border-blue-500/30",
    iconColor: "text-blue-400",
    count: "10+ Products",
  },
  {
    name: "Detox & Cleanse",
    description: "Detoxification and cellular cleansing products",
    icon: Heart,
    slug: "detox-cleanse",
    gradient: "from-rose-500/20 to-pink-500/20",
    border: "border-rose-500/30",
    iconColor: "text-rose-400",
    count: "20+ Products",
  },
  {
    name: "Frequency Healing",
    description: "Bio-resonance and Rife frequency devices",
    icon: Zap,
    slug: "frequency-healing",
    gradient: "from-yellow-500/20 to-amber-500/20",
    border: "border-yellow-500/30",
    iconColor: "text-yellow-400",
    count: "5+ Devices",
  },
  {
    name: "Herbal Remedies",
    description: "Traditional and ancient herbal healing preparations",
    icon: Sparkles,
    slug: "herbal-remedies",
    gradient: "from-teal-500/20 to-cyan-500/20",
    border: "border-teal-500/30",
    iconColor: "text-teal-400",
    count: "35+ Products",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function GuestShopPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <FFLogoFull className="h-8 cursor-pointer" />
            </Link>
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" className="text-white/70 hover:text-white">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white gap-2">
                <Link href="/become-a-member">
                  <Shield className="h-4 w-4" />
                  Become a Member
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <Badge className="mb-4 bg-amber-500/20 text-amber-300 border-amber-500/30">
            <Shield className="h-3 w-3 mr-1" />
            Private Membership Association
          </Badge>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Healing Products Catalog
          </h1>
          <p className="text-lg text-slate-400 mb-6">
            Browse our categories of healing products. Full product details and member pricing are available exclusively to PMA members.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Lock className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-amber-300">Sign in or become a member to view pricing and shop</span>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {guestCategories.map((category) => (
            <motion.div key={category.slug} variants={itemVariants}>
              <Card className={`bg-gradient-to-br ${category.gradient} ${category.border} border backdrop-blur-sm hover:scale-[1.02] transition-all cursor-pointer group h-full`}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-white/10 group-hover:bg-white/15 transition-colors`}>
                      <category.icon className={`h-6 w-6 ${category.iconColor}`} />
                    </div>
                    <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                      {category.count}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{category.name}</h3>
                  <p className="text-sm text-slate-400 flex-1">{category.description}</p>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Member access required</span>
                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-cyan-500/10 via-slate-900/50 to-amber-500/10 border border-cyan-500/20 backdrop-blur-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-3">Ready to Access Full Product Details?</h2>
              <p className="text-slate-400 mb-6">
                Join the Forgotten Formula Private Membership Association to unlock member pricing, detailed product information, and healing protocols.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white gap-2">
                  <Link href="/become-a-member">
                    <Shield className="h-4 w-4" />
                    Become a Member
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/5">
                  <Link href="/login">Already a Member? Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
