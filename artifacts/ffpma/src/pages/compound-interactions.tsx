import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Search,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  Clock,
  Pill,
  ShieldAlert,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Beaker,
} from "lucide-react";
import {
  compounds,
  interactions,
  stackingProtocols,
  compoundCategoryLabels,
  type Compound,
  type CompoundInteraction,
  type CompoundCategory,
  type InteractionType,
} from "@shared/compound-interactions-data";

const interactionTypeConfig: Record<
  InteractionType,
  { label: string; color: string; badgeVariant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }
> = {
  synergy: {
    label: "Synergy",
    color: "text-emerald-600",
    badgeVariant: "default",
    icon: CheckCircle2,
  },
  caution: {
    label: "Caution",
    color: "text-amber-600",
    badgeVariant: "secondary",
    icon: AlertTriangle,
  },
  contraindication: {
    label: "Contraindication",
    color: "text-red-600",
    badgeVariant: "destructive",
    icon: ShieldAlert,
  },
};

const categoryColors: Record<CompoundCategory, string> = {
  peptide: "bg-blue-100 text-blue-800",
  cannabinoid: "bg-green-100 text-green-800",
  supplement: "bg-purple-100 text-purple-800",
  "iv-therapy": "bg-orange-100 text-orange-800",
  botanical: "bg-emerald-100 text-emerald-800",
  "amino-acid": "bg-pink-100 text-pink-800",
};

function getCompoundWarnings(compoundId: string) {
  const related = interactions.filter(
    (i) => i.compoundA === compoundId || i.compoundB === compoundId
  );
  const contraindications = related.filter((i) => i.type === "contraindication").length;
  const cautions = related.filter((i) => i.type === "caution").length;
  return { contraindications, cautions };
}

function CompoundCard({ compound, onSelect }: { compound: Compound; onSelect: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const warnings = getCompoundWarnings(compound.id);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base">{compound.name}</CardTitle>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge className={categoryColors[compound.category]} variant="outline">
                {compoundCategoryLabels[compound.category]}
              </Badge>
              {warnings.contraindications > 0 && (
                <Badge variant="destructive" className="flex items-center gap-0.5 text-[10px]">
                  <ShieldAlert className="h-3 w-3" />
                  {warnings.contraindications} contraindication{warnings.contraindications > 1 ? "s" : ""}
                </Badge>
              )}
              {warnings.cautions > 0 && (
                <Badge variant="secondary" className="flex items-center gap-0.5 text-[10px] bg-amber-100 text-amber-800">
                  <AlertTriangle className="h-3 w-3" />
                  {warnings.cautions} caution{warnings.cautions > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(compound.id)}
          >
            Interactions
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{compound.description}</p>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <Pill className="h-3 w-3" />
            {compound.defaultDose}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {compound.timing}
          </span>
        </div>

        <div>
          <button
            className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            onClick={() => setExpanded(!expanded)}
          >
            <Lightbulb className="h-3 w-3" />
            Bioavailability Tips
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1">
              {compound.bioavailabilityTips.map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InteractionCard({ interaction }: { interaction: CompoundInteraction }) {
  const compoundA = compounds.find((c) => c.id === interaction.compoundA);
  const compoundB = compounds.find((c) => c.id === interaction.compoundB);
  const config = interactionTypeConfig[interaction.type];
  const Icon = config.icon;

  return (
    <Card className={`border-l-4 ${
      interaction.type === "synergy" ? "border-l-emerald-500" :
      interaction.type === "caution" ? "border-l-amber-500" :
      "border-l-red-500"
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{compoundA?.name}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">{compoundB?.name}</span>
          </div>
          <Badge variant={config.badgeVariant} className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{interaction.description}</p>
        <div className="rounded-md bg-muted/50 p-3 space-y-2">
          <div>
            <span className="text-xs font-semibold uppercase text-muted-foreground">Mechanism</span>
            <p className="text-xs text-muted-foreground mt-0.5">{interaction.mechanism}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-muted-foreground">Recommendation</span>
            <p className="text-xs mt-0.5">{interaction.recommendation}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PairingLookup() {
  const [compoundAId, setCompoundAId] = useState<string>("");
  const [compoundBId, setCompoundBId] = useState<string>("");

  const result = useMemo(() => {
    if (!compoundAId || !compoundBId) return null;
    return interactions.find(
      (i) =>
        (i.compoundA === compoundAId && i.compoundB === compoundBId) ||
        (i.compoundA === compoundBId && i.compoundB === compoundAId)
    );
  }, [compoundAId, compoundBId]);

  const noResult = compoundAId && compoundBId && !result;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FlaskConical className="h-5 w-5 text-primary" />
          Pairing Lookup
        </CardTitle>
        <CardDescription>
          Select two compounds to check their interaction profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Compound A</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={compoundAId}
              onChange={(e) => setCompoundAId(e.target.value)}
            >
              <option value="">Select compound...</option>
              {compounds.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Compound B</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={compoundBId}
              onChange={(e) => setCompoundBId(e.target.value)}
            >
              <option value="">Select compound...</option>
              {compounds
                .filter((c) => c.id !== compoundAId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {result && <InteractionCard interaction={result} />}

        {noResult && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Direct Interaction Found</AlertTitle>
            <AlertDescription>
              No documented interaction exists between these two compounds. This does not guarantee safety — always consult a qualified practitioner when combining compounds.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default function CompoundInteractionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CompoundCategory | "all">("all");
  const [interactionFilter, setInteractionFilter] = useState<InteractionType | "all">("all");
  const [selectedCompoundId, setSelectedCompoundId] = useState<string | null>(null);

  const filteredCompounds = useMemo(() => {
    return compounds.filter((c) => {
      const matchesSearch =
        searchTerm === "" ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || c.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const filteredInteractions = useMemo(() => {
    let filtered = interactions;
    if (interactionFilter !== "all") {
      filtered = filtered.filter((i) => i.type === interactionFilter);
    }
    if (selectedCompoundId) {
      filtered = filtered.filter(
        (i) => i.compoundA === selectedCompoundId || i.compoundB === selectedCompoundId
      );
    }
    if (searchTerm && !selectedCompoundId) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((i) => {
        const a = compounds.find((c) => c.id === i.compoundA);
        const b = compounds.find((c) => c.id === i.compoundB);
        return (
          a?.name.toLowerCase().includes(term) ||
          b?.name.toLowerCase().includes(term) ||
          i.description.toLowerCase().includes(term)
        );
      });
    }
    return filtered;
  }, [interactionFilter, selectedCompoundId, searchTerm]);

  const selectedCompound = selectedCompoundId
    ? compounds.find((c) => c.id === selectedCompoundId)
    : null;

  const handleSelectCompound = (id: string) => {
    setSelectedCompoundId(id);
  };

  const categories = Object.keys(compoundCategoryLabels) as CompoundCategory[];

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                Compound Interactions
              </h1>
              <p className="text-muted-foreground">
                Explore synergies, contraindications, and stacking protocols
              </p>
            </div>
          </div>
        </div>

        <Alert className="mb-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Practitioner Reference Only</AlertTitle>
          <AlertDescription>
            This tool is provided as a reference for qualified practitioners. All compound combinations should be evaluated in the context of individual member profiles, medical history, and current medications. This is not medical advice.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="compounds" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="compounds" className="flex items-center gap-2" data-testid="tab-compounds">
              <Beaker className="h-4 w-4" />
              Compounds
            </TabsTrigger>
            <TabsTrigger value="interactions" className="flex items-center gap-2" data-testid="tab-interactions">
              <FlaskConical className="h-4 w-4" />
              Interactions
            </TabsTrigger>
            <TabsTrigger value="stacking" className="flex items-center gap-2" data-testid="tab-stacking">
              <Layers className="h-4 w-4" />
              Stacking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compounds" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search compounds..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-compounds"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  All
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {compoundCategoryLabels[cat]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompounds.map((compound) => (
                <CompoundCard
                  key={compound.id}
                  compound={compound}
                  onSelect={handleSelectCompound}
                />
              ))}
            </div>

            {filteredCompounds.length === 0 && (
              <div className="text-center py-12">
                <Beaker className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No compounds found</h3>
                <p className="text-muted-foreground">Try adjusting your search or category filter</p>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground">
              Showing {filteredCompounds.length} of {compounds.length} compounds
            </div>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-6">
            <PairingLookup />

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={interactionFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInteractionFilter("all")}
                >
                  All Types
                </Button>
                {(Object.keys(interactionTypeConfig) as InteractionType[]).map((type) => {
                  const cfg = interactionTypeConfig[type];
                  const Icon = cfg.icon;
                  return (
                    <Button
                      key={type}
                      variant={interactionFilter === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInteractionFilter(type)}
                      className="flex items-center gap-1"
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </Button>
                  );
                })}
              </div>

              {selectedCompoundId && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Filtered: {selectedCompound?.name}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCompoundId(null)}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {filteredInteractions.map((interaction, idx) => (
                <InteractionCard key={idx} interaction={interaction} />
              ))}
            </div>

            {filteredInteractions.length === 0 && (
              <div className="text-center py-12">
                <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No interactions found</h3>
                <p className="text-muted-foreground">Try adjusting your filters</p>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground">
              Showing {filteredInteractions.length} of {interactions.length} interactions
            </div>
          </TabsContent>

          <TabsContent value="stacking" className="space-y-6">
            {stackingProtocols.map((protocol) => (
              <Card key={protocol.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" />
                      {protocol.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {protocol.duration}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{protocol.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Protocol Compounds</h4>
                    <div className="space-y-2">
                      {protocol.compounds.map((entry) => {
                        const compound = compounds.find((c) => c.id === entry.compoundId);
                        if (!compound) return null;
                        return (
                          <div
                            key={entry.compoundId}
                            className="flex items-center gap-4 rounded-md border p-3 text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{compound.name}</div>
                              <Badge
                                className={`mt-0.5 text-[10px] ${categoryColors[compound.category]}`}
                                variant="outline"
                              >
                                {compoundCategoryLabels[compound.category]}
                              </Badge>
                            </div>
                            <div className="text-right text-xs text-muted-foreground space-y-0.5 shrink-0">
                              <div className="flex items-center gap-1 justify-end">
                                <Pill className="h-3 w-3" />
                                {entry.dose}
                              </div>
                              <div className="flex items-center gap-1 justify-end">
                                <Clock className="h-3 w-3" />
                                {entry.timing}
                              </div>
                              <div>{entry.route}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      Protocol Notes
                    </h4>
                    <ul className="space-y-1">
                      {protocol.notes.map((note, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-primary mt-0.5 shrink-0">{i + 1}.</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
