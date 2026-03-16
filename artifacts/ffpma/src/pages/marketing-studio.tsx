import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Image,
  Video,
  Wand2,
  Download,
  Loader2,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Palette,
  Layout,
  Share2,
  FileImage,
  BarChart3,
  Zap,
  Brain,
  Play,
  Clock,
  Film,
  ExternalLink,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type StyleType = 'healing' | 'professional' | 'educational' | 'marketing';
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3';
type AssetType = 'social_post' | 'banner' | 'product_image' | 'infographic';

interface GeneratedImage {
  imageBase64: string;
  modelUsed: string;
  prompt: string;
  metadata: {
    width: number;
    height: number;
    generatedAt: string;
  };
}

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  sceneCount: number;
  totalDuration: number;
}

interface VideoProductionResult {
  success: boolean;
  videoPath?: string;
  driveLink?: string;
  driveFileId?: string;
  steps: string[];
  duration: number;
  error?: string;
  title?: string;
  sceneCount?: number;
  totalDuration?: number;
  message?: string;
}

export default function MarketingStudioPage() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle] = useState<StyleType>("marketing");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [assetType, setAssetType] = useState<AssetType>("social_post");
  const [assetDescription, setAssetDescription] = useState("");
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [videoTitle, setVideoTitle] = useState("");
  const [voiceStyle, setVoiceStyle] = useState<"female" | "male" | "neutral">("neutral");
  const [videoResult, setVideoResult] = useState<VideoProductionResult | null>(null);

  const { data: mediaStatus } = useQuery<{
    imageGeneration: boolean;
    videoGeneration: boolean;
    availableModels: string[];
    status: string;
  }>({
    queryKey: ["/api/media/status"],
    refetchInterval: 60000,
  });

  const { data: agentStatus } = useQuery<{
    available: boolean;
    primaryModel: string;
    fallbackModel: string;
    status: string;
  }>({
    queryKey: ["/api/agents/status"],
    refetchInterval: 60000,
  });

  const { data: videoTemplates } = useQuery<{ templates: VideoTemplate[] }>({
    queryKey: ["/api/video/templates"],
    refetchInterval: 300000,
  });

  const generateImageMutation = useMutation({
    mutationFn: async (data: {
      prompt: string;
      negativePrompt?: string;
      style?: StyleType;
      aspectRatio?: AspectRatio;
    }) => {
      const response = await apiRequest("POST", "/api/media/generate-image", data);
      return response.json();
    },
    onSuccess: (data: GeneratedImage) => {
      setGeneratedImages((prev) => [data, ...prev]);
    },
  });

  const generateAssetMutation = useMutation({
    mutationFn: async (data: { type: AssetType; description: string }) => {
      const response = await apiRequest("POST", "/api/media/marketing-asset", data);
      return response.json();
    },
    onSuccess: (data: GeneratedImage) => {
      setGeneratedImages((prev) => [data, ...prev]);
    },
  });

  const generateVideoMutation = useMutation({
    mutationFn: async (data: {
      templateId?: string;
      title: string;
      voiceStyle?: string;
      uploadToDrive?: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/video/auto-produce", data);
      return response.json();
    },
    onSuccess: (data: VideoProductionResult) => {
      setVideoResult(data);
    },
  });

  const handleGenerateImage = () => {
    if (!prompt.trim()) return;
    generateImageMutation.mutate({
      prompt,
      negativePrompt: negativePrompt || undefined,
      style,
      aspectRatio,
    });
  };

  const handleGenerateAsset = () => {
    if (!assetDescription.trim()) return;
    generateAssetMutation.mutate({
      type: assetType,
      description: assetDescription,
    });
  };

  const handleGenerateVideo = () => {
    if (!videoTitle.trim()) return;
    setVideoResult(null);
    generateVideoMutation.mutate({
      templateId: selectedTemplate || undefined,
      title: videoTitle,
      voiceStyle,
      uploadToDrive: true,
    });
  };

  const downloadImage = (image: GeneratedImage, index: number) => {
    const link = document.createElement("a");
    link.href = image.imageBase64;
    link.download = `ffpma-marketing-${index + 1}.png`;
    link.click();
  };

  const stylePresets = [
    { value: "healing", label: "Healing", icon: "\u{1F49A}", desc: "Soft, calming wellness aesthetic" },
    { value: "professional", label: "Professional", icon: "\u{1F4BC}", desc: "Clean corporate look" },
    { value: "educational", label: "Educational", icon: "\u{1F4DA}", desc: "Clear informative style" },
    { value: "marketing", label: "Marketing", icon: "\u{1F680}", desc: "Vibrant engaging visuals" },
  ];

  const assetTypes = [
    { value: "social_post", label: "Social Post", icon: Share2, ratio: "1:1" },
    { value: "banner", label: "Banner", icon: Layout, ratio: "16:9" },
    { value: "product_image", label: "Product Image", icon: FileImage, ratio: "4:3" },
    { value: "infographic", label: "Infographic", icon: BarChart3, ratio: "9:16" },
  ];

  const templates = videoTemplates?.templates || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/resources">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3" data-testid="text-page-title">
              <Sparkles className="h-8 w-8 text-purple-400" />
              Marketing Studio
            </h1>
            <p className="text-slate-400">
              AI-powered asset generation for healing-focused marketing
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            {mediaStatus?.imageGeneration ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="w-3 h-3 mr-1" /> Image Gen Ready
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <XCircle className="w-3 h-3 mr-1" /> Image Gen Offline
              </Badge>
            )}
            {mediaStatus?.videoGeneration ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Film className="w-3 h-3 mr-1" /> Video Ready
              </Badge>
            ) : (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Film className="w-3 h-3 mr-1" /> Video Offline
              </Badge>
            )}
            {agentStatus?.available ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Brain className="w-3 h-3 mr-1" /> Agents Online
              </Badge>
            ) : (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Brain className="w-3 h-3 mr-1" /> Agents Loading
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="custom" className="space-y-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="custom" className="data-[state=active]:bg-purple-600">
              <Wand2 className="w-4 h-4 mr-2" />
              Custom Generation
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-purple-600">
              <Layout className="w-4 h-4 mr-2" />
              Quick Templates
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-purple-600">
              <Image className="w-4 h-4 mr-2" />
              Gallery ({generatedImages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-400" />
                    Image Generator
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Create custom images with AI using FLUX.1 or Stable Diffusion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Prompt</label>
                    <Textarea
                      data-testid="textarea-image-prompt"
                      placeholder="Describe the image you want to create..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[100px] bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">
                      Negative Prompt (optional)
                    </label>
                    <Input
                      data-testid="input-negative-prompt"
                      placeholder="What to avoid..."
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-300 mb-2 block">Style</label>
                      <Select value={style} onValueChange={(v) => setStyle(v as StyleType)}>
                        <SelectTrigger
                          data-testid="select-style"
                          className="bg-slate-800/50 border-slate-700 text-white"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {stylePresets.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              <span className="flex items-center gap-2">
                                <span>{s.icon}</span>
                                <span>{s.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm text-slate-300 mb-2 block">Aspect Ratio</label>
                      <Select
                        value={aspectRatio}
                        onValueChange={(v) => setAspectRatio(v as AspectRatio)}
                      >
                        <SelectTrigger
                          data-testid="select-aspect-ratio"
                          className="bg-slate-800/50 border-slate-700 text-white"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1:1">Square (1:1)</SelectItem>
                          <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                          <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                          <SelectItem value="4:3">Standard (4:3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    data-testid="button-generate-image"
                    onClick={handleGenerateImage}
                    disabled={!prompt.trim() || generateImageMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                  >
                    {generateImageMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>

                  {generateImageMutation.isError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm">
                        {(generateImageMutation.error as Error)?.message || "Generation failed"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-cyan-400" />
                    Video Generation
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Produce marketing videos with PRISM (narration + images + music)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Video Title</label>
                    <Input
                      data-testid="input-video-title"
                      placeholder="e.g., Peptide Therapy Introduction"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Template (optional)</label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger
                        data-testid="select-video-template"
                        className="bg-slate-800/50 border-slate-700 text-white"
                      >
                        <SelectValue placeholder="Choose a template or leave blank for custom..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No template (custom)</SelectItem>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            <span className="flex items-center gap-2">
                              <Film className="w-3 h-3" />
                              {t.name} ({t.sceneCount} scenes, {t.totalDuration}s)
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate && selectedTemplate !== "none" && (
                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                      <p className="text-cyan-300 text-sm">
                        {templates.find(t => t.id === selectedTemplate)?.description}
                      </p>
                      <div className="flex gap-3 mt-2">
                        <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {templates.find(t => t.id === selectedTemplate)?.totalDuration}s
                        </Badge>
                        <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                          <Film className="w-3 h-3 mr-1" />
                          {templates.find(t => t.id === selectedTemplate)?.sceneCount} scenes
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Voice Style</label>
                    <Select value={voiceStyle} onValueChange={(v) => setVoiceStyle(v as "female" | "male" | "neutral")}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    data-testid="button-generate-video"
                    onClick={handleGenerateVideo}
                    disabled={!videoTitle.trim() || generateVideoMutation.isPending}
                    className="w-full bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-700 hover:to-violet-700"
                  >
                    {generateVideoMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Producing Video...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Produce Video
                      </>
                    )}
                  </Button>

                  {generateVideoMutation.isError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm">
                        {(generateVideoMutation.error as Error)?.message || "Video production failed"}
                      </p>
                    </div>
                  )}

                  {videoResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border ${
                        videoResult.success
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {videoResult.success ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`text-sm font-medium ${videoResult.success ? "text-green-300" : "text-red-300"}`}>
                          {videoResult.success ? "Video Produced Successfully" : "Production Failed"}
                        </span>
                      </div>
                      {videoResult.steps && videoResult.steps.length > 0 && (
                        <ScrollArea className="max-h-[120px]">
                          <ul className="space-y-1">
                            {videoResult.steps.map((step, i) => (
                              <li key={i} className="text-xs text-slate-400 flex items-start gap-1">
                                <span className="text-cyan-500 mt-0.5">&#8227;</span>
                                {step}
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      )}
                      {videoResult.driveLink && (
                        <a
                          href={videoResult.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View on Google Drive
                        </a>
                      )}
                      {videoResult.duration > 0 && (
                        <p className="text-xs text-slate-500 mt-2">
                          Production time: {videoResult.duration.toFixed(1)}s
                        </p>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Quick Asset Generator
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Generate brand-aligned marketing assets with one click
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {assetTypes.map((type) => (
                    <motion.button
                      key={type.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAssetType(type.value as AssetType)}
                      data-testid={`button-asset-type-${type.value}`}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        assetType === type.value
                          ? "border-purple-500 bg-purple-500/20"
                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                      }`}
                    >
                      <type.icon
                        className={`w-8 h-8 mx-auto mb-2 ${
                          assetType === type.value ? "text-purple-400" : "text-slate-400"
                        }`}
                      />
                      <p className="text-white text-sm font-medium">{type.label}</p>
                      <p className="text-slate-500 text-xs">{type.ratio}</p>
                    </motion.button>
                  ))}
                </div>

                <div>
                  <label className="text-sm text-slate-300 mb-2 block">
                    Describe what you need
                  </label>
                  <Textarea
                    data-testid="textarea-asset-description"
                    placeholder={`Describe your ${assetTypes.find((t) => t.value === assetType)?.label.toLowerCase()}...`}
                    value={assetDescription}
                    onChange={(e) => setAssetDescription(e.target.value)}
                    className="min-h-[100px] bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <Button
                  data-testid="button-generate-asset"
                  onClick={handleGenerateAsset}
                  disabled={!assetDescription.trim() || generateAssetMutation.isPending}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-semibold"
                >
                  {generateAssetMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Asset...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate{" "}
                      {assetTypes.find((t) => t.value === assetType)?.label}
                    </>
                  )}
                </Button>

                {generateAssetMutation.isError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">
                      {(generateAssetMutation.error as Error)?.message || "Asset generation failed"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {templates.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Film className="w-5 h-5 text-cyan-400" />
                    Video Templates
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Pre-built video templates for common marketing needs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 rounded-lg border border-slate-700 bg-slate-800/30 hover:border-cyan-500/40 transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setVideoTitle(template.name);
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Video className="w-5 h-5 text-cyan-400" />
                          <Badge variant="outline" className="text-xs border-slate-600 capitalize">
                            {template.category}
                          </Badge>
                        </div>
                        <h4 className="text-white text-sm font-medium mb-1">{template.name}</h4>
                        <p className="text-slate-400 text-xs line-clamp-2 mb-3">{template.description}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {template.totalDuration}s
                          </Badge>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                            {template.sceneCount} scenes
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="gallery">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Image className="w-5 h-5 text-purple-400" />
                  Generated Assets
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Your AI-generated marketing images
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedImages.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Image className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No images generated yet</p>
                    <p className="text-sm">Use the generator above to create marketing assets</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedImages.map((image, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="relative group"
                        >
                          <img
                            src={image.imageBase64}
                            alt={`Generated ${idx + 1}`}
                            className="w-full rounded-lg border border-slate-700"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-end p-4">
                            <p className="text-white text-xs line-clamp-2 mb-2">
                              {image.prompt}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {image.metadata.width}x{image.metadata.height}
                              </Badge>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => downloadImage(image, idx)}
                                data-testid={`button-download-image-${idx}`}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
