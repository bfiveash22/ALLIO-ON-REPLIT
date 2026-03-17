import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { RoleToggle } from "@/components/role-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useToast } from "@/hooks/use-toast";
import {
  Stethoscope,
  Users,
  FileText,
  Calendar,
  Activity,
  ClipboardList,
  Microscope,
  Pill,
  Heart,
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MessageSquare,
  Phone,
  UserPlus,
  Send,
  Video,
  FileSignature,
  Shield,
  Award,
  BookOpen,
  Beaker,
  Dna,
  Waves,
  Leaf,
  Sparkles,
  Home,
  ChevronRight,
  Plus,
  RefreshCw,
  Upload,
  Copy,
  ExternalLink,
  Share2,
  Settings,
  Link2
} from "lucide-react";
import { Link } from "wouter";
import { agents, getAgentsByDivision } from "@shared/agents";
import { BloodAnalysisUpload } from "@/components/BloodAnalysisUpload";
import { XRayAnalysisUpload } from "@/components/XRayAnalysisUpload";
import { DoctorScheduling } from "@/components/DoctorScheduling";
import { DoctorPatientMessaging } from "@/components/DoctorPatientMessaging";
import { EnrollMemberModal } from "@/components/EnrollMemberModal";
import { BloodworkLabs } from "@/components/BloodworkLabs";
import { SkinAnalysisUpload } from "@/components/SkinAnalysisUpload";
import { ConsultAITeam } from "@/components/ConsultAITeam";

interface DoctorReferralInfo {
  doctorCode: string | null;
  memberSignupUrl: string | null;
  allioSignupUrl: string | null;
  enrolledMemberCount: number;
  clinicName: string | null;
  practiceType: string | null;
  isAdmin?: boolean;
}

interface EnrolledMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  enrolledAt: string;
  documentSigned: boolean;
  paymentComplete: boolean;
  doctorCode?: string;
}

interface DoctorMembersResponse {
  members: EnrolledMember[];
  total: number;
  isAdmin?: boolean;
}

interface Certification {
  id: string;
  userId: string;
  certificationType: string;
  referenceId: string;
  referenceTitle: string;
  status: "pending" | "in_progress" | "passed" | "failed" | "expired";
  score: number | null;
  passingScore: number | null;
  certificateNumber: string | null;
  issuedAt: string | null;
}

const pendingConsults = [
  { id: 1, member: "John Davis", type: "Blood Analysis Review", scheduled: "Today, 2:00 PM", urgent: true },
  { id: 2, member: "Karen White", type: "Protocol Adjustment", scheduled: "Today, 4:30 PM", urgent: false },
  { id: 3, member: "Tom Brown", type: "Initial Consultation", scheduled: "Tomorrow, 10:00 AM", urgent: false },
  { id: 4, member: "Amy Lee", type: "Follow-up", scheduled: "Tomorrow, 2:00 PM", urgent: false },
];

const recentAnalyses = [
  { id: 1, member: "Sarah Mitchell", type: "Live Blood", findings: ["Rouleaux moderate", "Healthy RBC majority", "Minor fibrin"], date: "2 days ago", aiAgents: ["vitalis", "prometheus"] },
  { id: 2, member: "Michael Chen", type: "Microbiome", findings: ["Dysbiosis detected", "Low bifido", "Candida markers"], date: "1 week ago", aiAgents: ["microbia", "hippocrates"] },
  { id: 3, member: "Emily Rodriguez", type: "Nutrient Panel", findings: ["Zinc deficiency", "B12 low", "Magnesium optimal"], date: "3 days ago", aiAgents: ["synthesis", "oracle"] },
];

const protocolTemplates = [
  { id: 1, name: "5 R's Gut Protocol", duration: "12 weeks", category: "Digestive", icon: Dna, cardBg: "bg-cyan-500/10", cardBorder: "border-cyan-500/20", cardHover: "hover:border-cyan-500/40", iconBg: "bg-cyan-500/20", iconColor: "text-cyan-400" },
  { id: 2, name: "Candida Elimination", duration: "8 weeks", category: "Microbiome", icon: Leaf, cardBg: "bg-lime-500/10", cardBorder: "border-lime-500/20", cardHover: "hover:border-lime-500/40", iconBg: "bg-lime-500/20", iconColor: "text-lime-400" },
  { id: 3, name: "Heavy Metal Detox", duration: "16 weeks", category: "Detox", icon: Sparkles, cardBg: "bg-amber-500/10", cardBorder: "border-amber-500/20", cardHover: "hover:border-amber-500/40", iconBg: "bg-amber-500/20", iconColor: "text-amber-400" },
  { id: 4, name: "Peptide Regeneration", duration: "6 weeks", category: "Peptides", icon: Beaker, cardBg: "bg-cyan-500/10", cardBorder: "border-cyan-500/20", cardHover: "hover:border-cyan-500/40", iconBg: "bg-cyan-500/20", iconColor: "text-cyan-400" },
  { id: 5, name: "Frequency Healing", duration: "4 weeks", category: "Biophysics", icon: Waves, cardBg: "bg-violet-500/10", cardBorder: "border-violet-500/20", cardHover: "hover:border-violet-500/40", iconBg: "bg-violet-500/20", iconColor: "text-violet-400" },
  { id: 6, name: "Mineral Restoration", duration: "8 weeks", category: "Minerals", icon: Heart, cardBg: "bg-rose-500/10", cardBorder: "border-rose-500/20", cardHover: "hover:border-rose-500/40", iconBg: "bg-rose-500/20", iconColor: "text-rose-400" },
];

interface AssignedProtocol {
  id: number;
  patientName: string;
  patientAge: number | null;
  sourceType: string;
  memberId: string | null;
  status: string;
  slidesWebViewLink: string | null;
  pdfDriveFileId: string | null;
  pdfDriveWebViewLink: string | null;
  generatedBy: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

function AssignedProtocolsSection() {
  const { data: approvedProtocols = [] } = useQuery<AssignedProtocol[]>({
    queryKey: ["/api/protocol-assembly/protocols/approved"],
    retry: false,
  });

  return (
    <Card className="bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-500/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          Approved Member Protocols
          <Badge className="bg-emerald-500/20 text-emerald-300 ml-2">{approvedProtocols.length}</Badge>
        </h3>
      </div>

      {approvedProtocols.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-white/20 mb-3" />
          <p className="text-white/60">No approved protocols yet</p>
          <p className="text-sm text-white/40 mt-1">Protocols approved by the Trustee will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvedProtocols.map((protocol) => (
            <div
              key={protocol.id}
              className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center font-bold text-sm">
                    {protocol.patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{protocol.patientName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {protocol.patientAge && (
                        <span className="text-xs text-white/50">Age: {protocol.patientAge}</span>
                      )}
                      <Badge className="bg-green-500/20 text-green-300 text-xs">Approved</Badge>
                      {protocol.reviewedBy && (
                        <span className="text-xs text-white/40">by {protocol.reviewedBy}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {protocol.pdfDriveWebViewLink && (
                    <a href={protocol.pdfDriveWebViewLink} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        View PDF
                      </Button>
                    </a>
                  )}
                  {protocol.slidesWebViewLink && (
                    <a href={protocol.slidesWebViewLink} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs">
                        <Video className="w-3 h-3 mr-1" />
                        Presentation
                      </Button>
                    </a>
                  )}
                  <a href={`/api/protocol-assembly/protocols/${protocol.id}/pdf`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-white/10 text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </a>
                </div>
              </div>
              {protocol.reviewNotes && (
                <div className="p-2 rounded bg-white/5 text-xs text-white/60 mt-2">
                  <span className="font-medium text-white/70">Trustee Notes:</span> {protocol.reviewNotes}
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-white/40 mt-2">
                <span>Generated: {new Date(protocol.createdAt).toLocaleDateString()}</span>
                <span>Source: {protocol.sourceType === 'intake_form' ? 'Intake Form' : 'Transcript'}</span>
                {protocol.generatedBy && <span>By: {protocol.generatedBy}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DoctorSettingsTab() {
  const { toast } = useToast();
  const [memberType, setMemberType] = useState<'member' | 'info_only'>('member');

  const { data: referralInfo } = useQuery<DoctorReferralInfo>({
    queryKey: ["/api/doctor/referral"],
    retry: false,
  });

  const { data: membersData, isLoading: membersLoading } = useQuery<DoctorMembersResponse>({
    queryKey: ["/api/doctor/members"],
    retry: false,
  });

  const enrolledMembers = membersData?.members || [];
  const clinicId = referralInfo?.doctorCode || 'LOADING';
  const clinicSignupUrl = referralInfo?.memberSignupUrl || 'Loading URL...';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "URL copied to clipboard" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 border-white/10 p-6">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-green-400" />
          Your Clinic Signup URL
        </h3>
        <p className="text-sm text-white/50 mb-4">Share this URL with members to have them sign up under your clinic:</p>
        <div className="flex items-center gap-3">
          <Input 
            value={clinicSignupUrl}
            readOnly
            className="flex-1 bg-white/5 border-white/10 font-mono text-sm"
            data-testid="input-clinic-url"
          />
          <Button 
            onClick={() => copyToClipboard(clinicSignupUrl)}
            className="bg-green-500 hover:bg-green-600"
            data-testid="button-copy-url"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy URL
          </Button>
        </div>
      </Card>

      <Card className="bg-black/20 border-white/10 p-6">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Member Type for Signups
        </h3>
        <p className="text-sm text-white/50 mb-4">Select the default member type for new signups through your URL:</p>
        <select
          value={memberType}
          onChange={(e) => setMemberType(e.target.value as 'member' | 'info_only')}
          className="w-full md:w-auto px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          data-testid="select-member-type"
        >
          <option value="member">Member</option>
          <option value="info_only">Info Only Member</option>
        </select>
        <Button className="ml-4 bg-green-500 hover:bg-green-600 mt-4 md:mt-0" data-testid="button-save-settings">
          Save
        </Button>
      </Card>

      <Card className="bg-black/20 border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            Your Members
            <Badge variant="outline" className="ml-2">{enrolledMembers.length} total</Badge>
          </h3>
        </div>
        
        {membersLoading ? (
          <div className="text-center text-white/50 py-8">Loading members...</div>
        ) : enrolledMembers.length === 0 ? (
          <div className="text-center text-white/50 py-8">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No members yet</p>
            <p className="text-sm mt-1">Share your signup URL to start enrolling members</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/50 text-sm border-b border-white/10">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Signup Date</th>
                  <th className="pb-3 font-medium">Member Type</th>
                </tr>
              </thead>
              <tbody>
                {enrolledMembers.map((member) => (
                  <tr key={member.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 font-medium">{member.name}</td>
                    <td className="py-3 text-white/70">{member.email}</td>
                    <td className="py-3 text-white/70">{formatDate(member.enrolledAt)}</td>
                    <td className="py-3">
                      <Badge variant="outline" className={member.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}>
                        {member.status === 'completed' ? 'Member' : member.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function DoctorsPortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const { toast } = useToast();

  // Blood Analysis Modal State
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedPatientForAnalysis, setSelectedPatientForAnalysis] = useState<string | null>(null);
  const [messagingPatientId, setMessagingPatientId] = useState<string | null>(null);

  // Enroll Member Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Member Filter State
  interface FilterState {
    searchQuery: string;
    status: 'all' | 'active' | 'pending' | 'inactive';
    contractSigned: 'all' | 'signed' | 'unsigned';
    paymentStatus: 'all' | 'paid' | 'unpaid';
  }

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: 'all',
    contractSigned: 'all',
    paymentStatus: 'all',
  });

  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const scienceAgents = getAgentsByDivision('science');

  const { data: referralInfo, isLoading: referralLoading } = useQuery<DoctorReferralInfo>({
    queryKey: ["/api/doctor/referral"],
    retry: false,
  });

  const { data: membersData, isLoading: membersLoading } = useQuery<DoctorMembersResponse>({
    queryKey: ["/api/doctor/members"],
    retry: false,
  });

  const { data: certificationData } = useQuery<{ success: boolean; certifications: Certification[] }>({
    queryKey: ["/api/my/certifications"],
    retry: false,
  });

  const certifications = certificationData?.certifications || [];
  const enrolledMembers = membersData?.members || [];
  
  // Filter enrolled members based on current filters
  const filteredMembers = enrolledMembers.filter((member) => {
    // Search query filter (name, email, phone)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch = 
        member.name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        (member.phone && member.phone.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status !== 'all' && member.status !== filters.status) {
      return false;
    }

    // Contract signed filter
    if (filters.contractSigned !== 'all') {
      const isSigned = member.documentSigned;
      if (filters.contractSigned === 'signed' && !isSigned) return false;
      if (filters.contractSigned === 'unsigned' && isSigned) return false;
    }

    // Payment status filter
    if (filters.paymentStatus !== 'all') {
      const isPaid = member.paymentComplete;
      if (filters.paymentStatus === 'paid' && !isPaid) return false;
      if (filters.paymentStatus === 'unpaid' && isPaid) return false;
    }

    return true;
  });

  const completedMembers = enrolledMembers.filter(m => m.status === 'completed').length;
  const pendingMembers = enrolledMembers.filter(m => m.status !== 'completed' && m.status !== 'cancelled').length;

  const doctorStats = [
    { label: "Enrolled Members", value: String(enrolledMembers.length), icon: Users, iconBg: "bg-cyan-500/20", iconColor: "text-cyan-400" },
    { label: "Completed", value: String(completedMembers), icon: CheckCircle2, iconBg: "bg-green-500/20", iconColor: "text-green-400" },
    { label: "Pending", value: String(pendingMembers), icon: Clock, iconBg: "bg-amber-500/20", iconColor: "text-amber-400" },
    { label: "This Month", value: String(enrolledMembers.filter(m => {
      const enrolledDate = new Date(m.enrolledAt);
      const now = new Date();
      return enrolledDate.getMonth() === now.getMonth() && enrolledDate.getFullYear() === now.getFullYear();
    }).length), icon: TrendingUp, iconBg: "bg-violet-500/20", iconColor: "text-violet-400" },
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      case "review":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "complete":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      default:
        return "bg-white/10 text-white/60 border-white/20";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-y-auto">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 pb-16">
        <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-14 z-40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Doctors Portal</h1>
                  <p className="text-xs text-white/50">FFPMA Affiliated Physician Network</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="Search members, protocols..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    data-testid="input-search"
                  />
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                  <Shield className="w-3 h-3 mr-1" />
                  PMA Protected
                </Badge>
                <LanguageSwitcher />
                <RoleToggle currentRole="doctor" />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {doctorStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-black/20 border-white/10 p-5 hover:border-white/20 transition-colors" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid={`text-stat-value-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>{stat.value}</p>
                      <p className="text-sm text-white/50">{stat.label}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-black/40 border border-white/10 p-1 flex-wrap">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                <Activity className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                <Users className="w-4 h-4 mr-2" />
                My Members
              </TabsTrigger>
              <TabsTrigger value="rootcause" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
                <Brain className="w-4 h-4 mr-2" />
                Root Cause
              </TabsTrigger>
              <TabsTrigger value="analysis" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                <Microscope className="w-4 h-4 mr-2" />
                AI Analysis
              </TabsTrigger>
              <TabsTrigger value="protocols" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                <ClipboardList className="w-4 h-4 mr-2" />
                Protocols
              </TabsTrigger>
              <TabsTrigger value="messaging" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300">
                <FileSignature className="w-4 h-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="bloodwork" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300" data-testid="tab-bloodwork">
                <Beaker className="w-4 h-4 mr-2" />
                Bloodwork & Labs
              </TabsTrigger>
              <TabsTrigger value="ai-consult" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300" data-testid="tab-ai-consult">
                <Brain className="w-4 h-4 mr-2" />
                AI Consult
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300" data-testid="tab-settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <DoctorScheduling />

                  <Card className="bg-black/20 border-white/10 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold flex items-center gap-2">
                        <Microscope className="w-5 h-5 text-violet-400" />
                        Recent AI Analyses
                      </h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                        onClick={() => {
                          setSelectedPatientForAnalysis(null);
                          setIsAnalysisModalOpen(true);
                        }}
                        data-testid="button-new-analysis"
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        New Analysis
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {recentAnalyses.map((analysis) => (
                        <div key={analysis.id} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-bold">{analysis.member}</span>
                              <Badge className="bg-violet-500/20 text-violet-300">{analysis.type}</Badge>
                            </div>
                            <span className="text-sm text-white/40">{analysis.date}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {analysis.findings.map((finding, i) => (
                              <Badge key={i} variant="outline" className="border-white/20 text-white/70 text-xs">
                                {finding}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <Brain className="w-3 h-3" />
                            <span>Analyzed by: {analysis.aiAgents.map(id => agents.find(a => a.id === id)?.name).join(', ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 p-5">
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5 text-cyan-400" />
                      AI Science Team
                    </h3>
                    <p className="text-sm text-white/60 mb-4">Your dedicated AI specialists ready to assist with analysis and protocols.</p>
                    <div className="grid grid-cols-3 gap-2">
                      {scienceAgents.slice(0, 6).map((agent) => (
                        <div key={agent.id} className="text-center p-2 rounded-lg bg-black/20 hover:bg-black/40 transition-colors cursor-pointer" title={agent.name}>
                          <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-xs font-bold mb-1">
                            {agent.name.substring(0, 2)}
                          </div>
                          <p className="text-xs text-white/70 truncate">{agent.name}</p>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full mt-4 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30"
                      onClick={() => setActiveTab("ai-consult")}
                      data-testid="button-consult-ai"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Consult AI Team
                    </Button>
                  </Card>

                  <Link href="/vitality-assessment">
                    <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 p-5 cursor-pointer hover:border-emerald-400/40 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">Vitality Assessment</h3>
                          <p className="text-xs text-emerald-300">VITALIS Framework</p>
                        </div>
                      </div>
                      <p className="text-sm text-white/60 mb-3">
                        Evaluate member biomarkers, lifestyle factors, and generate personalized improvement protocols.
                      </p>
                      <Button className="w-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">
                        <Activity className="w-4 h-4 mr-2" />
                        Open Assessment Tool
                      </Button>
                    </Card>
                  </Link>

                  {referralInfo && referralInfo.doctorCode && (
                    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 p-5">
                      <h3 className="font-bold flex items-center gap-2 mb-3">
                        <Share2 className="w-5 h-5 text-amber-400" />
                        Your Referral Link
                      </h3>
                      <p className="text-sm text-white/60 mb-4">
                        Share this link with members to enroll them in the FFPMA network under your practice.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                          <div>
                            <p className="text-xs text-white/50">Your Doctor Code</p>
                            <p className="font-mono font-bold text-amber-400" data-testid="text-doctor-code">{referralInfo.doctorCode}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyToClipboard(referralInfo.doctorCode!, "Doctor code")}
                            data-testid="button-copy-code"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        {referralInfo.memberSignupUrl && (
                          <div className="p-3 rounded-lg bg-black/20">
                            <p className="text-xs text-white/50 mb-1">Member Signup URL</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-sm text-cyan-300 truncate flex-1" data-testid="text-signup-url">
                                {referralInfo.memberSignupUrl}
                              </p>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => copyToClipboard(referralInfo.memberSignupUrl!, "Signup URL")}
                                data-testid="button-copy-url"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/50">Members Enrolled</span>
                          <Badge className="bg-cyan-500/20 text-cyan-300" data-testid="text-enrolled-count">
                            {referralInfo.enrolledMemberCount}
                          </Badge>
                        </div>
                      </div>
                      {referralInfo.memberSignupUrl && (
                        <Button 
                          className="w-full mt-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300" 
                          onClick={() => window.open(referralInfo.memberSignupUrl!, '_blank')}
                          data-testid="button-preview-signup"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Preview Signup Page
                        </Button>
                      )}
                    </Card>
                  )}

                  <Card className="bg-black/20 border-white/10 p-5">
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                      <Award className="w-5 h-5 text-amber-400" />
                      Certifications
                    </h3>
                    <div className="space-y-3">
                      {certifications.length > 0 ? (
                        certifications.map((cert) => (
                          <div 
                            key={cert.id}
                            className={`flex items-center gap-3 p-3 rounded-lg ${
                              cert.status === "passed" ? "bg-cyan-500/10" :
                              cert.status === "in_progress" ? "bg-amber-500/10" :
                              cert.status === "failed" ? "bg-red-500/10" : "bg-white/5"
                            }`}
                          >
                            {cert.status === "passed" ? (
                              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                            ) : cert.status === "in_progress" ? (
                              <Clock className="w-5 h-5 text-amber-400" />
                            ) : cert.status === "failed" ? (
                              <AlertCircle className="w-5 h-5 text-red-400" />
                            ) : (
                              <BookOpen className="w-5 h-5 text-white/40" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{cert.referenceTitle}</p>
                              <p className="text-xs text-white/50">
                                {cert.status === "passed" 
                                  ? `Certified - Score: ${cert.score}%` 
                                  : cert.status === "in_progress" 
                                  ? "In Progress"
                                  : cert.status === "failed"
                                  ? `Failed - Score: ${cert.score}%`
                                  : "Pending"}
                              </p>
                              {cert.certificateNumber && (
                                <p className="text-xs text-cyan-400/70 mt-1">#{cert.certificateNumber}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10">
                            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                            <div>
                              <p className="font-medium text-sm">Live Blood Analysis</p>
                              <p className="text-xs text-white/50">Certified</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10">
                            <Clock className="w-5 h-5 text-amber-400" />
                            <div>
                              <p className="font-medium text-sm">Peptide Protocols</p>
                              <p className="text-xs text-white/50">In Progress - 67%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                            <BookOpen className="w-5 h-5 text-white/40" />
                            <div>
                              <p className="font-medium text-sm">Frequency Medicine</p>
                              <p className="text-xs text-white/50">Available</p>
                            </div>
                          </div>
                        </>
                      )}
                      <Button variant="outline" className="w-full mt-2 border-white/10 hover:bg-white/5" asChild>
                        <Link href="/training">
                          <Award className="w-4 h-4 mr-2" />
                          View All Certifications
                        </Link>
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <Card className="bg-black/20 border-white/10 p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">Enrolled Members</h3>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`text-slate-400 hover:text-white border-white/10 ${showFilterPanel ? 'bg-cyan-500/20 border-cyan-400 text-white' : ''}`}
                      onClick={() => setShowFilterPanel(!showFilterPanel)}
                      data-testid="button-filter-patients"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                      {(filters.searchQuery || 
                        filters.status !== 'all' || 
                        filters.contractSigned !== 'all' || 
                        filters.paymentStatus !== 'all') && (
                        <Badge className="ml-2 bg-cyan-500 text-[10px] px-1.5 py-0 border-0 text-white">Active</Badge>
                      )}
                    </Button>
                    <Button 
                      className="bg-cyan-500 hover:bg-cyan-600" 
                      onClick={() => setIsEnrollModalOpen(true)}
                      data-testid="button-add-patient"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Enroll New Member
                    </Button>
                  </div>
                </div>

                {/* Filter Panel */}
                <AnimatePresence>
                  {showFilterPanel && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border border-white/10 rounded-lg p-4 mb-4 bg-black/40 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search Input */}
                        <div className="md:col-span-4">
                          <label className="text-sm text-white/50 mb-2 block">Search Patients</label>
                          <Input
                            placeholder="Search by name, email, or phone..."
                            value={filters.searchQuery}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>

                        {/* Status Filter */}
                        <div>
                          <label className="text-sm text-white/50 mb-2 block">Status</label>
                          <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm"
                          >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>

                        {/* Contract Filter */}
                        <div>
                          <label className="text-sm text-white/50 mb-2 block">Contract Status</label>
                          <select
                            value={filters.contractSigned}
                            onChange={(e) => setFilters(prev => ({ ...prev, contractSigned: e.target.value as any }))}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm"
                          >
                            <option value="all">All</option>
                            <option value="signed">Signed</option>
                            <option value="unsigned">Unsigned</option>
                          </select>
                        </div>

                        {/* Payment Filter */}
                        <div>
                          <label className="text-sm text-white/50 mb-2 block">Payment Status</label>
                          <select
                            value={filters.paymentStatus}
                            onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm"
                          >
                            <option value="all">All</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                          </select>
                        </div>

                        {/* Reset Button */}
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            onClick={() => setFilters({
                              searchQuery: '',
                              status: 'all',
                              contractSigned: 'all',
                              paymentStatus: 'all',
                            })}
                            className="w-full border-white/10 hover:bg-white/10 text-white/70"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reset
                          </Button>
                        </div>
                      </div>

                      {/* Results Count */}
                      <div className="mt-4 pt-4 border-t border-white/10 text-sm text-white/50">
                        Showing <span className="text-white font-semibold">{filteredMembers.length}</span> of <span className="text-white font-semibold">{enrolledMembers.length}</span> patients
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {membersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
                  </div>
                ) : enrolledMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-white/20 mb-4" />
                    <p className="text-white/60 mb-2">No enrolled members yet</p>
                    <p className="text-sm text-white/40">Share your referral link to start enrolling members</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMembers.map((member) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => setSelectedPatient(selectedPatient === member.id ? null : member.id)}
                        data-testid={`card-member-${member.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-sm">
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold">{member.name}</p>
                            <p className="text-sm text-white/50">{member.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                            <p className="text-xs text-white/40 mt-1">
                              {new Date(member.enrolledAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-xs text-white/50">Document</p>
                              {member.documentSigned ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />
                              ) : (
                                <Clock className="w-5 h-5 text-amber-400 mx-auto" />
                              )}
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-white/50">Payment</p>
                              {member.paymentComplete ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />
                              ) : (
                                <Clock className="w-5 h-5 text-amber-400 mx-auto" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatientForAnalysis(member.id);
                                setIsAnalysisModalOpen(true);
                              }}
                              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                              title="Upload Blood Analysis"
                            >
                              <Microscope className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatient(selectedPatient === member.id ? null : member.id);
                              }}
                              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                              data-testid={`button-view-member-${member.id}`}
                              title="View Member Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMessagingPatientId(member.id.toString());
                                setActiveTab("messaging");
                              }}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                              data-testid={`button-message-member-${member.id}`}
                              title="Message Member"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {selectedPatient === member.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-white/10"
                            >
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-black/20">
                                  <p className="text-xs text-white/50">Phone</p>
                                  <p className="font-medium">{member.phone || 'Not provided'}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-black/20">
                                  <p className="text-xs text-white/50">Status Details</p>
                                  <p className="font-medium capitalize">{member.status.replace('_', ' ')}</p>
                                </div>
                              </div>
                              <div className="flex gap-3 mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/api/doctor/patients/${member.id}/healing-report/pdf`, '_blank');
                                  }}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Healing Report PDF
                                </Button>
                                <Link href={`/doctor/patients/${member.id}/ecs-profile`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                                  >
                                    <Dna className="w-4 h-4 mr-2" />
                                    ECS Profile
                                  </Button>
                                </Link>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {/* PMA Educational Disclaimer */}
              <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-300 mb-1">PMA Educational Notice</h4>
                    <p className="text-sm text-white/70">
                      All AI analysis tools are provided for <strong>research and educational purposes only</strong> within our Private Membership Association. 
                      These tools support functional medicine practitioners in pattern recognition and do not constitute medical diagnosis. 
                      Members retain full responsibility for their health decisions under PMA guidelines.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BloodAnalysisUpload 
                  onUploadComplete={(result) => {
                    toast({
                      title: "Upload Complete",
                      description: "Blood sample ready for AI analysis",
                    });
                  }}
                />

                {/* Medical Imaging Analysis */}
                <Card className="bg-black/20 border-white/10 p-6">
                  <h3 className="font-bold flex items-center gap-2 mb-4">
                    <Waves className="w-5 h-5 text-violet-400" />
                    Medical Imaging Analysis
                  </h3>
                  <p className="text-sm text-white/60 mb-4">AI-powered analysis for educational pattern recognition</p>
                  
                  <XRayAnalysisUpload
                    onAnalysisComplete={(result) => {
                      toast({
                        title: "X-Ray Analysis Complete",
                        description: "AI analysis results are ready for review",
                      });
                    }}
                  />

                  <div className="mt-4">
                    <SkinAnalysisUpload />
                  </div>
                </Card>
              </div>

              {/* Analysis Queue */}
              <Card className="bg-black/20 border-white/10 p-6">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  Recent Analysis Queue
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <Microscope className="w-5 h-5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{analysis.member}</p>
                        <p className="text-xs text-white/50">{analysis.type} • {analysis.date}</p>
                      </div>
                      <Button variant="ghost" size="sm" data-testid={`button-view-analysis-${analysis.id}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="protocols" className="space-y-6">
              <AssignedProtocolsSection />

              {/* Active Patient Protocols */}
              <Card className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-cyan-500/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-cyan-400" />
                    Active Patient Protocols
                  </h3>
                  <Button className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30" data-testid="button-assign-protocol">
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Protocol
                  </Button>
                </div>
                <div className="space-y-3">
                  {[
                    { member: "Sarah M.", protocol: "5 R's Protocol", day: 14, total: 90, compliance: 87, products: ["L-Glutamine", "Probiotics", "Digestive Enzymes"] },
                    { member: "Michael C.", protocol: "Heavy Metal Detox", day: 7, total: 60, compliance: 92, products: ["Chlorella", "Cilantro Extract", "Binders"] },
                    { member: "Emily R.", protocol: "Parasite Cleanse", day: 21, total: 30, compliance: 78, products: ["Black Walnut", "Wormwood", "Cloves"] }
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-sm">
                            {item.member.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{item.member}</p>
                            <p className="text-sm text-white/50">{item.protocol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Day {item.day} of {item.total}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/50">Compliance:</span>
                            <Badge className={item.compliance >= 80 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}>
                              {item.compliance}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Progress value={(item.day / item.total) * 100} className="h-2 mb-2" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-white/50">Products:</span>
                        {item.products.map((product, pIdx) => (
                          <Badge key={pIdx} variant="outline" className="border-white/20 text-xs">{product}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Protocol Templates */}
              <Card className="bg-black/20 border-white/10 p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">Protocol Templates</h3>
                  <Button className="bg-amber-500 hover:bg-amber-600" data-testid="button-create-protocol">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Protocol
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {protocolTemplates.map((protocol) => (
                    <Card
                      key={protocol.id}
                      className={`${protocol.cardBg} ${protocol.cardBorder} p-5 ${protocol.cardHover} transition-colors cursor-pointer`}
                      data-testid={`card-protocol-${protocol.id}`}
                    >
                      <div className={`w-12 h-12 rounded-xl ${protocol.iconBg} flex items-center justify-center mb-4`}>
                        <protocol.icon className={`w-6 h-6 ${protocol.iconColor}`} />
                      </div>
                      <h4 className="font-bold mb-1">{protocol.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <Clock className="w-3 h-3" />
                        <span>{protocol.duration}</span>
                        <span>•</span>
                        <Badge variant="outline" className="border-white/20 text-xs">{protocol.category}</Badge>
                      </div>
                      <Button className="w-full mt-4 bg-white/10 hover:bg-white/20" data-testid={`button-use-protocol-${protocol.id}`}>
                        Use Template
                      </Button>
                    </Card>
                  ))}
                </div>
              </Card>

              {/* Practice Analytics Preview */}
              <Card className="bg-gradient-to-br from-violet-500/5 to-purple-500/5 border-violet-500/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                    Practice Analytics
                  </h3>
                  <Badge className="bg-violet-500/20 text-violet-300">Last 30 Days</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {[
                    { label: "Active Protocols", value: "23", change: "+5", color: "cyan" },
                    { label: "Avg Compliance", value: "84%", change: "+3%", color: "emerald" },
                    { label: "Protocol Completions", value: "8", change: "+2", color: "violet" },
                    { label: "Patient Outcomes", value: "92%", change: "+4%", color: "amber" }
                  ].map((stat, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-white/5 text-center">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-white/50">{stat.label}</p>
                      <p className={`text-xs ${stat.color === 'emerald' ? 'text-emerald-400' : stat.color === 'cyan' ? 'text-cyan-400' : stat.color === 'violet' ? 'text-violet-400' : 'text-amber-400'}`}>
                        {stat.change} vs prev month
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5">
                    <h4 className="font-medium mb-3">Top Performing Protocols</h4>
                    <div className="space-y-2">
                      {[
                        { name: "5 R's Protocol", success: 94 },
                        { name: "Parasite Cleanse", success: 89 },
                        { name: "Heavy Metal Detox", success: 86 }
                      ].map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm">{p.name}</span>
                          <Badge className="bg-emerald-500/20 text-emerald-300">{p.success}% success</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <h4 className="font-medium mb-3">Product Recommendations</h4>
                    <div className="space-y-2">
                      {[
                        { name: "L-Glutamine", count: 18 },
                        { name: "Probiotics", count: 15 },
                        { name: "Digestive Enzymes", count: 12 }
                      ].map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm">{p.name}</span>
                          <Badge variant="outline" className="border-white/20">{p.count} patients</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card className="bg-black/20 border-white/10 p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-rose-400" />
                    Document Management
                  </h3>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-white/10" data-testid="button-upload-doc">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button className="bg-rose-500 hover:bg-rose-600" data-testid="button-new-signature">
                      <FileSignature className="w-4 h-4 mr-2" />
                      Request Signature
                    </Button>
                  </div>
                </div>
                <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    FFPMA Contract Documents
                  </h4>
                  <p className="text-sm text-white/60 mb-3">Key documents for your Affiliated Clinic Association operating under the Mother PMA constitutional framework.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-black/20" data-testid="card-doc-umc">
                      <p className="font-medium text-sm text-cyan-300">Unified Membership Contract</p>
                      <p className="text-xs text-white/50 mt-1">FFPMA-UMC-4.0 — Member enrollment in both Mother PMA and Affiliated Clinic Association</p>
                    </div>
                    <div className="p-3 rounded-lg bg-black/20" data-testid="card-doc-cpa">
                      <p className="font-medium text-sm text-cyan-300">Clinic Principal Charter Agreement</p>
                      <p className="text-xs text-white/50 mt-1">FFPMA-CPA-1.0 — Doctor onboarding and Child PMA formation</p>
                    </div>
                    <div className="p-3 rounded-lg bg-black/20" data-testid="card-doc-portal">
                      <p className="font-medium text-sm text-cyan-300">Clinic Portal</p>
                      <a href="https://ffpmaclinicpmacreation.replit.app/portal" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-1">
                        <ExternalLink className="w-3 h-3" />
                        ffpmaclinicpmacreation.replit.app/portal
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      Pending Signatures
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                        <div>
                          <p className="font-medium">PMA Membership Agreement</p>
                          <p className="text-xs text-white/50">Sarah Mitchell • Sent 2 days ago</p>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300">Pending</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                        <div>
                          <p className="font-medium">Treatment Consent Form</p>
                          <p className="text-xs text-white/50">Michael Chen • Sent today</p>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300">Pending</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      Recently Signed
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                        <div>
                          <p className="font-medium">HIPAA Authorization</p>
                          <p className="text-xs text-white/50">Emily Rodriguez • Signed yesterday</p>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-300">Complete</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                        <div>
                          <p className="font-medium">Protocol Agreement</p>
                          <p className="text-xs text-white/50">Lisa Anderson • Signed 3 days ago</p>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-300">Complete</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Root Cause Analysis Tab */}
            <TabsContent value="rootcause" className="space-y-6">
              <Card className="bg-black/20 border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Brain className="w-6 h-6 text-emerald-400" />
                      Root Cause Analysis Framework
                    </h2>
                    <p className="text-white/60 text-sm mt-1">Functional medicine approach to patient healing</p>
                  </div>
                  <Button className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">
                    <Plus className="w-4 h-4 mr-2" />
                    New Patient Assessment
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Functional Medicine Timeline */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-emerald-400" />
                      Symptom Timeline
                    </h3>
                    <p className="text-sm text-white/60 mb-4">Track when symptoms started and how they've progressed</p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 mt-1.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Initial Symptom Onset</p>
                          <p className="text-xs text-white/50">When did the patient first notice issues?</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full bg-teal-400 mt-1.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Progression Pattern</p>
                          <p className="text-xs text-white/50">How have symptoms evolved over time?</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full bg-cyan-400 mt-1.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Triggering Events</p>
                          <p className="text-xs text-white/50">Life events, exposures, or changes that preceded symptoms</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Environmental Factors */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                      <Leaf className="w-5 h-5 text-amber-400" />
                      Environmental Factors
                    </h3>
                    <p className="text-sm text-white/60 mb-4">Assess environmental toxin exposure</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Mold Exposure", "Heavy Metals", "Pesticides", "EMF", "Water Quality", "Air Quality", "Work Hazards", "Home Toxins"].map((factor) => (
                        <div key={factor} className="p-2 rounded-lg bg-white/5 text-xs text-center">
                          {factor}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nutritional Deficiencies */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                      <Pill className="w-5 h-5 text-violet-400" />
                      Nutritional Assessment
                    </h3>
                    <p className="text-sm text-white/60 mb-4">Identify key nutrient deficiencies</p>
                    <div className="space-y-2">
                      {[
                        { name: "Vitamin D", status: "Low", color: "bg-amber-500" },
                        { name: "B12", status: "Borderline", color: "bg-amber-500" },
                        { name: "Iron", status: "Normal", color: "bg-emerald-500" },
                        { name: "Magnesium", status: "Low", color: "bg-amber-500" },
                        { name: "Zinc", status: "Normal", color: "bg-emerald-500" }
                      ].map((nutrient) => (
                        <div key={nutrient.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                          <span className="text-sm">{nutrient.name}</span>
                          <Badge className={`${nutrient.status === "Normal" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                            {nutrient.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lifestyle Factors */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                      <Heart className="w-5 h-5 text-blue-400" />
                      Lifestyle Assessment
                    </h3>
                    <p className="text-sm text-white/60 mb-4">Evaluate lifestyle impact on health</p>
                    <div className="space-y-3">
                      {[
                        { category: "Sleep Quality", score: 60 },
                        { category: "Stress Level", score: 75 },
                        { category: "Exercise", score: 40 },
                        { category: "Diet Quality", score: 55 }
                      ].map((item) => (
                        <div key={item.category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{item.category}</span>
                            <span className="text-white/50">{item.score}%</span>
                          </div>
                          <Progress value={item.score} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toxicity Assessment */}
                <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-rose-500/10 to-red-500/10 border border-rose-500/20">
                  <h3 className="font-bold flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                    Toxicity Assessment & Detox Priorities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-white/5">
                      <h4 className="font-medium text-rose-300 mb-2">Heavy Metal Burden</h4>
                      <p className="text-sm text-white/60">Mercury, lead, arsenic, cadmium levels and chelation protocols</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5">
                      <h4 className="font-medium text-rose-300 mb-2">Gut Health Status</h4>
                      <p className="text-sm text-white/60">Microbiome analysis, leaky gut markers, parasite assessment</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5">
                      <h4 className="font-medium text-rose-300 mb-2">Liver Function</h4>
                      <p className="text-sm text-white/60">Phase 1 & 2 detoxification pathways, methylation status</p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Messaging Tab */}
            <TabsContent value="messaging" className="space-y-6">
              <DoctorPatientMessaging preselectedPatientId={messagingPatientId || undefined} />
            </TabsContent>

            <TabsContent value="bloodwork" className="space-y-6">
              <BloodworkLabs />
            </TabsContent>

            <TabsContent value="ai-consult" className="space-y-6">
              <ConsultAITeam patientName={selectedPatient ? enrolledMembers.find(m => m.id === selectedPatient)?.name : undefined} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <DoctorSettingsTab />
            </TabsContent>
          </Tabs>
        </main>

        {/* Enroll Member Modal */}
        <EnrollMemberModal
          open={isEnrollModalOpen}
          onOpenChange={setIsEnrollModalOpen}
          signupUrl={referralInfo?.memberSignupUrl || null}
        />

        {/* Blood Analysis Upload Modal */}
        <AnimatePresence>
          {isAnalysisModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsAnalysisModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Microscope className="w-6 h-6 text-cyan-400" />
                      New Blood Analysis
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAnalysisModalOpen(false)}
                      className="text-white/50 hover:text-white"
                    >
                      ✕
                    </Button>
                  </div>
                  
                  <BloodAnalysisUpload
                    onUploadComplete={() => {
                      setIsAnalysisModalOpen(false);
                      toast({
                        title: "Analysis Uploaded",
                        description: "Blood analysis has been submitted successfully.",
                      });
                    }}
                    patientId={selectedPatientForAnalysis}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
