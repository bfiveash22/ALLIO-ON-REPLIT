import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Clinic } from "@shared/schema";
import {
  Shield,
  Scale,
  FileText,
  Building2,
  Users,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Globe,
  BookOpen,
  Gavel,
  MapPin,
  Stethoscope,
  CircleCheck,
  CircleDot,
} from "lucide-react";

const PMA_EXTERNAL_URL = "https://ffpmaclinicpmacreation.replit.app";

const tabs = [
  { id: "overview", label: "Network Overview", icon: Building2 },
  { id: "rules", label: "PMA Rules", icon: Gavel },
  { id: "legal", label: "Legal Framework", icon: Scale },
  { id: "guide", label: "Filing Guide", icon: BookOpen },
  { id: "manager", label: "PMA Filing Manager", icon: Globe },
];

const pmaRules = [
  {
    number: 1,
    title: "The $10.00 Membership Fee Is the Legal Gatekeeper",
    details:
      "The $10.00 membership fee is mandatory, non-negotiable, and serves as the legal gatekeeper for the entire PMA structure. This fee creates a private contractual relationship between the member and the association. Without this paid membership, there is no private domain, no contractual standing, and no legal protection. Every single person who enters the PMA must pay this fee — no exceptions, no waivers, no deferrals. The $10.00 is what transforms a public interaction into a private, constitutionally protected agreement.",
  },
  {
    number: 2,
    title: "Everyone Signs — No Exceptions",
    details:
      "Every person within the clinic walls must be a signed, dues-paying member of the PMA. This includes the doctor, staff, patients, visitors, vendors — anyone who steps foot inside the private domain. If they are not signed and paid, they are not protected and they compromise the entire PMA structure. There are zero exceptions to this rule. The moment an unsigned person is present, the private domain is breached and legal exposure is created for everyone.",
  },
  {
    number: 3,
    title: "Member Contracts Must Follow the FFPMA Standard",
    details:
      "All member contracts must follow the Forgotten Formula PMA standard format. This includes: a Declaration of Purpose, a Memorandum of Understanding (MOU), a reference to the Mother PMA (Forgotten Formula PMA), the $10.00 membership fee clearly stated, a HIPAA waiver and privacy acknowledgment, a Private Domain Declaration, and proper signature blocks for both the member and an authorized officer. No freelancing, no custom contracts, no shortcuts.",
  },
  {
    number: 4,
    title: "Constitutional Authority — Not State Regulatory Jurisdiction",
    details:
      "The PMA operates under constitutional authority — specifically the 1st Amendment (freedom of association) and the 14th Amendment (due process and equal protection). The Association operates strictly within the private domain and does not concede that public regulations, statutes, or licensing requirements governing the delivery of services in the public domain apply to private association activities. The constitutional foundation is what gives the PMA its power — and that power is only maintained when every rule in this list is followed without exception.",
  },
  {
    number: 5,
    title: "Independent Tax Election",
    details:
      "Each Affiliated Clinic Association files IRS Form 8832 (Entity Classification Election) independently to elect to be taxed as a corporation. The clinic files Form 1120 annually at the 21% corporate tax rate. This keeps each clinic's tax filing separate and independent — no parent entity is listed on Form 8832. The constitutional affiliation with the Mother PMA is established through the Network Membership Agreement and governing documents, not through the tax filing.",
  },
  {
    number: 6,
    title: "Must-Have Paperwork",
    details:
      "Every Affiliated Clinic Association must have the following documents completed and on file: Articles of Association (using the FF PMA template), Bylaws (governing the internal operations), Member Contract with $10.00 fee paid and documented, IRS CP 575 Letter (EIN confirmation from the IRS), and IRS Form 8832 (Entity Classification Election electing corporate tax classification). Missing any one of these documents means the PMA is incomplete and potentially unprotected.",
  },
  {
    number: 7,
    title: "Affiliated Clinic Association Governance",
    details:
      "Each Affiliated Clinic Association (Child PMA) operates as a voluntary constitutional affiliate of the Forgotten Formula PMA. While each affiliate maintains its own independent governance, officers, and day-to-day operations, it must operate within the framework established by the Mother PMA. This means following all 8 rules, using approved templates, maintaining proper records, and ensuring all members are properly enrolled. Autonomy exists within the structure — not outside of it.",
  },
  {
    number: 8,
    title: "Mother PMA IP Protection",
    details:
      "The Articles of Association, contract templates, and operational framework of the Forgotten Formula PMA are proprietary intellectual property. These documents are never to be shared outside the PMA network, posted publicly, given to attorneys not affiliated with the PMA, or used as templates for non-FF PMA organizations. Violation of this rule compromises the entire network and may result in removal from the PMA umbrella.",
  },
];

const filingSteps = [
  {
    number: 1,
    title: "Access Your Clinic Portal",
    description:
      "Navigate to the PMA Filing Manager and log in with your clinic credentials. If you don't have an account yet, contact the FF PMA administration to get started.",
    link: PMA_EXTERNAL_URL,
  },
  {
    number: 2,
    title: "Enter Clinic Information",
    description:
      "Provide your clinic's legal name, physical address, contact information, and practice type. This information will be used to generate your Articles of Association.",
    link: `${PMA_EXTERNAL_URL}/pma/new`,
  },
  {
    number: 3,
    title: "Add Officer Information",
    description:
      "Enter the names and roles of your PMA officers. Every PMA needs at minimum a Trustee, Secretary, and Treasurer. These officers will be listed in your governing documents.",
    link: null,
  },
  {
    number: 4,
    title: "Set Governance Rules",
    description:
      "Configure your Affiliated Clinic Association's governance rules within the FF PMA framework. This includes meeting schedules, voting procedures, and member admission policies.",
    link: null,
  },
  {
    number: 5,
    title: "Generate Your Legal Documents",
    description:
      "The system will automatically generate your Articles of Association, Bylaws, and Member Contract templates based on the FF PMA standard format.",
    link: null,
  },
  {
    number: 6,
    title: "Apply for Your EIN",
    description:
      "Use IRS Form SS-4 to apply for your Affiliated Clinic Association's EIN. Select 'Other' for entity type and write in 'Unincorporated Association.' Select 'Banking purposes' as reason for applying. Then file Form 8832 (Entity Classification Election) to elect to be taxed as a corporation at the 21% rate.",
    link: null,
  },
  {
    number: 7,
    title: "Complete Your Filing",
    description:
      "Upload your IRS CP 575 letter and completed Form 8832 (Entity Classification Election) to the filing manager. Once verified, your Affiliated Clinic Association will be officially registered in the FF PMA network.",
    link: PMA_EXTERNAL_URL,
  },
  {
    number: 8,
    title: "Maintain Your PMA",
    description:
      "Keep all member contracts current, collect $10.00 fees from every member, maintain proper records, and ensure ongoing compliance with all 8 PMA rules.",
    link: null,
  },
];

const contactStatusConfig: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmed", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  waiting: { label: "Waiting", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  pending: { label: "Pending", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  no_contract: { label: "No Contract", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const pmaStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  pending: { label: "Pending", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
};

const statusFilters = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "no_contract", label: "No Contract" },
  { id: "waiting", label: "Waiting" },
];

export default function PMANetworkPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchFilter, setSearchFilter] = useState("");
  const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: clinics, isLoading: clinicsLoading } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  const totalClinics = clinics?.filter(c => c.pmaType !== 'mother').length || 0;
  const activePMAs = clinics?.filter(c => c.pmaStatus === 'active' && c.pmaType === 'child').length || 0;
  const pendingFilings = clinics?.filter(c => c.pmaStatus === 'pending' && c.pmaType === 'child').length || 0;
  const compliant = clinics?.filter(c => c.pmaStatus === 'active' && c.signNowMemberLink && c.isActive).length || 0;

  const filteredClinics = (clinics || []).filter((clinic) => {
    if (clinic.pmaType === "mother") return false;
    const query = searchFilter.toLowerCase();
    const matchesSearch =
      clinic.name.toLowerCase().includes(query) ||
      (clinic.doctorName || "").toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && clinic.pmaStatus === "active") ||
      (statusFilter === "pending" && clinic.pmaStatus === "pending") ||
      (statusFilter === "no_contract" && clinic.contactStatus === "no_contract") ||
      (statusFilter === "waiting" && clinic.contactStatus === "waiting");
    return matchesSearch && matchesStatus;
  });

  const toggleRule = (ruleNumber: number) => {
    setExpandedRules((prev) => {
      const next = new Set(prev);
      if (next.has(ruleNumber)) {
        next.delete(ruleNumber);
      } else {
        next.add(ruleNumber);
      }
      return next;
    });
  };

  return (
    <main className="flex-1 overflow-auto bg-slate-950">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/clinic">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight text-white"
              data-testid="text-page-title"
            >
              PMA Network
            </h1>
            <p className="text-slate-400">
              Forgotten Formula PMA — Affiliated Clinic Association Network Management
            </p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-slate-900 rounded-lg p-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-cyan-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "overview" && (
          <div data-testid="panel-overview">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card
                className="bg-slate-900 border-slate-800"
                data-testid="stat-total-clinics"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Total Clinics</p>
                      <p
                        className="text-3xl font-bold text-cyan-400"
                        data-testid="text-total-clinics"
                      >
                        {clinicsLoading ? "—" : totalClinics}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10">
                      <Building2 className="h-6 w-6 text-cyan-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-slate-900 border-slate-800"
                data-testid="stat-active-pmas"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Active PMAs</p>
                      <p
                        className="text-3xl font-bold text-emerald-400"
                        data-testid="text-active-pmas"
                      >
                        {clinicsLoading ? "—" : activePMAs}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <Shield className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-slate-900 border-slate-800"
                data-testid="stat-pending-filings"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Pending Filings</p>
                      <p
                        className="text-3xl font-bold text-amber-400"
                        data-testid="text-pending-filings"
                      >
                        {clinicsLoading ? "—" : pendingFilings}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                      <AlertTriangle className="h-6 w-6 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-slate-900 border-slate-800"
                data-testid="stat-compliant"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Compliant</p>
                      <p
                        className="text-3xl font-bold text-emerald-400"
                        data-testid="text-compliant"
                      >
                        {clinicsLoading ? "—" : compliant}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card
              className="bg-slate-900 border-2 border-amber-500/50 mb-6"
              data-testid="card-parent-pma"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                      <Shield className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">
                        Forgotten Formula PMA
                      </CardTitle>
                      <p className="text-sm text-amber-400 font-medium">
                        Mother PMA — Constitutional Authority
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-sm px-3">
                    Mother PMA
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      EIN
                    </p>
                    <p
                      className="text-lg font-mono font-semibold text-white"
                      data-testid="text-parent-ein"
                    >
                      93-4726660
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Trustee
                    </p>
                    <p
                      className="text-lg font-semibold text-white"
                      data-testid="text-parent-trustee"
                    >
                      Trustee
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Address
                    </p>
                    <p
                      className="text-lg font-semibold text-white"
                      data-testid="text-parent-address"
                    >
                      6904 Edgefield Dr, Denton TX 76210
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    The Forgotten Formula PMA is the founding Mother PMA — a Private Membership Association organized and operating within the private domain under the protections afforded by the 1st Amendment (freedom of association) and 14th Amendment (equal protection, liberty interests). All Affiliated Clinic Associations (Child PMAs) affiliate through voluntary constitutional affiliation as separate legal entities — not subsidiaries, franchisees, or state-created entities. The Mother PMA provides the constitutional framework; clinics exercise their constitutional right to associate.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">1st Amendment</Badge>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">14th Amendment</Badge>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Voluntary Constitutional Affiliation</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md w-full">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search clinics or doctors..."
                  className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  data-testid="input-search-clinics"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  asChild
                  data-testid="button-filing-manager"
                >
                  <a
                    href={PMA_EXTERNAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PMA Filing Manager
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
                  asChild
                  data-testid="button-create-division"
                >
                  <a
                    href={`${PMA_EXTERNAL_URL}/pma/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Create New Affiliated Clinic PMA
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap" data-testid="filter-status-row">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={statusFilter === filter.id ? "default" : "outline"}
                  size="sm"
                  className={
                    statusFilter === filter.id
                      ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                      : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                  }
                  onClick={() => setStatusFilter(filter.id)}
                  data-testid={`button-filter-${filter.id}`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            {clinicsLoading ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-slate-900 border-slate-800 animate-pulse">
                    <CardContent className="pt-6 h-40" />
                  </Card>
                ))}
              </div>
            ) : filteredClinics.length === 0 ? (
              <Card
                className="bg-slate-900 border-dashed border-slate-700"
                data-testid="card-empty-clinics"
              >
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Building2 className="h-12 w-12 text-slate-600 mb-4" />
                  <p className="text-lg font-semibold text-white mb-1">
                    No Clinics Found
                  </p>
                  <p className="text-slate-400 text-sm text-center max-w-md">
                    {searchFilter || statusFilter !== "all"
                      ? "No clinics match your search criteria."
                      : "No Affiliated Clinic Associations have been registered yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredClinics.map((clinic) => {
                  const contactCfg = contactStatusConfig[clinic.contactStatus || "pending"] || contactStatusConfig.pending;
                  const pmaCfg = pmaStatusConfig[clinic.pmaStatus || "pending"] || pmaStatusConfig.pending;
                  return (
                    <Card
                      key={clinic.id}
                      className="bg-slate-900 border-slate-800 hover:border-slate-600 transition-colors"
                      data-testid={`card-clinic-${clinic.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle
                              className="text-lg text-white"
                              data-testid={`text-clinic-name-${clinic.id}`}
                            >
                              {clinic.name}
                            </CardTitle>
                            {clinic.pmaName && (
                              <p className="text-sm text-cyan-400 mt-0.5" data-testid={`text-pma-name-${clinic.id}`}>
                                {clinic.pmaName}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 items-end shrink-0">
                            <Badge
                              className={pmaCfg.color}
                              data-testid={`badge-pma-status-${clinic.id}`}
                            >
                              {clinic.pmaStatus === "active" ? (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 mr-1" />
                              )}
                              {pmaCfg.label}
                            </Badge>
                            <Badge
                              className={contactCfg.color}
                              data-testid={`badge-contact-status-${clinic.id}`}
                            >
                              {contactCfg.label}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Stethoscope className="h-3.5 w-3.5" />
                          <span data-testid={`text-doctor-${clinic.id}`}>
                            {clinic.doctorName ? `Dr. ${clinic.doctorName}` : "No doctor assigned"}
                          </span>
                        </div>
                        {(clinic.city || clinic.state) && (
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <MapPin className="h-3.5 w-3.5" />
                            <span data-testid={`text-location-${clinic.id}`}>
                              {[clinic.city, clinic.state].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                        {clinic.practiceType && (
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Building2 className="h-3.5 w-3.5" />
                            <span data-testid={`text-practice-type-${clinic.id}`}>
                              {clinic.practiceType}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-3.5 w-3.5 text-slate-500" />
                          <span
                            className={
                              clinic.signNowMemberLink
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }
                            data-testid={`text-signnow-status-${clinic.id}`}
                          >
                            {clinic.signNowMemberLink
                              ? "SignNow Active"
                              : "SignNow Not Configured"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {clinic.onMap ? (
                            <>
                              <CircleCheck className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400" data-testid={`text-onmap-${clinic.id}`}>On Map</span>
                            </>
                          ) : (
                            <>
                              <CircleDot className="h-3.5 w-3.5 text-slate-500" />
                              <span className="text-slate-500" data-testid={`text-onmap-${clinic.id}`}>Not on Map</span>
                            </>
                          )}
                        </div>
                        {clinic.portalUrl && (
                          <a
                            href={clinic.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                            data-testid={`link-portal-${clinic.id}`}
                          >
                            <Globe className="h-3.5 w-3.5" />
                            Open Clinic Portal
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {(clinic.pmaEin || clinic.einStatus) && (
                          <div className="flex items-center gap-2 text-sm mt-1">
                            <Scale className="h-3.5 w-3.5 text-slate-500" />
                            <span className={clinic.pmaEin ? "text-emerald-400" : "text-amber-400"} data-testid={`text-ein-${clinic.id}`}>
                              {clinic.pmaEin ? `EIN: ${clinic.pmaEin}` : "EIN Needed"}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "rules" && (
          <div data-testid="panel-rules">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                <Scale className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  The 8 Rules of the Forgotten Formula PMA
                </h2>
                <p className="text-sm text-slate-400">
                  Non-negotiable principles that govern every Affiliated Clinic Association
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {pmaRules.map((rule) => (
                <Card
                  key={rule.number}
                  className="bg-slate-900 border-slate-800"
                  data-testid={`card-rule-${rule.number}`}
                >
                  <button
                    onClick={() => toggleRule(rule.number)}
                    className="w-full text-left"
                    data-testid={`button-toggle-rule-${rule.number}`}
                  >
                    <CardHeader className="pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-400">
                            {rule.number}
                          </div>
                          <CardTitle className="text-base text-white">
                            {rule.title}
                          </CardTitle>
                        </div>
                        {expandedRules.has(rule.number) ? (
                          <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                        )}
                      </div>
                    </CardHeader>
                  </button>
                  {expandedRules.has(rule.number) && (
                    <CardContent className="pt-4">
                      <p
                        className="text-slate-300 leading-relaxed"
                        data-testid={`text-rule-details-${rule.number}`}
                      >
                        {rule.details}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "legal" && (
          <div data-testid="panel-legal">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                <Scale className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Legal Framework</h2>
                <p className="text-sm text-slate-400">Understanding the PMA structure and constitutional protections</p>
              </div>
            </div>

            <Card className="bg-slate-900 border-slate-800 mb-6" data-testid="card-unified-contract">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  Unified Membership Contract
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-slate-300 leading-relaxed">
                <p>The Forgotten Formula PMA Unified Membership Contract is the foundational legal document that governs membership in the FFPMA network. When a member signs this contract, they simultaneously:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Enroll as a Member of The Forgotten Formula PMA (Mother PMA)</li>
                  <li>Automatically enroll as a Member of their selected Clinic PMA (Affiliated Clinic Association)</li>
                </ol>
                <p>A one-time enrollment fee of <span className="text-amber-400 font-semibold">$10.00</span> covers full membership in both the Mother PMA and the Affiliated Clinic Association. No additional enrollment fee is assessed.</p>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-sm text-amber-400 font-medium mb-2">Network Portability</p>
                  <p className="text-sm">Membership is portable nationwide. A Member in good standing may access services at any Affiliated Clinic Association in the FFPMA network without a separate application or additional fee.</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <Card className="bg-slate-900 border-red-500/30" data-testid="card-franchise-comparison">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-red-400">Franchise</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-400 space-y-2">
                  <p>A commercial licensing arrangement governed by the FTC and state franchise laws.</p>
                  <p>Franchisors charge fees, control operations, and it's all under commercial/state jurisdiction.</p>
                  <p className="text-red-400 font-medium">This is NOT what FFPMA is.</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-amber-500/30" data-testid="card-llc-comparison">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-amber-400">LLC / S-Corp</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-400 space-y-2">
                  <p>State-created entities. You file with the Secretary of State, you operate under state regulations.</p>
                  <p>The state can impose licensing, compliance requirements, and regulatory oversight on your operations.</p>
                  <p className="text-amber-400 font-medium">State jurisdiction applies.</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-emerald-500/30" data-testid="card-pma-comparison">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-emerald-400">PMA Affiliation</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-400 space-y-2">
                  <p>A private membership association operating under constitutional authority — 1st Amendment (freedom of association) and 14th Amendment (right to contract, due process, equal protection).</p>
                  <p>No state filing creates it. Members voluntarily associate under private contract. The Mother PMA provides the constitutional framework, and Affiliated Clinic Associations affiliate voluntarily — not through a franchise agreement, but through voluntary constitutional affiliation between private parties.</p>
                  <p className="text-emerald-400 font-medium">This IS the FFPMA model.</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800 mb-6" data-testid="card-constitutional-foundation">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-400" />
                  Constitutional Foundation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-slate-300 leading-relaxed">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-sm text-cyan-400 font-medium mb-2">1st Amendment</p>
                    <p className="text-sm">Freedom of association and speech. Members freely exercise their constitutional right to privately associate and choose their own healthcare.</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-sm text-cyan-400 font-medium mb-2">14th Amendment</p>
                    <p className="text-sm">Equal protection and liberty interests. Due process protections ensure the right to contract freely within the private domain.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 mb-6" data-testid="card-protection-structure">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-cyan-400" />
                  Why This Structure Protects Everyone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { title: "Separate Legal Entities", desc: "Each Affiliated Clinic Association has its own EIN, Articles, and Bylaws. Legal issues at one clinic cannot pierce up to the Mother PMA or across to other clinics." },
                    { title: "Affiliation, Not Ownership", desc: "The Network Agreement establishes clinics as affiliates exercising their constitutional right to associate — not subsidiaries. The Mother PMA provides the framework, not operational control." },
                    { title: "Constitutional Foundation", desc: "Every document is built on 1st and 14th Amendment protections, establishing the private domain and right to contract freely. The Association operates under constitutional authority — not state regulatory jurisdiction." },
                    { title: "Patient Protection", desc: "Member contracts ensure patients knowingly and voluntarily join the private association, with privacy acknowledgments reflecting the private nature of services." },
                    { title: "IRS Compliance", desc: "Each clinic files its own Form 1120 with its own EIN. Form 8832 (Entity Classification Election) is filed independently to elect corporate tax classification at the 21% rate." },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <p className="text-sm text-white font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800" data-testid="card-ein-guide">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-cyan-400" />
                  EIN & Tax Filing Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-slate-300 leading-relaxed">
                <p className="text-sm">Key fields on the SS-4 / Online EIN Application:</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { field: "Legal Name", value: "The clinic's PMA name (e.g., 'Hidden Root Wellness PMA')" },
                    { field: "Entity Type", value: "Select 'Other' → write in 'Unincorporated Association' — this is critical. Do NOT select LLC, corporation, or partnership." },
                    { field: "Reason for Applying", value: "Select 'Banking purposes' — this is the most straightforward reason and avoids triggering unnecessary IRS scrutiny." },
                    { field: "Principal Activity", value: "Select 'Health Care' or describe clinic services" },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-xs text-cyan-400 font-medium mb-1">{item.field}</p>
                      <p className="text-sm text-slate-300">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-4">
                  <p className="text-sm text-amber-400 font-medium mb-2">Filing Path</p>
                  <div className="flex items-center gap-2 text-sm text-slate-300 flex-wrap">
                    <span className="bg-slate-800 px-2 py-1 rounded">SS-4 → Get EIN as "Unincorporated Association"</span>
                    <span className="text-slate-500">→</span>
                    <span className="bg-slate-800 px-2 py-1 rounded">Form 8832 → Elect corporate classification (21% tax rate)</span>
                    <span className="text-slate-500">→</span>
                    <span className="bg-slate-800 px-2 py-1 rounded">Form 1120 → File annual corporate tax return</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "guide" && (
          <div data-testid="panel-guide">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                  <BookOpen className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    PMA Filing Guide
                  </h2>
                  <p className="text-sm text-slate-400">
                    Step-by-step process to establish your Affiliated Clinic Association
                  </p>
                </div>
              </div>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
                asChild
                data-testid="button-start-filing"
              >
                <a
                  href={`${PMA_EXTERNAL_URL}/guide`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Start Filing Process
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-slate-800 hidden sm:block" />
              <div className="space-y-4">
                {filingSteps.map((step) => (
                  <div
                    key={step.number}
                    className="relative flex gap-4"
                    data-testid={`step-${step.number}`}
                  >
                    <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 border-2 border-cyan-500/50">
                      <span className="text-sm font-bold text-cyan-400">
                        {step.number}
                      </span>
                    </div>
                    <Card className="flex-1 bg-slate-900 border-slate-800">
                      <CardContent className="pt-4 pb-4">
                        <h3
                          className="text-base font-semibold text-white mb-2"
                          data-testid={`text-step-title-${step.number}`}
                        >
                          {step.title}
                        </h3>
                        <p
                          className="text-sm text-slate-400 leading-relaxed"
                          data-testid={`text-step-desc-${step.number}`}
                        >
                          {step.description}
                        </p>
                        {step.link && (
                          <a
                            href={step.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-3 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                            data-testid={`link-step-${step.number}`}
                          >
                            <Globe className="h-3.5 w-3.5" />
                            Open in PMA Filing Manager
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "manager" && (
          <div data-testid="panel-manager">
            <Card className="bg-slate-900 border-slate-800 mb-4">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                      <Globe className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Interactive PMA Filing Manager
                      </h2>
                      <p className="text-sm text-slate-400">
                        Create, manage, and track your Affiliated Clinic Association filings
                        directly from this embedded portal.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                    onClick={() =>
                      window.open(PMA_EXTERNAL_URL, "_blank", "noopener,noreferrer")
                    }
                    data-testid="button-open-new-tab"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-lg overflow-hidden border border-slate-800">
              <iframe
                src={PMA_EXTERNAL_URL}
                className="w-full border-0"
                style={{ minHeight: "80vh" }}
                title="PMA Filing Manager"
                data-testid="iframe-filing-manager"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}