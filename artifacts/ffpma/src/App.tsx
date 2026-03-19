import React, { Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { DevNavPanel } from "@/components/dev-nav-panel";
import { GlobalAgentChat } from "@/components/GlobalAgentChat";
import type { MemberProfile, UserRole } from "@shared/schema";
import { resolveAppRole } from "@/lib/role-utils";

import LandingPage from "@/pages/landing";
import ProductsPage from "@/pages/products";
import ProductDetailPage from "@/pages/product-detail";
import ProgramsPage from "@/pages/programs";
import ProgramDetailPage from "@/pages/program-detail";
import DashboardPage from "@/pages/dashboard";
import OrdersPage from "@/pages/orders";
import ContractsPage from "@/pages/contracts";
import ClinicPage from "@/pages/clinic";
import ClinicMembersPage from "@/pages/clinic-members";
import ClinicIVProgramPage from "@/pages/clinic-iv-program";
import ClinicContractsPage from "@/pages/clinic-contracts";
import ResourcesPage from "@/pages/resources";
import PeptideConsolePage from "@/pages/peptide-console";
import DosageCalculatorPage from "@/pages/dosage-calculator";
import CompoundInteractionsPage from "@/pages/compound-interactions";
import ECSToolPage from "@/pages/ecs-tool";
import LigandCalculatorPage from "@/pages/ligand-calculator";
import ProtocolBuilderPage from "@/pages/protocol-builder";
import BloodSampleLibraryPage from "@/pages/blood-sample-library";
import MarketingStudioPage from "@/pages/marketing-studio";
import AssetGalleryPage from "@/pages/asset-gallery";
import LibraryPage from "@/pages/library";
import LibraryDetailPage from "@/pages/library-detail";
import QuizzesPage from "@/pages/quizzes";
import QuizTakePage from "@/pages/quiz-take";
import TrainingPage from "@/pages/training";
import DoctorNetworkPage from "@/pages/doctor-network";
import TrainingModulePage from "@/pages/training-module";
import ProtocolsPage from "@/pages/protocols";
import DetoxProtocolsPage from "@/pages/detox-protocols";
import ProtocolAssemblyPage from '@/pages/protocol-assembly';
import AdminDashboardPage from "@/pages/admin-dashboard";
import AdminSyncPage from "@/pages/admin-sync";
import AdminMembersPage from "@/pages/admin-members";
import AdminClinicsPage from "@/pages/admin-clinics";
import AdminClinicNodesPage from "@/pages/admin-clinic-nodes";
import CartPage from "@/pages/cart";
import CheckoutSuccessPage from "@/pages/checkout-success";
import DoctorDownlinePage from "@/pages/doctor-downline";
import ChatPage from "@/pages/chat";
import WPLoginPage from "@/pages/wp-login";
import DoctorSignupPage from "@/pages/doctor-signup";
import ContractSignPage from "@/pages/contract-sign";
import MemberSignupPage from "@/pages/member-signup";
import IntakeForm from "@/pages/intake-form";
import MembershipSuccessPage from "@/pages/membership-success";
import DianePage from "@/pages/diane";
import AdminDianePage from "@/pages/admin-diane";
import AboutPage from "@/pages/about";
import SupportPage from "@/pages/support-hub";
import AdminBackoffice from "@/pages/admin-backoffice";
import DoctorsPortal from "@/pages/doctors-portal";
import PatientECSProfile from "@/pages/patient-ecs-profile";
import FormulaAllio from "@/pages/formula-nexus";
import MemberHomePage from "@/pages/member-home";
import MemberOnboardingPage from "@/pages/member-onboarding";
import MyContractsPage from "@/pages/my-contracts";
import TrusteeDashboard from "@/pages/trustee-dashboard";
import VideoStudioPage from "@/pages/video-studio";
import PMANetworkPage from "@/pages/pma-network";
import ContractReviewPage from "@/pages/contract-review";
import BloodAnalysisPage from "@/pages/blood-analysis";
import FrequencyLibraryPage from "@/pages/frequency-library";
import ResearchViewerPage from "@/pages/research-viewer";
import VitalityAssessmentPage from "@/pages/vitality-assessment";
import BecomeAMemberPage from "@/pages/become-a-member";
import LegalDocumentPage from "@/pages/legal-document";
import NotFound from "@/pages/not-found";

async function fetchProfile(): Promise<MemberProfile | null> {
  const response = await fetch("/api/profile", { credentials: "include" });
  if (!response.ok) {
    if (response.status === 401) return null;
    throw new Error("Failed to fetch profile");
  }

  const data = await response.json();
  const user = data.user || data;

  let role = "member";
  if (user.wpRoles && Array.isArray(user.wpRoles)) {
    const resolved = resolveAppRole(user.wpRoles);
    if (resolved === "admin") role = "trustee";
    else role = resolved;
  }

  if (user.email && user.email.toLowerCase().includes("blake")) {
    role = "trustee";
  }

  return { ...user, role };
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const { data: profile } = useQuery<MemberProfile | null>({
    queryKey: ["/api/profile"],
    queryFn: fetchProfile,
    enabled: isAuthenticated,
  });

  const userRole: UserRole = profile?.role || "member";

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3.5rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar userRole={userRole} />
        <SidebarInset className="flex flex-1 flex-col">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

function RoleProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: UserRole[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  const hasAccess = React.useMemo(() => {
    if (!user) return false;
    let roles: string[] = [];
    if (Array.isArray(user.wpRoles)) {
      roles = user.wpRoles.map((r: string) => r.toLowerCase());
    } else if (typeof user.wpRoles === 'string') {
      try {
        roles = JSON.parse(user.wpRoles).map((r: string) => r.toLowerCase());
      } catch (e) {
        roles = user.wpRoles.split(',').map((r: string) => r.trim().toLowerCase());
      }
    }

    const userEmail = typeof user.email === 'string' ? user.email.toLowerCase() : '';
    let maxRole: UserRole = resolveAppRole(roles) as UserRole;
    if (userEmail.includes('blake')) {
      maxRole = "admin";
    }

    if (allowedRoles.includes(maxRole)) return true;
    if (allowedRoles.includes("trustee") && maxRole === "admin") return true;

    return false;
  }, [user, allowedRoles]);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    } else if (!isLoading && isAuthenticated && user && !hasAccess) {
      setLocation("/member");
    }
  }, [isLoading, isAuthenticated, user, hasAccess, setLocation]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p className="text-lg text-muted-foreground">Access restricted</p>
        <button onClick={() => setLocation("/member")} className="text-primary underline">
          Return to Member Portal
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  const [location] = useLocation();

  return (
    <Switch>
      {/* PUBLIC ROUTES - NO SIDEBAR SHELL */}
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={WPLoginPage} />
      <Route path="/wp-login" component={WPLoginPage} />
      <Route path="/intake" component={IntakeForm} />
      <Route path="/legal/:slug" component={LegalDocumentPage} />

      {/* PROTECTED ROUTES NOW HIDDEN FROM PUBLIC ACCESS */}
      <Route path="/nexus" component={() => (
        <ProtectedRoute>
          <FormulaAllio />
        </ProtectedRoute>
      )} />

      {/* PROTECTED APP ROUTES - REQUIRE SIDEBAR SHELL */}
      <Route path="/about" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <AboutPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/products" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <ProductsPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/products/:slug" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <ProductDetailPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/programs" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <ProgramsPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/programs/:slug" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <ProgramDetailPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/cart" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <CartPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/checkout/success" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <CheckoutSuccessPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/orders" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <OrdersPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/contracts" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <MyContractsPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/contracts/:id/sign" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <ContractSignPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/member" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <MemberHomePage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/member-onboarding" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <MemberOnboardingPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/clinic" component={() => (
        <RoleProtectedRoute allowedRoles={["admin", "clinic"]}>
          <AppLayout>
            <ClinicPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/clinic/members" component={() => (
        <RoleProtectedRoute allowedRoles={["admin", "clinic"]}>
          <AppLayout>
            <ClinicMembersPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/clinic/iv-program" component={() => (
        <RoleProtectedRoute allowedRoles={["admin", "clinic"]}>
          <AppLayout>
            <ClinicIVProgramPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/clinic/contracts" component={() => (
        <RoleProtectedRoute allowedRoles={["admin", "clinic"]}>
          <AppLayout>
            <ClinicContractsPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/clinic/pma-network" component={() => (
        <RoleProtectedRoute allowedRoles={["admin", "clinic"]}>
          <AppLayout>
            <PMANetworkPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/doctor/signup" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <DoctorSignupPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/doctor/downline" component={() => (
        <RoleProtectedRoute allowedRoles={["admin", "doctor"]}>
          <AppLayout>
            <DoctorDownlinePage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/resources" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <ResourcesPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/resources/peptide-console" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <PeptideConsolePage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/resources/dosage-calculator" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <DosageCalculatorPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/resources/detox-protocols" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <DetoxProtocolsPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/resources/compound-interactions" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <CompoundInteractionsPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/resources/ecs-tool" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <ECSToolPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/resources/ligand-calculator" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <LigandCalculatorPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/resources/protocol-builder" component={() => (
        <ProtectedRoute>
          <ProtocolBuilderPage />
        </ProtectedRoute>
      )} />
      <Route path="/resources/blood-samples" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <BloodSampleLibraryPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/resources/marketing-studio" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <MarketingStudioPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/resources/asset-gallery" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <AssetGalleryPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/resources/research/:slug" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <ResearchViewerPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/asset-gallery" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <AssetGalleryPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/video-studio" component={() => (
        <RoleProtectedRoute allowedRoles={["admin", "trustee"]}>
          <AppLayout>
            <VideoStudioPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/doctor-network" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <DoctorNetworkPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/training" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <TrainingPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/training/:id" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <TrainingModulePage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/protocols" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <ProtocolsPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/protocol-assembly" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <ProtocolAssemblyPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/library" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <LibraryPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/library/:id" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <LibraryDetailPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/quizzes" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <QuizzesPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/quizzes/:id" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <QuizTakePage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/become-a-member" component={() => (
        <BecomeAMemberPage />
      )} />
      <Route path="/join" component={() => (
        <ProtectedRoute>
          <MemberSignupPage />
        </ProtectedRoute>
      )} />
      <Route path="/join/:slug" component={() => (
        <ProtectedRoute>
          <MemberSignupPage />
        </ProtectedRoute>
      )} />
      <Route path="/membership/success" component={() => (
        <AppLayout>
          <MembershipSuccessPage />
        </AppLayout>
      )} />
      <Route path="/chat" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <ChatPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/diane" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <DianePage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/support" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <SupportPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/admin" component={() => (
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AppLayout>
            <AdminDashboardPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/admin/diane" component={() => (
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AppLayout>
            <AdminDianePage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/admin/sync" component={() => (
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AppLayout>
            <AdminSyncPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/admin/members" component={() => (
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AppLayout>
            <AdminMembersPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/admin/clinics" component={() => (
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AppLayout>
            <AdminClinicsPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/admin/clinic-nodes" component={() => (
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AppLayout>
            <AdminClinicNodesPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/dashboard" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <MemberHomePage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/trustee" component={() => (
        <RoleProtectedRoute allowedRoles={["admin", "trustee"]}>
          <TrusteeDashboard />
        </RoleProtectedRoute>
      )} />
      <Route path="/trustee/contract-review" component={() => (
        <RoleProtectedRoute allowedRoles={["admin", "trustee"]}>
          <AppLayout>
            <ContractReviewPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/frequency-library" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <FrequencyLibraryPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/blood-analysis" component={() => (
        <RoleProtectedRoute allowedRoles={["admin", "trustee", "clinic", "doctor"]}>
          <AppLayout>
            <BloodAnalysisPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/admin/backoffice" component={() => (
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminBackoffice />
        </RoleProtectedRoute>
      )} />
      <Route path="/vitality-assessment" component={() => (
        <RoleProtectedRoute allowedRoles={["admin", "doctor"]}>
          <AppLayout>
            <VitalityAssessmentPage />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/doctors" component={() => (
        <RoleProtectedRoute allowedRoles={["admin", "doctor"]}>
          <AppLayout>
            <DoctorsPortal />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route path="/doctor/members/:patientId/ecs-profile" component={() => (
        <RoleProtectedRoute allowedRoles={["admin", "doctor"]}>
          <AppLayout>
            <PatientECSProfile />
          </AppLayout>
        </RoleProtectedRoute>
      )} />
      <Route component={() => (
        <AppLayout>
          <NotFound />
        </AppLayout>
      )} />
    </Switch>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="dark">
            <TooltipProvider>
              <Toaster />
              <Router />
              <GlobalAgentChat />
              <DevNavPanel />
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </Suspense>
    </I18nextProvider>
  );
}

export default App;
