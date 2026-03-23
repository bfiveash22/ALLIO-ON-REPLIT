import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import type { Clinic } from "@shared/schema";
import {
  MapPin,
  Search,
  Phone,
  Mail,
  Globe,
  Navigation,
  Building2,
  Shield,
  ExternalLink,
  Users,
  CheckCircle,
} from "lucide-react";

export default function ClinicLocatorPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: clinics = [], isLoading } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  const activeClinics = useMemo(() => {
    const active = clinics.filter((c) => c.pmaStatus === "active");
    if (!searchQuery.trim()) return active;
    const q = searchQuery.toLowerCase();
    return active.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q) ||
        c.doctorName?.toLowerCase().includes(q) ||
        c.pmaName?.toLowerCase().includes(q)
    );
  }, [clinics, searchQuery]);

  const getDirectionsUrl = (clinic: Clinic) => {
    const parts = [clinic.address, clinic.city, clinic.state].filter(Boolean).join(", ");
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parts)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-clinic-locator-title">
              Clinic Locator
            </h1>
            <p className="text-slate-400 mt-1">
              Find an Affiliated Clinic Association near you
            </p>
          </div>
          <Badge className="w-fit bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1">
            <Building2 className="h-3 w-3" />
            {activeClinics.length} Active Clinics
          </Badge>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name, city, state, or doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
            data-testid="input-search-clinics"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800/30 overflow-hidden" data-testid="clinic-map-placeholder">
          <div className="h-64 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-10">
              <svg viewBox="0 0 800 300" className="w-full h-full">
                <defs>
                  <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <path d="M0,150 Q100,50 200,120 T400,100 T600,150 T800,100" fill="none" stroke="url(#mapGrad)" strokeWidth="2" />
                <path d="M0,180 Q100,100 200,170 T400,150 T600,200 T800,150" fill="none" stroke="url(#mapGrad)" strokeWidth="1.5" opacity="0.5" />
                {activeClinics.slice(0, 8).map((_, i) => (
                  <circle
                    key={i}
                    cx={100 + i * 85}
                    cy={100 + Math.sin(i * 1.5) * 50}
                    r="6"
                    fill="#06b6d4"
                    opacity="0.8"
                  >
                    <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
                  </circle>
                ))}
              </svg>
            </div>
            <div className="text-center z-10">
              <MapPin className="h-10 w-10 text-cyan-400 mx-auto mb-2" />
              <p className="text-white font-medium">FFPMA Clinic Network</p>
              <p className="text-sm text-slate-400">{activeClinics.length} locations nationwide</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white/5 border-white/10">
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeClinics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeClinics.map((clinic) => (
              <Card
                key={clinic.id}
                className="bg-white/5 border-white/10 hover:border-cyan-500/30 transition-colors"
                data-testid={`clinic-card-${clinic.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-cyan-400 shrink-0" />
                        {clinic.name}
                      </CardTitle>
                      {clinic.pmaName && (
                        <p className="text-xs text-cyan-400/70 mt-1 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {clinic.pmaName}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shrink-0">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {clinic.doctorName && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Users className="h-4 w-4 text-slate-500" />
                      Dr. {clinic.doctorName}
                    </div>
                  )}

                  {(clinic.address || clinic.city || clinic.state) && (
                    <div className="flex items-start gap-2 text-sm text-slate-300">
                      <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                      <span>
                        {[clinic.address, clinic.city, clinic.state].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}

                  {clinic.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <a href={`tel:${clinic.phone}`} className="hover:text-cyan-400 transition-colors">
                        {clinic.phone}
                      </a>
                    </div>
                  )}

                  {clinic.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <a href={`mailto:${clinic.email}`} className="hover:text-cyan-400 transition-colors truncate">
                        {clinic.email}
                      </a>
                    </div>
                  )}

                  {clinic.website && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Globe className="h-4 w-4 text-slate-500" />
                      <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors truncate flex items-center gap-1">
                        {clinic.website.replace(/^https?:\/\//, "")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  <div className="pt-3 border-t border-white/10 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-white/20 text-white hover:bg-white/5 gap-1"
                      onClick={() => window.open(getDirectionsUrl(clinic), "_blank")}
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-16 text-center">
              <MapPin className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchQuery ? "No clinics match your search" : "No clinics available"}
              </h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? "Try a different search term or clear your search."
                  : "Affiliated clinics will be listed here as they join the FFPMA network."}
              </p>
              {searchQuery && (
                <Button variant="outline" size="sm" className="mt-4 border-white/20 text-white" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
