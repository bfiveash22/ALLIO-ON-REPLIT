import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Brain,
  Heart,
  Activity,
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
  Leaf,
  Target,
} from "lucide-react";

interface AssessmentQuestion {
  id: string;
  question: string;
  category: "mood" | "sleep" | "pain" | "digestion" | "immunity" | "stress";
  options: { value: number; label: string }[];
}

const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: "mood-1",
    question: "How would you rate your overall mood stability?",
    category: "mood",
    options: [
      { value: 1, label: "Very unstable - frequent mood swings" },
      { value: 2, label: "Somewhat unstable" },
      { value: 3, label: "Average" },
      { value: 4, label: "Mostly stable" },
      { value: 5, label: "Very stable and balanced" },
    ],
  },
  {
    id: "sleep-1",
    question: "How is your sleep quality?",
    category: "sleep",
    options: [
      { value: 1, label: "Poor - rarely restful" },
      { value: 2, label: "Fair - often disturbed" },
      { value: 3, label: "Average" },
      { value: 4, label: "Good - usually restful" },
      { value: 5, label: "Excellent - consistently deep and restful" },
    ],
  },
  {
    id: "pain-1",
    question: "How often do you experience chronic pain or inflammation?",
    category: "pain",
    options: [
      { value: 1, label: "Constant daily pain" },
      { value: 2, label: "Frequent pain (most days)" },
      { value: 3, label: "Occasional pain (weekly)" },
      { value: 4, label: "Rare pain (monthly or less)" },
      { value: 5, label: "Almost never experience pain" },
    ],
  },
  {
    id: "digestion-1",
    question: "How would you describe your digestive health?",
    category: "digestion",
    options: [
      { value: 1, label: "Very poor - constant issues" },
      { value: 2, label: "Fair - frequent problems" },
      { value: 3, label: "Average" },
      { value: 4, label: "Good - occasional issues" },
      { value: 5, label: "Excellent - rarely any problems" },
    ],
  },
  {
    id: "immunity-1",
    question: "How often do you get sick or feel run down?",
    category: "immunity",
    options: [
      { value: 1, label: "Very often - constantly fighting something" },
      { value: 2, label: "Often - several times a month" },
      { value: 3, label: "Sometimes - a few times per season" },
      { value: 4, label: "Rarely - maybe once or twice a year" },
      { value: 5, label: "Almost never get sick" },
    ],
  },
  {
    id: "stress-1",
    question: "How well do you manage stress?",
    category: "stress",
    options: [
      { value: 1, label: "Very poorly - constantly overwhelmed" },
      { value: 2, label: "Poorly - often stressed" },
      { value: 3, label: "Average" },
      { value: 4, label: "Well - usually cope effectively" },
      { value: 5, label: "Excellent - stress rarely affects me" },
    ],
  },
];

const ecsInfo = {
  overview: {
    title: "The Endocannabinoid System (ECS)",
    description: "Your body's master regulatory system, discovered in the 1990s. The ECS is responsible for maintaining homeostasis - the balance of all physiological processes.",
    points: [
      "Every vertebrate has an ECS",
      "Contains receptors found throughout the body",
      "Regulates mood, sleep, pain, appetite, immunity, and more",
      "Can become deficient or imbalanced",
    ],
  },
  receptors: [
    {
      name: "CB1 Receptors",
      location: "Brain & Central Nervous System",
      functions: ["Pain modulation", "Mood regulation", "Memory", "Appetite control"],
      icon: Brain,
    },
    {
      name: "CB2 Receptors",
      location: "Immune System & Peripheral Tissues",
      functions: ["Immune response", "Inflammation", "Bone health", "Gut function"],
      icon: Shield,
    },
  ],
  deficiency: {
    title: "Clinical Endocannabinoid Deficiency (CECD)",
    description: "Research suggests that many chronic conditions may be linked to an underactive or deficient endocannabinoid system.",
    conditions: [
      "Fibromyalgia",
      "Migraines",
      "IBS (Irritable Bowel Syndrome)",
      "Chronic fatigue",
      "Anxiety & Depression",
      "Autoimmune disorders",
    ],
  },
  support: {
    title: "Supporting Your ECS",
    methods: [
      {
        category: "Lifestyle",
        items: ["Regular exercise", "Quality sleep", "Stress management", "Cold exposure"],
      },
      {
        category: "Nutrition",
        items: ["Omega-3 fatty acids", "Dark chocolate", "Herbs (echinacea, black pepper)", "Fermented foods"],
      },
      {
        category: "Supplementation",
        items: ["Full-spectrum hemp extract", "CBD products", "CBG formulations", "Terpene blends"],
      },
    ],
  },
};

export default function ECSToolPage() {
  const [activeTab, setActiveTab] = useState("learn");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const resetAssessment = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
  };

  const calculateScore = () => {
    const values = Object.values(answers);
    if (values.length === 0) return 0;
    const total = values.reduce((sum, val) => sum + val, 0);
    return Math.round((total / (values.length * 5)) * 100);
  };

  const getScoreInterpretation = (score: number) => {
    if (score >= 80) return { level: "Optimal", color: "text-green-400", description: "Your ECS appears to be functioning well. Continue your healthy practices!" };
    if (score >= 60) return { level: "Good", color: "text-cyan-400", description: "Your ECS is functioning reasonably well with some room for improvement." };
    if (score >= 40) return { level: "Moderate", color: "text-yellow-400", description: "Your ECS may benefit from additional support. Consider lifestyle and nutritional interventions." };
    return { level: "Needs Support", color: "text-red-400", description: "Your ECS may be significantly underactive. We recommend consulting with a practitioner and exploring support options." };
  };

  const getCategoryScore = (category: string) => {
    const categoryQuestions = assessmentQuestions.filter((q) => q.category === category);
    const categoryAnswers = categoryQuestions.map((q) => answers[q.id] || 0).filter((v) => v > 0);
    if (categoryAnswers.length === 0) return 0;
    return Math.round((categoryAnswers.reduce((sum, val) => sum + val, 0) / (categoryAnswers.length * 5)) * 100);
  };

  const currentQ = assessmentQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;
  const overallScore = calculateScore();
  const interpretation = getScoreInterpretation(overallScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/resources">
              <Button variant="ghost" className="text-white/60 hover:text-white gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Resources
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">ECS Assessment Tool</h1>
                <p className="text-xs text-white/60">Endocannabinoid System Health</p>
              </div>
            </div>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Enhanced
            </Badge>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-white/10">
            <TabsTrigger value="learn" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Info className="w-4 h-4 mr-2" />
              Learn
            </TabsTrigger>
            <TabsTrigger value="assess" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Target className="w-4 h-4 mr-2" />
              Assess
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Heart className="w-4 h-4 mr-2" />
              Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learn" className="space-y-6">
            <Card className="bg-slate-800/30 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-green-400" />
                  {ecsInfo.overview.title}
                </CardTitle>
                <CardDescription className="text-white/70">
                  {ecsInfo.overview.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {ecsInfo.overview.points.map((point, i) => (
                    <li key={i} className="flex items-center gap-2 text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {ecsInfo.receptors.map((receptor, i) => (
                <Card key={i} className="bg-slate-800/30 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                      <receptor.icon className="w-5 h-5 text-cyan-400" />
                      {receptor.name}
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      {receptor.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {receptor.functions.map((func, j) => (
                        <Badge key={j} variant="outline" className="text-white/70 border-white/20">
                          {func}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  {ecsInfo.deficiency.title}
                </CardTitle>
                <CardDescription className="text-white/70">
                  {ecsInfo.deficiency.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ecsInfo.deficiency.conditions.map((condition, i) => (
                    <Badge key={i} className="bg-red-500/20 text-red-300 border-red-500/30">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assess" className="space-y-6">
            {!showResults ? (
              <Card className="bg-slate-800/30 border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">ECS Health Assessment</CardTitle>
                    <Badge variant="outline" className="text-white/60 border-white/20">
                      Question {currentQuestion + 1} of {assessmentQuestions.length}
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="py-4">
                    <h3 className="text-lg font-medium text-white mb-6">{currentQ.question}</h3>
                    <RadioGroup
                      value={answers[currentQ.id]?.toString() || ""}
                      onValueChange={(value) => handleAnswer(currentQ.id, parseInt(value))}
                    >
                      <div className="space-y-3">
                        {currentQ.options.map((option) => (
                          <div
                            key={option.value}
                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                              answers[currentQ.id] === option.value
                                ? "border-green-500/50 bg-green-500/10"
                                : "border-white/10 hover:border-white/20"
                            }`}
                            onClick={() => handleAnswer(currentQ.id, option.value)}
                          >
                            <RadioGroupItem value={option.value.toString()} id={`${currentQ.id}-${option.value}`} />
                            <Label htmlFor={`${currentQ.id}-${option.value}`} className="text-white/80 cursor-pointer flex-1">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentQuestion === 0}
                      className="border-white/20 text-white/60 hover:text-white"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!answers[currentQ.id]}
                      className="bg-gradient-to-r from-green-500 to-emerald-500"
                    >
                      {currentQuestion === assessmentQuestions.length - 1 ? "See Results" : "Next"}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="bg-slate-800/30 border-white/10">
                  <CardHeader className="text-center">
                    <CardTitle className="text-white text-2xl">Your ECS Health Score</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center w-40 h-40">
                        <svg className="w-40 h-40 transform -rotate-90">
                          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/10" />
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={440}
                            strokeDashoffset={440 - (440 * overallScore) / 100}
                            className={interpretation.color.replace("text-", "stroke-")}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute">
                          <span className={`text-4xl font-bold ${interpretation.color}`}>{overallScore}</span>
                          <span className="text-white/60 text-lg">%</span>
                        </div>
                      </div>
                      <p className={`text-xl font-semibold mt-4 ${interpretation.color}`}>{interpretation.level}</p>
                      <p className="text-white/60 mt-2 max-w-md mx-auto">{interpretation.description}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                      {["mood", "sleep", "pain", "digestion", "immunity", "stress"].map((category) => (
                        <div key={category} className="text-center p-3 rounded-lg bg-slate-700/30">
                          <p className="text-white/60 text-sm capitalize mb-1">{category}</p>
                          <p className="text-lg font-semibold text-white">{getCategoryScore(category)}%</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button onClick={resetAssessment} variant="outline" className="border-white/20 text-white">
                        Retake Assessment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <Card className="bg-slate-800/30 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  {ecsInfo.support.title}
                </CardTitle>
                <CardDescription className="text-white/70">
                  Natural ways to support and optimize your endocannabinoid system
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              {ecsInfo.support.methods.map((method, i) => (
                <Card key={i} className="bg-slate-800/30 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{method.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {method.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2 text-white/70">
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Explore Our ECS Support Products</h3>
                    <p className="text-white/70 mb-4">
                      Forgotten Formula offers a range of full-spectrum hemp products, CBD formulations, and cannabinoid support supplements designed to optimize your ECS function.
                    </p>
                    <Link href="/products">
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-500">
                        View Products
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
