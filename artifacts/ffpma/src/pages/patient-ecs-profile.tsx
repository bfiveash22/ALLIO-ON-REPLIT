import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Brain,
  Heart,
  Activity,
  Shield,
  Sparkles,
  Moon,
  Flame,
  Leaf,
  AlertCircle,
  CheckCircle2,
  Dna,
  FlaskConical,
  TrendingUp,
  BookOpen,
  Loader2,
} from "lucide-react";

interface ECSScore {
  category: string;
  score: number;
  maxScore: number;
  status: "optimal" | "moderate" | "deficient";
}

interface ECSProfile {
  memberId: string;
  memberName: string;
  overallScore: number;
  maxScore: number;
  overallStatus: "optimal" | "moderate" | "deficient";
  categoryScores: ECSScore[];
  ecsProtocols: Array<{
    protocolName: string;
    protocolType?: string | null;
    status?: string | null;
    ecsRelevance: string;
  }>;
  relevantLabMarkers: Array<{
    testName: string;
    value: string;
    unit: string;
    status?: string | null;
    ecsCategory: string;
  }>;
  trainingProgress: {
    ecsModulesCompleted: number;
    ecsModulesTotal: number;
    completionPercentage: number;
  };
  recommendations: string[];
  generatedAt: string;
}

const categoryIcons: Record<string, typeof Brain> = {
  mood: Brain,
  sleep: Moon,
  pain: Flame,
  digestion: Activity,
  immunity: Shield,
  stress: Heart,
};

const categoryColors: Record<string, string> = {
  mood: "from-blue-500 to-cyan-500",
  sleep: "from-indigo-500 to-purple-500",
  pain: "from-orange-500 to-red-500",
  digestion: "from-emerald-500 to-teal-500",
  immunity: "from-green-500 to-lime-500",
  stress: "from-pink-500 to-rose-500",
};

const statusColors: Record<string, string> = {
  optimal: "bg-green-500/20 text-green-400 border-green-500/30",
  moderate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  deficient: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function PatientECSProfile() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;

  const { data, isLoading, error } = useQuery<{ success: boolean; profile: ECSProfile }>({
    queryKey: ["ecs-profile", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/doctor/members/${patientId}/ecs-profile`);
      if (!res.ok) throw new Error("Failed to load ECS profile");
      return res.json();
    },
  });

  const profile = data?.profile;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/70">Building ECS Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 p-6">
        <Link href="/doctors-portal">
          <Button variant="ghost" className="text-white/70 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
          </Button>
        </Link>
        <Card className="bg-red-500/10 border-red-500/30 max-w-lg mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-300">Unable to load ECS profile. This member may not have sufficient data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/doctors-portal">
              <Button variant="ghost" className="text-white/70">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Dna className="w-6 h-6 text-purple-400" />
                ECS Profile: {profile.memberName}
              </h1>
              <p className="text-sm text-white/50">
                Generated: {new Date(profile.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-white/5 border-white/10 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Overall ECS Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <circle
                      cx="64" cy="64" r="56" fill="none"
                      stroke={profile.overallStatus === "optimal" ? "#22c55e" : profile.overallStatus === "moderate" ? "#f59e0b" : "#ef4444"}
                      strokeWidth="8"
                      strokeDasharray={`${(profile.overallScore / profile.maxScore) * 352} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-3xl font-bold text-white">{profile.overallScore}</p>
                    <p className="text-xs text-white/50">/ {profile.maxScore}</p>
                  </div>
                </div>
              </div>
              <Badge className={`${statusColors[profile.overallStatus]} mx-auto block w-fit text-sm`}>
                {profile.overallStatus.charAt(0).toUpperCase() + profile.overallStatus.slice(1)}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {profile.categoryScores.map((cat) => {
                  const Icon = categoryIcons[cat.category] || Brain;
                  return (
                    <div key={cat.category} className="p-3 rounded-lg bg-black/20 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${categoryColors[cat.category] || "from-gray-500 to-gray-600"} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-white capitalize">{cat.category}</span>
                      </div>
                      <Progress value={cat.score} className="h-2 mb-1" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/50">{cat.score}%</span>
                        <Badge className={`${statusColors[cat.status]} text-xs px-1.5 py-0`}>
                          {cat.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-400" />
                ECS-Related Protocols ({profile.ecsProtocols.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.ecsProtocols.length === 0 ? (
                <p className="text-white/40 text-sm">No protocols assigned yet</p>
              ) : (
                <div className="space-y-3">
                  {profile.ecsProtocols.map((protocol, i) => (
                    <div key={i} className="p-3 rounded-lg bg-black/20 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-white text-sm">{protocol.protocolName}</p>
                        {protocol.status && (
                          <Badge className={
                            protocol.status === "active" ? "bg-green-500/20 text-green-400" :
                            protocol.status === "completed" ? "bg-blue-500/20 text-blue-400" :
                            "bg-gray-500/20 text-gray-400"
                          }>
                            {protocol.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-purple-300">{protocol.ecsRelevance}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                Lab Markers ({profile.relevantLabMarkers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.relevantLabMarkers.length === 0 ? (
                <p className="text-white/40 text-sm">No ECS-related lab data available</p>
              ) : (
                <div className="space-y-2">
                  {profile.relevantLabMarkers.map((marker, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-black/20">
                      <div>
                        <p className="text-sm text-white">{marker.testName}</p>
                        <p className="text-xs text-white/40">{marker.ecsCategory}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{marker.value} {marker.unit}</p>
                        {marker.status && (
                          <Badge className={
                            marker.status === "normal" ? "bg-green-500/20 text-green-400 text-xs" :
                            marker.status?.includes("critical") ? "bg-red-500/20 text-red-400 text-xs" :
                            "bg-amber-500/20 text-amber-400 text-xs"
                          }>
                            {marker.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                ECS Training Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white/70">Modules Completed</span>
                  <span className="text-sm text-white">
                    {profile.trainingProgress.ecsModulesCompleted} / {profile.trainingProgress.ecsModulesTotal}
                  </span>
                </div>
                <Progress value={profile.trainingProgress.completionPercentage} className="h-3" />
              </div>
              <p className="text-sm text-white/50">
                {profile.trainingProgress.completionPercentage}% of ECS training content completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-400" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.recommendations.length === 0 ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="text-sm">ECS profile looks well-optimized!</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {profile.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/70">{rec}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
