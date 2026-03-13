import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Droplets,
  Leaf,
  Heart,
  ChevronRight,
  Loader2,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface DetoxProtocol {
  slug: string;
  title: string;
  overview: string;
  content: string;
}

const protocolIcons: Record<string, typeof Droplets> = {
  "beyond-fasting": Leaf,
  "detox-bath-instructions": Droplets,
  "liver-gallbladder-cleanse": Heart,
};

const protocolColors: Record<string, string> = {
  "beyond-fasting": "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
  "detox-bath-instructions": "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  "liver-gallbladder-cleanse": "from-amber-500/20 to-orange-500/20 border-amber-500/30",
};

const protocolAccents: Record<string, string> = {
  "beyond-fasting": "text-emerald-400",
  "detox-bath-instructions": "text-blue-400",
  "liver-gallbladder-cleanse": "text-amber-400",
};

function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  let listItems: { level: number; text: string; type: "ul" | "ol" }[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    const items = [...listItems];
    listItems = [];
    elements.push(
      <ul key={`list-${elements.length}`} className="space-y-2 my-4">
        {items.map((item, i) => (
          <li key={i} className={`flex gap-2 ${item.level > 0 ? "ml-6" : ""}`}>
            <span className="text-primary mt-1 shrink-0">
              {item.type === "ol" ? `${i + 1}.` : "•"}
            </span>
            <span
              className="text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: formatInline(item.text) }}
            />
          </li>
        ))}
      </ul>
    );
  };

  const flushTable = () => {
    if (!inTable) return;
    inTable = false;
    const headers = [...tableHeaders];
    const rows = [...tableRows];
    tableHeaders = [];
    tableRows = [];
    elements.push(
      <div key={`table-${elements.length}`} className="overflow-x-auto my-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="text-left py-3 px-4 text-sm font-semibold text-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-white/5">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="py-3 px-4 text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: formatInline(cell) }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  function formatInline(text: string): string {
    const escaped = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-white/5 px-1.5 py-0.5 rounded text-xs">$1</code>');
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    if (line.startsWith("|") && line.endsWith("|")) {
      flushList();
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) continue;
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.startsWith("# ") && i === 0) continue;

    if (line.startsWith("## ")) {
      flushList();
      const text = line.replace("## ", "");
      const isWarning =
        text.toLowerCase().includes("safety") ||
        text.toLowerCase().includes("precaution");
      elements.push(
        <div
          key={`h2-${i}`}
          className={`flex items-center gap-3 mt-8 mb-4 pb-2 border-b ${isWarning ? "border-amber-500/30" : "border-white/10"}`}
        >
          {isWarning ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : text.toLowerCase().includes("timeline") ? (
            <Clock className="w-5 h-5 text-primary shrink-0" />
          ) : text.toLowerCase().includes("who") ? (
            <Users className="w-5 h-5 text-primary shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          )}
          <h2 className={`text-xl font-bold ${isWarning ? "text-amber-400" : "text-foreground"}`}>
            {text}
          </h2>
        </div>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg font-semibold text-foreground mt-6 mb-3">
          {line.replace("### ", "")}
        </h3>
      );
      continue;
    }

    const bulletMatch = line.match(/^(\s*)-\s+(.+)/);
    if (bulletMatch) {
      const level = Math.floor(bulletMatch[1].length / 2);
      listItems.push({ level, text: bulletMatch[2], type: "ul" });
      continue;
    }

    const orderedMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
    if (orderedMatch) {
      const level = Math.floor(orderedMatch[1].length / 2);
      listItems.push({ level, text: orderedMatch[2], type: "ol" });
      continue;
    }

    if (listItems.length > 0) flushList();

    if (line.trim() === "") continue;

    elements.push(
      <p
        key={`p-${i}`}
        className="text-muted-foreground leading-relaxed my-3"
        dangerouslySetInnerHTML={{ __html: formatInline(line) }}
      />
    );
  }

  flushList();
  flushTable();

  return elements;
}

export default function DetoxProtocolsPage() {
  const [, setLocation] = useLocation();
  const [protocols, setProtocols] = useState<DetoxProtocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<DetoxProtocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        const response = await fetch("/api/detox-protocols", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to load protocols");
        const data = await response.json();
        setProtocols(data);
      } catch (err) {
        setError("Failed to load detox protocols. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProtocols();
  }, []);

  const handleDownload = async (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/detox-protocols/${slug}/download`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p className="text-lg text-muted-foreground">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {selectedProtocol ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto px-4 py-8"
          >
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setSelectedProtocol(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Protocols
              </button>
              <button
                onClick={(e) => handleDownload(selectedProtocol.slug, e)}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                {(() => {
                  const Icon = protocolIcons[selectedProtocol.slug] || Leaf;
                  return (
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${protocolColors[selectedProtocol.slug] || "from-primary/20 to-primary/10"}`}>
                      <Icon className={`w-6 h-6 ${protocolAccents[selectedProtocol.slug] || "text-primary"}`} />
                    </div>
                  );
                })()}
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {selectedProtocol.title}
                </h1>
              </div>
              <div className="prose prose-invert max-w-none">
                {renderMarkdown(selectedProtocol.content)}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto px-4 py-8"
          >
            <div className="mb-8">
              <button
                onClick={() => setLocation("/resources")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Resources
              </button>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Detox Protocols
              </h1>
              <p className="text-muted-foreground text-lg">
                Comprehensive detoxification guides developed by the Forgotten
                Formula PMA medical team. Read each protocol carefully and
                consult with your physician before starting.
              </p>
            </div>

            <div className="grid gap-4">
              {protocols.map((protocol, index) => {
                const Icon = protocolIcons[protocol.slug] || Leaf;
                const colorClass =
                  protocolColors[protocol.slug] ||
                  "from-primary/20 to-primary/10 border-primary/30";
                const accentClass =
                  protocolAccents[protocol.slug] || "text-primary";

                return (
                  <motion.div
                    key={protocol.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedProtocol(protocol)}
                    className={`group cursor-pointer bg-gradient-to-br ${colorClass} border rounded-xl p-6 hover:scale-[1.01] transition-all duration-200`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-background/50">
                          <Icon className={`w-6 h-6 ${accentClass}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {protocol.title}
                          </h2>
                          <p className="text-muted-foreground text-sm line-clamp-3">
                            {protocol.overview}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={(e) => handleDownload(protocol.slug, e)}
                          className="p-2 rounded-lg hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
