import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Scale, FileText, AlertTriangle, CheckCircle2, Clock, Loader2, ChevronDown, ChevronUp, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ReviewFinding {
  clause: string;
  severity: 'critical' | 'warning' | 'suggestion';
  issue: string;
  recommendation: string;
  legalBasis?: string;
}

interface AgentReview {
  agentId: string;
  agentName: string;
  reviewArea: string;
  findings: ReviewFinding[];
  summary: string;
  timestamp: string;
  model: string;
}

interface ContractReviewReport {
  contractVersion: string;
  reviewDate: string;
  coordinatedBy: string;
  agentReviews: AgentReview[];
  consolidatedFindings: ReviewFinding[];
  overallAssessment: string;
  prioritizedEdits: string[];
  status: 'pending' | 'in_progress' | 'completed';
}

interface ReviewResponse {
  review: ContractReviewReport | null;
  inProgress: boolean;
  available: boolean;
}

const agentAccents: Record<string, { border: string; bg: string; text: string; icon: typeof Shield }> = {
  JURIS: { border: "border-amber-500/50", bg: "bg-amber-500/10", text: "text-amber-400", icon: Scale },
  LEXICON: { border: "border-cyan-500/50", bg: "bg-cyan-500/10", text: "text-cyan-400", icon: FileText },
  AEGIS: { border: "border-emerald-500/50", bg: "bg-emerald-500/10", text: "text-emerald-400", icon: Shield },
  SCRIBE: { border: "border-purple-500/50", bg: "bg-purple-500/10", text: "text-purple-400", icon: FileText },
};

const severityConfig: Record<string, { badge: string; row: string; order: number }> = {
  critical: { badge: "bg-red-500/20 text-red-400 border-red-500/30", row: "border-l-red-500", order: 0 },
  warning: { badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", row: "border-l-amber-500", order: 1 },
  suggestion: { badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", row: "border-l-cyan-500", order: 2 },
};

export default function ContractReviewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<ReviewResponse>({
    queryKey: ["/api/sentinel/contract-review"],
    refetchInterval: (query) => {
      const d = query.state.data as ReviewResponse | undefined;
      return d?.inProgress ? 5000 : false;
    },
  });

  const launchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sentinel/contract-review");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Review Initiated", description: "SENTINEL is coordinating the legal review." });
      queryClient.invalidateQueries({ queryKey: ["/api/sentinel/contract-review"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const review = data?.review;
  const inProgress = data?.inProgress || false;

  const toggleAgent = (agentId: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  };

  const criticalCount = review?.consolidatedFindings?.filter(f => f.severity === 'critical').length || 0;
  const warningCount = review?.consolidatedFindings?.filter(f => f.severity === 'warning').length || 0;
  const suggestionCount = review?.consolidatedFindings?.filter(f => f.severity === 'suggestion').length || 0;

  const downloadReport = () => {
    if (!review) return;
    const lines: string[] = [];
    const divider = "=".repeat(80);
    const subDivider = "-".repeat(80);

    lines.push(divider);
    lines.push("UNIFIED MEMBERSHIP CONTRACT V4 — FULL LEGAL REVIEW REPORT");
    lines.push(divider);
    lines.push("");
    lines.push(`Contract Version: ${review.contractVersion}`);
    lines.push(`Review Date: ${review.reviewDate}`);
    lines.push(`Coordinated By: ${review.coordinatedBy}`);
    lines.push(`Status: ${review.status.toUpperCase()}`);
    lines.push("");
    lines.push(`SUMMARY: ${criticalCount} Critical | ${warningCount} Warnings | ${suggestionCount} Suggestions | ${review.consolidatedFindings?.length || 0} Total Findings`);
    lines.push("");
    lines.push(divider);
    lines.push("OVERALL ASSESSMENT");
    lines.push(divider);
    lines.push("");
    lines.push(review.overallAssessment || "N/A");
    lines.push("");

    if (review.prioritizedEdits && review.prioritizedEdits.length > 0) {
      lines.push(divider);
      lines.push("PRIORITIZED EDITS");
      lines.push(divider);
      lines.push("");
      review.prioritizedEdits.forEach((edit, i) => {
        lines.push(`  ${i + 1}. ${edit}`);
      });
      lines.push("");
    }

    review.agentReviews.forEach((agent) => {
      lines.push(divider);
      lines.push(`AGENT: ${agent.agentName} (${agent.agentId})`);
      lines.push(`Review Area: ${agent.reviewArea}`);
      lines.push(`Model: ${agent.model}`);
      lines.push(`Timestamp: ${agent.timestamp}`);
      lines.push(`Findings: ${agent.findings.length}`);
      lines.push(divider);
      lines.push("");
      lines.push("Agent Summary:");
      lines.push(agent.summary);
      lines.push("");

      if (agent.findings.length > 0) {
        agent.findings.forEach((finding, idx) => {
          lines.push(subDivider);
          lines.push(`  Finding ${idx + 1} of ${agent.findings.length}`);
          lines.push(`  Severity:       ${finding.severity.toUpperCase()}`);
          lines.push(`  Clause:         ${finding.clause}`);
          lines.push(`  Issue:          ${finding.issue}`);
          lines.push(`  Recommendation: ${finding.recommendation}`);
          if (finding.legalBasis) {
            lines.push(`  Legal Basis:    ${finding.legalBasis}`);
          }
          lines.push("");
        });
      }
      lines.push("");
    });

    lines.push(divider);
    lines.push("END OF REPORT");
    lines.push(divider);
    lines.push("");
    lines.push("Generated by SENTINEL Legal Review System — Forgotten Formula PMA");
    lines.push(`Report exported: ${new Date().toISOString()}`);

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Contract_V4_Legal_Review_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Report Downloaded", description: "Full legal review report saved to your device." });
  };

  const sortedFindings = [...(review?.consolidatedFindings || [])].sort(
    (a, b) => (severityConfig[a.severity]?.order ?? 3) - (severityConfig[b.severity]?.order ?? 3)
  );

  return (
    <main className="flex-1 overflow-auto bg-slate-950">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10" data-testid="icon-shield">
              <Shield className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-page-title">
                Unified Contract V4 — Legal Review
              </h1>
              <p className="text-slate-400 text-sm" data-testid="text-subtitle">
                SENTINEL-coordinated review by JURIS, LEXICON, AEGIS, SCRIBE
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {review && review.status === 'completed' && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={downloadReport}
                data-testid="button-download-report"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Full Review
              </Button>
            )}
            <Button
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={() => launchMutation.mutate()}
              disabled={inProgress || launchMutation.isPending}
              data-testid="button-launch-review"
            >
              {(inProgress || launchMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {inProgress ? "Review In Progress..." : "Launch Review"}
            </Button>
          </div>
        </div>

        {review && (
          <Card className="bg-slate-900 border-slate-800 mb-6" data-testid="card-status-banner">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  {review.status === 'completed' ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  ) : review.status === 'in_progress' ? (
                    <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
                  ) : (
                    <Clock className="h-6 w-6 text-slate-400" />
                  )}
                  <div>
                    <p className="text-white font-semibold" data-testid="text-review-status">
                      Status: {review.status === 'completed' ? 'Completed' : review.status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </p>
                    {review.status === 'completed' && review.overallAssessment && (
                      <p className="text-slate-300 text-sm mt-1" data-testid="text-overall-assessment">
                        {review.overallAssessment}
                      </p>
                    )}
                  </div>
                </div>
                {review.status === 'completed' && (
                  <div className="flex gap-3" data-testid="status-counts">
                    <Badge className={severityConfig.critical.badge} data-testid="badge-critical-count">
                      {criticalCount} critical
                    </Badge>
                    <Badge className={severityConfig.warning.badge} data-testid="badge-warning-count">
                      {warningCount} warnings
                    </Badge>
                    <Badge className={severityConfig.suggestion.badge} data-testid="badge-suggestion-count">
                      {suggestionCount} suggestions
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {review?.agentReviews && review.agentReviews.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-white mb-4" data-testid="text-agent-reviews-heading">
              Agent Reviews
            </h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-8">
              {review.agentReviews.map((agent) => {
                const accent = agentAccents[agent.agentName] || agentAccents.JURIS;
                const AgentIcon = accent.icon;
                const isExpanded = expandedAgents.has(agent.agentId);
                return (
                  <Card
                    key={agent.agentId}
                    className={`bg-slate-900 border-2 ${accent.border}`}
                    data-testid={`card-agent-${agent.agentId}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${accent.bg}`}>
                            <AgentIcon className={`h-5 w-5 ${accent.text}`} />
                          </div>
                          <div>
                            <CardTitle className="text-white text-base" data-testid={`text-agent-name-${agent.agentId}`}>
                              {agent.agentName}
                            </CardTitle>
                            <p className="text-slate-400 text-xs">{agent.reviewArea}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-700/50 text-slate-300 border-slate-600 text-xs" data-testid={`badge-model-${agent.agentId}`}>
                            {agent.model}
                          </Badge>
                          <Badge className={`${accent.bg} ${accent.text} border-none`} data-testid={`badge-findings-count-${agent.agentId}`}>
                            {agent.findings.length} findings
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300 text-sm mb-3" data-testid={`text-agent-summary-${agent.agentId}`}>
                        {agent.summary}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white w-full justify-between"
                        onClick={() => toggleAgent(agent.agentId)}
                        data-testid={`button-toggle-findings-${agent.agentId}`}
                      >
                        <span>{isExpanded ? "Hide" : "Show"} Findings</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      {isExpanded && (
                        <div className="mt-3 space-y-3" data-testid={`findings-list-${agent.agentId}`}>
                          {agent.findings.map((finding, idx) => {
                            const sev = severityConfig[finding.severity] || severityConfig.suggestion;
                            return (
                              <div
                                key={idx}
                                className={`border-l-2 ${sev.row} pl-3 py-2`}
                                data-testid={`finding-${agent.agentId}-${idx}`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={sev.badge} data-testid={`badge-severity-${agent.agentId}-${idx}`}>
                                    {finding.severity}
                                  </Badge>
                                  <span className="text-white text-sm font-medium" data-testid={`text-clause-${agent.agentId}-${idx}`}>
                                    {finding.clause}
                                  </span>
                                </div>
                                <p className="text-slate-300 text-sm" data-testid={`text-issue-${agent.agentId}-${idx}`}>
                                  {finding.issue}
                                </p>
                                <p className="text-cyan-400 text-xs mt-1" data-testid={`text-recommendation-${agent.agentId}-${idx}`}>
                                  Recommendation: {finding.recommendation}
                                </p>
                                {finding.legalBasis && (
                                  <p className="text-slate-500 text-xs mt-1" data-testid={`text-legal-basis-${agent.agentId}-${idx}`}>
                                    Legal Basis: {finding.legalBasis}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {sortedFindings.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-white mb-4" data-testid="text-consolidated-heading">
              Consolidated Findings
            </h2>
            <Card className="bg-slate-900 border-slate-800 mb-8 overflow-hidden" data-testid="card-consolidated-findings">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-findings">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-400 font-medium px-4 py-3">Severity</th>
                      <th className="text-left text-slate-400 font-medium px-4 py-3">Agent</th>
                      <th className="text-left text-slate-400 font-medium px-4 py-3">Clause</th>
                      <th className="text-left text-slate-400 font-medium px-4 py-3">Issue</th>
                      <th className="text-left text-slate-400 font-medium px-4 py-3">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFindings.map((finding, idx) => {
                      const sev = severityConfig[finding.severity] || severityConfig.suggestion;
                      const agentName = review?.agentReviews?.find(a =>
                        a.findings.some(f => f.clause === finding.clause && f.issue === finding.issue)
                      )?.agentName || "—";
                      return (
                        <tr
                          key={idx}
                          className={`border-b border-slate-800 border-l-2 ${sev.row}`}
                          data-testid={`row-finding-${idx}`}
                        >
                          <td className="px-4 py-3">
                            <Badge className={sev.badge}>{finding.severity}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{agentName}</td>
                          <td className="px-4 py-3 text-white font-medium">{finding.clause}</td>
                          <td className="px-4 py-3 text-slate-300 max-w-xs">{finding.issue}</td>
                          <td className="px-4 py-3 text-cyan-400 max-w-xs">{finding.recommendation}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {review?.prioritizedEdits && review.prioritizedEdits.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-white mb-4" data-testid="text-prioritized-edits-heading">
              Prioritized Edits
            </h2>
            <Card className="bg-slate-900 border-slate-800 mb-8" data-testid="card-prioritized-edits">
              <CardContent className="pt-6">
                <ol className="space-y-3">
                  {review.prioritizedEdits.map((edit, idx) => (
                    <li key={idx} className="flex gap-3" data-testid={`edit-item-${idx}`}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300 text-sm">{edit}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </>
        )}

        {!review && !isLoading && (
          <Card className="bg-slate-900 border-dashed border-slate-700" data-testid="card-no-review">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Shield className="h-12 w-12 text-slate-600 mb-4" />
              <p className="text-lg font-semibold text-white mb-1">No Review Available</p>
              <p className="text-slate-400 text-sm text-center max-w-md">
                Click "Launch Review" to initiate a SENTINEL-coordinated legal review of the Unified Contract V4.
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-16" data-testid="loading-spinner">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        )}
      </div>
    </main>
  );
}
