import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Image,
  Folder,
  Search,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  Layout,
  Smartphone,
  Globe,
  Heart,
  Users,
  Zap,
  Video,
  Play,
} from "lucide-react";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  files: DriveFile[];
}

interface DriveStructure {
  allio: { id: string; name: string } | null;
  subfolders: DriveFolder[];
}

const assetCategories = [
  { id: "social", label: "Social Media", icon: Smartphone, keywords: ["twitter", "facebook", "instagram", "social"] },
  { id: "hero", label: "Hero & Landing", icon: Layout, keywords: ["hero", "landing", "banner", "welcome"] },
  { id: "brand", label: "Brand Identity", icon: Sparkles, keywords: ["logo", "brand", "pattern", "masterpiece"] },
  { id: "healing", label: "Healing Visuals", icon: Heart, keywords: ["healing", "wellness", "frequency", "dna", "cellular", "transformation"] },
  { id: "promo", label: "Promotional", icon: Zap, keywords: ["countdown", "coming", "launch", "save", "promo", "teaser"] },
  { id: "division", label: "Divisions", icon: Users, keywords: ["science", "training", "trustee", "doctor", "support", "agent"] },
  { id: "all", label: "All Assets", icon: Globe, keywords: [] },
];

function categorizeAsset(filename: string): string {
  const lower = filename.toLowerCase();
  for (const cat of assetCategories) {
    if (cat.id === "all") continue;
    if (cat.keywords.some(kw => lower.includes(kw))) {
      return cat.id;
    }
  }
  return "all";
}

function formatFileSize(bytes: string | undefined): string {
  if (!bytes) return "Unknown";
  const mb = parseInt(bytes) / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AssetGalleryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: driveStructure, isLoading, refetch, isRefetching } = useQuery<DriveStructure>({
    queryKey: ["/api/drive/structure"],
    staleTime: 60000,
  });

  const pixelFolder = driveStructure?.subfolders?.find(f => f.name === "PIXEL - Design Assets");
  const prismFolder = driveStructure?.subfolders?.find(f => f.name === "PRISM - Videos");
  
  const allImages = pixelFolder?.files?.filter(f => f.mimeType.startsWith("image/")) || [];
  const allVideos = prismFolder?.files?.filter(f => f.mimeType.startsWith("video/")) || [];
  const allAssets = [...allImages, ...allVideos];

  const filteredAssets = allAssets.filter(asset => {
    const matchesSearch = !searchTerm || asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || categorizeAsset(asset.name) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const uniqueAssets = filteredAssets.reduce((acc, asset) => {
    if (!acc.find(a => a.name === asset.name)) {
      acc.push(asset);
    }
    return acc;
  }, [] as DriveFile[]);

  const categoryStats = assetCategories.map(cat => ({
    ...cat,
    count: cat.id === "all" 
      ? allAssets.length 
      : allAssets.filter(a => categorizeAsset(a.name) === cat.id).length,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                <Image className="w-6 h-6 text-white" />
              </div>
              ALLIO Asset Gallery
            </h1>
            <p className="text-slate-400 mt-1">
              Media team's brand assets from Google Drive ({allImages.length} images, {allVideos.length} videos)
            </p>
          </div>
          <Button
            data-testid="button-refresh-assets"
            onClick={() => refetch()}
            disabled={isRefetching}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            {isRefetching ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {categoryStats.map(cat => (
            <button
              key={cat.id}
              data-testid={`button-category-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3 rounded-lg border transition-all ${
                selectedCategory === cat.id
                  ? "bg-cyan-600/20 border-cyan-500 text-cyan-400"
                  : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              <cat.icon className="w-5 h-5 mx-auto mb-1" />
              <div className="text-xs font-medium">{cat.label}</div>
              <div className="text-lg font-bold">{cat.count}</div>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
          <Input
            data-testid="input-search-assets"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            <span className="ml-3 text-slate-400">Loading assets from Drive...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {uniqueAssets.map((asset) => (
              <Dialog key={asset.id}>
                <DialogTrigger asChild>
                  <Card
                    data-testid={`card-asset-${asset.id}`}
                    className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-all group overflow-hidden"
                  >
                    <div className="aspect-square relative overflow-hidden bg-slate-800">
                      {asset.thumbnailLink ? (
                        <img
                          src={asset.thumbnailLink.replace("=s220", "=s400")}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {asset.mimeType.startsWith("video/") ? (
                            <Video className="w-12 h-12 text-purple-500" />
                          ) : (
                            <Image className="w-12 h-12 text-slate-600" />
                          )}
                        </div>
                      )}
                      {asset.mimeType.startsWith("video/") && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-white ml-1" />
                          </div>
                        </div>
                      )}
                      <Badge className={`absolute top-2 right-2 text-xs ${
                        asset.mimeType.startsWith("video/") 
                          ? "bg-purple-600/80" 
                          : "bg-slate-900/80"
                      }`}>
                        {asset.mimeType.startsWith("video/") ? "VIDEO" : formatFileSize(asset.size)}
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm text-white truncate font-medium">
                        {asset.name.replace("allio_", "").replace(".png", "").replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDate(asset.createdTime)}
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-4xl bg-slate-900 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {asset.name.replace("allio_", "").replace(".png", "").replace(/_/g, " ")}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden bg-slate-800">
                      {asset.mimeType.startsWith("video/") ? (
                        <div className="aspect-video flex flex-col items-center justify-center p-8 space-y-4">
                          <div className="w-20 h-20 bg-purple-600/30 rounded-full flex items-center justify-center">
                            <Video className="w-10 h-10 text-purple-400" />
                          </div>
                          <p className="text-white font-medium text-center">{asset.name}</p>
                          <p className="text-slate-400 text-sm text-center">
                            Click "Open in Drive" to view or download this video
                          </p>
                          {asset.webViewLink && (
                            <Button
                              asChild
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <a href={asset.webViewLink} target="_blank" rel="noopener noreferrer">
                                <Play className="w-4 h-4 mr-2" />
                                Play Video in Drive
                              </a>
                            </Button>
                          )}
                        </div>
                      ) : asset.thumbnailLink ? (
                        <img
                          src={asset.thumbnailLink.replace("=s220", "=s800")}
                          alt={asset.name}
                          className="w-full max-h-[60vh] object-contain"
                        />
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-400">
                        <span className="mr-4">Size: {formatFileSize(asset.size)}</span>
                        <span className="mr-4">Created: {formatDate(asset.createdTime)}</span>
                        {asset.mimeType.startsWith("video/") && (
                          <Badge className="bg-purple-600/50 text-purple-300">Video</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {asset.webViewLink && !asset.mimeType.startsWith("video/") && (
                          <Button
                            data-testid="button-view-drive"
                            asChild
                            variant="outline"
                            className="border-slate-700 text-slate-300"
                          >
                            <a href={asset.webViewLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open in Drive
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}

        {!isLoading && uniqueAssets.length === 0 && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Folder className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No assets found</h3>
              <p className="text-slate-400">
                {searchTerm ? "Try a different search term" : "Upload assets to the PIXEL folder in Drive"}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Asset Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-cyan-400">{allAssets.length}</div>
                <div className="text-sm text-slate-400">Total Assets</div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-amber-400">
                  {(allAssets.reduce((sum, a) => sum + parseInt(a.size || "0"), 0) / 1024 / 1024).toFixed(1)} MB
                </div>
                <div className="text-sm text-slate-400">Total Size</div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-400">
                  {new Set(allAssets.map(a => a.name)).size}
                </div>
                <div className="text-sm text-slate-400">Unique Files</div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  {categoryStats.filter(c => c.count > 0 && c.id !== "all").length}
                </div>
                <div className="text-sm text-slate-400">Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
