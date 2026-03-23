import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ExternalLink, ChevronRight, Stethoscope, Users, Brain, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function DoctorPitchViewer() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token") || "";
  const [, navigate] = useLocation();

  const [viewed, setViewed] = useState(false);
  const viewStartRef = useRef<number | null>(null);

  const { data: info, isError } = useQuery({
    queryKey: ["/api/recruitment/pitch-deck-info", token],
    queryFn: async () => {
      const res = await fetch(`/api/recruitment/pitch-deck-info?token=${token}`);
      if (!res.ok) throw new Error("Invalid link");
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const viewMutation = useMutation({
    mutationFn: async (timeSpentSeconds: number) => {
      await fetch("/api/recruitment/pitch-deck-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, timeSpentSeconds }),
      });
    },
  });

  useEffect(() => {
    if (token && info?.success && !viewed) {
      setViewed(true);
      viewStartRef.current = Date.now();
      viewMutation.mutate(0);
    }
  }, [token, info]);

  useEffect(() => {
    if (!viewed || !token) return;
    const handleUnload = () => {
      if (viewStartRef.current) {
        const timeSpentSeconds = Math.round((Date.now() - viewStartRef.current) / 1000);
        if (timeSpentSeconds > 5) {
          const blob = new Blob(
            [JSON.stringify({ token, timeSpentSeconds, updateTimeOnly: true })],
            { type: "application/json" }
          );
          navigator.sendBeacon("/api/recruitment/pitch-deck-view", blob);
        }
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [viewed, token]);

  const pitchDeckUrl = `${window.location.origin}/doctor-pitch-deck/`;

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Stethoscope className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">ALLIO Doctor Pitch Deck</h2>
          <p className="text-gray-400 mb-6">
            This is a personalized presentation for prospective ALLIO doctor partners.
            If you received a link, please use the full link including your unique token.
          </p>
          <Button
            onClick={() => navigate("/doctor-interest")}
            className="bg-cyan-500 hover:bg-cyan-400 text-white"
          >
            Express Interest
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Link Expired or Invalid</h2>
          <p className="text-gray-400 mb-6">
            This pitch deck link is no longer valid. Please contact us to receive a new personalized link.
          </p>
          <Button
            onClick={() => navigate("/doctor-interest")}
            className="bg-cyan-500 hover:bg-cyan-400 text-white"
          >
            Express Interest
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-900 flex flex-col">
      <div className="bg-slate-900/95 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">ALLIO Doctor Partnership Opportunity</p>
            {info?.name && (
              <p className="text-cyan-400 text-xs">Personalized for {info.name}</p>
            )}
          </div>
        </div>
        <Button
          onClick={() => navigate(`/doctor-interest${token ? `?token=${token}` : ""}`)}
          className="bg-cyan-500 hover:bg-cyan-400 text-white text-sm"
          size="sm"
          data-testid="button-express-interest"
        >
          Express Interest
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="flex-1 relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-full"
          style={{ minHeight: "calc(100vh - 72px)" }}
        >
          <iframe
            src={pitchDeckUrl}
            className="w-full"
            style={{ height: "calc(100vh - 72px)", border: "none" }}
            title="ALLIO Doctor Recruitment Pitch Deck"
            data-testid="iframe-pitch-deck"
            allow="fullscreen"
            onError={() => {
              const el = document.getElementById("pitch-fallback");
              if (el) el.style.display = "flex";
            }}
          />
        </motion.div>
        <div
          id="pitch-fallback"
          style={{ display: "none" }}
          className="absolute inset-0 bg-slate-900 flex-col items-center justify-center gap-4"
        >
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="text-white font-semibold">Open the presentation in a new tab</p>
          <a
            href={pitchDeckUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cyan-500 hover:bg-cyan-400 text-white px-6 py-2 rounded-md text-sm font-medium"
          >
            Open Pitch Deck
          </a>
        </div>
      </div>

      <div className="bg-slate-900/95 border-t border-slate-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Join 100+ practitioners</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-400" />
              <span>AI-powered member support</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Full PMA compliance</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-gray-400 hover:text-white"
            onClick={() => window.open(pitchDeckUrl, "_blank")}
            data-testid="button-open-fullscreen"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Fullscreen
          </Button>
        </div>
      </div>
    </div>
  );
}
