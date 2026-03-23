import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Order, Program, TrainingModule, Payment, ProgramEnrollment, UserProgress } from "@shared/schema";
import { MemberMessages } from "@/components/MemberMessages";
import { ProtocolTimeline } from "@/components/ProtocolTimeline";
import { HealingJourneyChart } from "@/components/HealingJourneyChart";
import { ExpandableProtocolCard, sampleProtocols, type ProtocolCardData } from "@/components/ExpandableProtocolCard";
import { QuickStats } from "@/components/QuickStats";
import {
  ShoppingBag,
  GraduationCap,
  FileText,
  Heart,
  Shield,
  ChevronRight,
  Package,
  CheckCircle2,
  Sparkles,
  Activity,
  BookOpen,
  Headphones,
  Star,
  ArrowRight,
  CreditCard,
  Pill,
  Syringe,
  TrendingUp,
  Leaf,
} from "lucide-react";

const quickActions = [
  {
    title: "Browse Products",
    description: "Shop healing formulas",
    href: "/products",
    icon: Package,
    gradient: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/30",
    iconColor: "text-cyan-400",
  },
  {
    title: "Training Hub",
    description: "Continue learning",
    href: "/training",
    icon: GraduationCap,
    gradient: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/30",
    iconColor: "text-cyan-400",
  },
  {
    title: "Support Hub",
    description: "Get AI assistance",
    href: "/support",
    icon: Headphones,
    gradient: "from-violet-500/20 to-purple-500/20",
    borderColor: "border-violet-500/30",
    iconColor: "text-violet-400",
  },
  {
    title: "ECS Assessment",
    description: "Check your ECS health",
    href: "/resources/ecs-tool",
    icon: Leaf,
    gradient: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
    iconColor: "text-green-400",
  },
  {
    title: "Protocols",
    description: "View healing protocols",
    href: "/protocols",
    icon: FileText,
    gradient: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
  },
];

const featuredPrograms = [
  {
    title: "IV Therapy Program",
    description: "Intravenous nutrient delivery for optimal cellular health",
    icon: Syringe,
    href: "/programs",
    badge: "Popular",
    gradient: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/30",
    iconColor: "text-cyan-400",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  {
    title: "Peptide Protocol",
    description: "Advanced peptide therapies for regeneration",
    icon: Pill,
    href: "/programs",
    badge: "Advanced",
    gradient: "from-violet-500/20 to-purple-500/20",
    borderColor: "border-violet-500/30",
    iconColor: "text-violet-400",
    badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  },
  {
    title: "Healing Protocols",
    description: "Comprehensive natural healing pathways",
    icon: Heart,
    href: "/protocols",
    badge: "Essential",
    gradient: "from-rose-500/20 to-pink-500/20",
    borderColor: "border-rose-500/30",
    iconColor: "text-rose-400",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MemberHomePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/login"), 500);
    }
  }, [isAuthenticated, authLoading, toast, setLocation]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  const { data: paymentHistory = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments/history"],
    enabled: isAuthenticated,
  });

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery<TrainingModule[]>({
    queryKey: ["/api/training/modules"],
  });

  const { data: enrollments = [] } = useQuery<ProgramEnrollment[]>({
    queryKey: ["/api/my/enrollments"],
    enabled: isAuthenticated,
  });

  const { data: trainingProgressData = [] } = useQuery<UserProgress[]>({
    queryKey: ["/api/my/progress"],
    enabled: isAuthenticated,
  });

  const recentOrders = orders.slice(0, 3);

  const completedModules = trainingProgressData.filter(
    p => p.contentType === "module" && p.status === "completed"
  ).length;

  const totalModules = modules.length;
  const trainingProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const activeEnrollments = enrollments.filter(e => e.status === "active");
  const activeProtocolCount = activeEnrollments.length > 0 ? activeEnrollments.length : sampleProtocols.length;

  const primaryEnrollment = activeEnrollments[0];
  const daysInPhase = primaryEnrollment?.startedAt
    ? Math.floor((Date.now() - new Date(primaryEnrollment.startedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 27;
  const primaryProgress = primaryEnrollment?.progress ?? 54;

  const protocolCards: ProtocolCardData[] = useMemo(() => {
    if (activeEnrollments.length === 0) return sampleProtocols;

    const phaseStyles = [
      { phase: "Phase 2: Rebuild", phaseColor: "text-cyan-400", phaseBg: "bg-cyan-500/10", phaseBorder: "border-cyan-500/30", phaseDot: "bg-cyan-400" },
      { phase: "Phase 1: Detox", phaseColor: "text-amber-400", phaseBg: "bg-amber-500/10", phaseBorder: "border-amber-500/30", phaseDot: "bg-amber-400" },
      { phase: "Phase 3: Maintain", phaseColor: "text-violet-400", phaseBg: "bg-violet-500/10", phaseBorder: "border-violet-500/30", phaseDot: "bg-violet-400" },
    ] as const;

    const programMap = new Map(programs.map(p => [p.id, p]));

    return activeEnrollments.map((enrollment, idx) => {
      const prog = programMap.get(enrollment.programId);
      const style = phaseStyles[idx % phaseStyles.length];
      const daysAgo = enrollment.startedAt
        ? Math.floor((Date.now() - new Date(enrollment.startedAt).getTime()) / (1000 * 60 * 60 * 24))
        : idx * 10 + 5;
      const sample = sampleProtocols[idx % sampleProtocols.length];

      return {
        id: enrollment.id,
        name: prog?.name || sample.name,
        category: prog?.type || sample.category,
        phase: style.phase,
        phaseColor: style.phaseColor,
        phaseBg: style.phaseBg,
        phaseBorder: style.phaseBorder,
        phaseDot: style.phaseDot,
        progress: enrollment.progress ?? 0,
        startedDaysAgo: daysAgo,
        nextMilestone: sample.nextMilestone,
        daysUntilMilestone: Math.max(1, 30 - daysAgo),
        dailySchedule: sample.dailySchedule,
        supplements: sample.supplements,
        href: "/protocols",
      };
    });
  }, [activeEnrollments, programs]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400";
      case "shipped": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "processing": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (authLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="p-6 max-w-7xl mx-auto space-y-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <Badge className="gap-1 bg-violet-500/20 text-violet-300 border-violet-500/30">
              <Shield className="h-3 w-3" />
              Member
            </Badge>
            {(user as any)?.contractSigned && (
              <Badge className="gap-1 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                <CheckCircle2 className="h-3 w-3" />
                Contract Signed
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent" data-testid="text-greeting">
                {getGreeting()}, {user?.firstName || user?.wpUsername || "Member"}!
              </h1>
              <p className="text-slate-400 mt-1">Here's your healing journey at a glance</p>
            </div>
          </div>

          <QuickStats
            activeProtocols={activeProtocolCount}
            daysInCurrentPhase={daysInPhase}
            nextMilestone={protocolCards[0] ? `${protocolCards[0].daysUntilMilestone}d` : "—"}
            trainingModulesCompleted={completedModules}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent backdrop-blur-sm shadow-lg shadow-cyan-500/5"
        >
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            Recommended Next Step
          </h2>
          {!(user as any)?.contractSigned ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-amber-300">Your Private Member Association agreement needs to be signed before you can access all features.</p>
              <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-black whitespace-nowrap">
                <Link href="/contracts">Review Agreement</Link>
              </Button>
            </div>
          ) : completedModules === 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-slate-300">Begin your healing journey by exploring the Training Hub and understanding the 5 Phases of Wellness.</p>
              <Button asChild size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap">
                <Link href="/training">Start Training</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-slate-300">Great progress! Continue your education in the Training Hub or explore our advanced healing protocols.</p>
              <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-500 text-white whitespace-nowrap">
                <Link href="/protocols">View Protocols</Link>
              </Button>
            </div>
          )}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-stretch"
        >
          {quickActions.map((action) => (
            <motion.div key={action.title} variants={itemVariants} className="h-full">
              <Link href={action.href} className="h-full block">
                <Card
                  className={`h-full cursor-pointer transition-all hover:scale-[1.02] bg-gradient-to-br ${action.gradient} ${action.borderColor} border backdrop-blur-sm`}
                  data-testid={`card-action-${action.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-white/10">
                        <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-white">{action.title}</p>
                        <p className="text-sm text-slate-400 truncate">{action.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <MemberMessages />
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm" data-testid="card-protocol-timeline">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Activity className="h-5 w-5 text-cyan-400" />
                      Protocol Journey
                    </CardTitle>
                    <CardDescription className="text-slate-400">Your active protocol phases</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                    <Link href="/protocols">
                      View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ProtocolTimeline
                  protocolName={protocolCards[0]?.name || "Exosome Regeneration Protocol"}
                  currentDay={Math.max(1, daysInPhase)}
                  totalDays={
                    primaryEnrollment != null && primaryProgress > 0
                      ? Math.max(84, Math.round((Math.max(1, daysInPhase) / primaryProgress) * 100))
                      : 84
                  }
                />
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm" data-testid="card-healing-journey">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                      Healing Journey Metrics
                    </CardTitle>
                    <CardDescription className="text-slate-400">Progress over the last 8 weeks</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <HealingJourneyChart />
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm" data-testid="card-my-protocols">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <FileText className="h-5 w-5 text-amber-400" />
                      My Protocols
                    </CardTitle>
                    <CardDescription className="text-slate-400">Active protocols with daily schedules</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                    <Link href="/protocols">
                      View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {protocolCards.map((protocol, index) => (
                  <ExpandableProtocolCard
                    key={protocol.id}
                    protocol={protocol}
                    defaultExpanded={index === 0}
                  />
                ))}
              </CardContent>
            </Card>

            <Card data-testid="card-training-progress" className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <GraduationCap className="h-5 w-5 text-violet-400" />
                      Training Progress
                    </CardTitle>
                    <CardDescription className="text-slate-400">Your learning journey</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" data-testid="button-view-training" className="text-slate-300 hover:text-white">
                    <Link href="/training">
                      View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {modulesLoading ? (
                  <Skeleton className="h-20" />
                ) : totalModules > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{completedModules} of {totalModules} modules completed</span>
                      <span className="font-medium text-white">{trainingProgress}%</span>
                    </div>
                    <Progress value={trainingProgress} className="h-2" />
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5" data-testid="stat-total-modules">
                        <BookOpen className="h-4 w-4 text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-white" data-testid="text-total-modules">{totalModules}</p>
                          <p className="text-xs text-slate-400">Total Modules</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5" data-testid="stat-completed-modules">
                        <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                        <div>
                          <p className="text-sm font-medium text-white" data-testid="text-completed-modules">{completedModules}</p>
                          <p className="text-xs text-slate-400">Completed</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5" data-testid="stat-progress">
                        <TrendingUp className="h-4 w-4 text-violet-400" />
                        <div>
                          <p className="text-sm font-medium text-white" data-testid="text-progress">{trainingProgress}%</p>
                          <p className="text-xs text-slate-400">Progress</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <GraduationCap className="h-10 w-10 mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400">Start your training journey</p>
                    <Button asChild className="mt-4" data-testid="button-start-training">
                      <Link href="/training">Begin Training</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-recent-orders" className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <ShoppingBag className="h-5 w-5 text-amber-400" />
                      Recent Orders
                    </CardTitle>
                    <CardDescription className="text-slate-400">Your purchase history</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" data-testid="button-view-orders" className="text-slate-300 hover:text-white">
                    <Link href="/orders">
                      View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                  </div>
                ) : recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5"
                        data-testid={`order-item-${order.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white/10">
                            <Package className="h-4 w-4 text-slate-300" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-white">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-slate-400">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getOrderStatusColor(order.status || "pending")}>
                            {order.status || "pending"}
                          </Badge>
                          <span className="font-medium text-white">${Number(order.total).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ShoppingBag className="h-10 w-10 mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400">No orders yet</p>
                    <Button asChild className="mt-4" data-testid="button-shop-now">
                      <Link href="/products">Shop Now</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-payment-history" className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <CreditCard className="h-5 w-5 text-green-400" />
                      Payment History
                    </CardTitle>
                    <CardDescription className="text-slate-400">Your recent transactions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                  </div>
                ) : paymentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {paymentHistory.slice(0, 5).map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5"
                        data-testid={`payment-item-${payment.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${payment.status === 'succeeded' ? 'bg-green-500/20' : payment.status === 'failed' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                            <CreditCard className={`h-4 w-4 ${payment.status === 'succeeded' ? 'text-green-400' : payment.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-white">{payment.description || `Payment #${payment.id.slice(0, 8)}`}</p>
                            <p className="text-xs text-slate-400">
                              {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={payment.status === 'succeeded' ? 'bg-green-500/20 text-green-400 border-green-500/30' : payment.status === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}>
                            {payment.status || "pending"}
                          </Badge>
                          <span className="font-medium text-white">${Number(payment.amount).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CreditCard className="h-10 w-10 mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400">No payment history yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <Card data-testid="card-membership-status" className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5 text-violet-400" />
                  Membership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-full bg-violet-500/20">
                      <Star className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Active Member</p>
                      <p className="text-xs text-slate-400">Private Member Association</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                      <span>Constitutional Protection</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                      <span>Member Pricing Access</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                      <span>AI Support Hub</span>
                    </div>
                  </div>
                </div>

                {!(user as any)?.contractSigned && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm text-amber-300 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Complete your member agreement
                    </p>
                    <Button asChild size="sm" className="mt-2 w-full" data-testid="button-sign-contract">
                      <Link href="/contracts">Sign Agreement</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-featured-programs" className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  Featured Programs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {featuredPrograms.map((program) => (
                  <Link key={program.title} href={program.href}>
                    <div className={`p-3 rounded-lg border ${program.borderColor} hover:scale-[1.02] transition-all cursor-pointer bg-gradient-to-br ${program.gradient}`}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-white/10">
                          <program.icon className={`h-5 w-5 ${program.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-white">{program.title}</p>
                            <Badge className={`text-xs border ${program.badgeColor}`}>{program.badge}</Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{program.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                <Button asChild variant="outline" className="w-full border-white/20 text-slate-300 hover:text-white hover:bg-white/10" data-testid="button-explore-programs">
                  <Link href="/programs">
                    Explore All Programs <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-full bg-cyan-500/20">
                    <Heart className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-cyan-100">Need Support?</p>
                    <p className="text-xs text-cyan-300">Our AI agents are here to help</p>
                  </div>
                </div>
                <Button asChild variant="secondary" className="w-full bg-cyan-500/20 border-cyan-500/30 text-cyan-100 hover:bg-cyan-500/30" data-testid="button-get-support">
                  <Link href="/support">
                    <Headphones className="mr-2 h-4 w-4" />
                    Get Support
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
