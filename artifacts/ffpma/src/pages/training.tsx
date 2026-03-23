import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  GraduationCap,
  FileText,
  Play,
  Clock,
  Target,
  Search,
  ChevronRight,
  Award,
  Layers,
  ExternalLink,
  Trophy,
  Star,
  Flame,
  Bookmark,
  MessageCircle,
  Zap,
  Heart,
  Rocket,
  Microscope,
} from "lucide-react";
import type { TrainingModule, TrainingTrack, Quiz, DriveDocument, Achievement } from "@shared/schema";

interface UserAchievement {
  id: string;
  achievementId: string;
  earnedAt: string;
  achievement?: Achievement;
}

function getAchievementIcon(icon: string) {
  const iconMap: Record<string, React.ReactNode> = {
    "footprints": <Target className="h-6 w-6" />,
    "book-open": <BookOpen className="h-6 w-6" />,
    "graduation-cap": <GraduationCap className="h-6 w-6" />,
    "award": <Award className="h-6 w-6" />,
    "star": <Star className="h-6 w-6" />,
    "zap": <Zap className="h-6 w-6" />,
    "flame": <Flame className="h-6 w-6" />,
    "message-circle": <MessageCircle className="h-6 w-6" />,
    "heart": <Heart className="h-6 w-6" />,
    "microscope": <Microscope className="h-6 w-6" />,
    "badge": <Award className="h-6 w-6" />,
    "rocket": <Rocket className="h-6 w-6" />,
    "trophy": <Trophy className="h-6 w-6" />,
  };
  return iconMap[icon] || <Trophy className="h-6 w-6" />;
}

function getAchievementColor(color: string) {
  const colorMap: Record<string, string> = {
    "bronze": "bg-amber-700/20 text-amber-600 border-amber-600/30",
    "silver": "bg-gray-400/20 text-gray-400 border-gray-400/30",
    "gold": "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    "orange": "bg-orange-500/20 text-orange-500 border-orange-500/30",
    "cyan": "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
    "pink": "bg-pink-500/20 text-pink-500 border-pink-500/30",
    "red": "bg-red-500/20 text-red-500 border-red-500/30",
    "purple": "bg-purple-500/20 text-purple-500 border-purple-500/30",
  };
  return colorMap[color] || colorMap["gold"];
}

function getDifficultyColor(difficulty: string | null) {
  switch (difficulty) {
    case "beginner": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400";
    case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default: return "bg-muted text-muted-foreground";
  }
}

function getContentTypeIcon(contentType: string | null) {
  switch (contentType) {
    case "video": return <Play className="h-4 w-4" />;
    case "document": return <FileText className="h-4 w-4" />;
    case "pdf": return <FileText className="h-4 w-4" />;
    default: return <BookOpen className="h-4 w-4" />;
  }
}

export default function TrainingPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "overview";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [location] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location]);

  const { data: modules = [], isLoading: modulesLoading } = useQuery<TrainingModule[]>({
    queryKey: ["/api/training/modules"],
  });

  const { data: tracks = [], isLoading: tracksLoading } = useQuery<TrainingTrack[]>({
    queryKey: ["/api/training/tracks"],
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery<DriveDocument[]>({
    queryKey: ["/api/documents"],
  });

  const { data: allAchievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: userAchievements = [] } = useQuery<UserAchievement[]>({
    queryKey: ["/api/my/achievements"],
  });

  const earnedIds = new Set(userAchievements.map(ua => ua.achievementId));
  const totalPoints = userAchievements.reduce((sum, ua) => sum + (ua.achievement?.points || 0), 0);
  const progressPercent = allAchievements.length > 0 ? (userAchievements.length / allAchievements.length) * 100 : 0;

  const filteredModules = modules.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocuments = documents.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = modulesLoading || tracksLoading || quizzesLoading || documentsLoading;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Training Hub</h1>
          <p className="text-muted-foreground mt-1">
            Access courses, quizzes, documents, and learning resources
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search training content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-training"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto lg:inline-flex">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Layers className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="progress" data-testid="tab-progress">
            <Trophy className="h-4 w-4 mr-2" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="modules" data-testid="tab-modules">
            <BookOpen className="h-4 w-4 mr-2" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="my-courses" data-testid="tab-my-courses">
            <Bookmark className="h-4 w-4 mr-2" />
            My Courses
          </TabsTrigger>
          <TabsTrigger value="quizzes" data-testid="tab-quizzes">
            <GraduationCap className="h-4 w-4 mr-2" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="quiz-history" data-testid="tab-quiz-history">
            <Target className="h-4 w-4 mr-2" />
            Quiz History
          </TabsTrigger>
          <TabsTrigger value="wishlist" data-testid="tab-wishlist">
            <Heart className="h-4 w-4 mr-2" />
            Wishlist
          </TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-reviews">
            <MessageCircle className="h-4 w-4 mr-2" />
            Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {tracks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Learning Tracks</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tracks.map((track) => (
                  <Card key={track.id} className="hover-elevate" data-testid={`card-track-${track.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{track.title}</CardTitle>
                        <Badge className={getDifficultyColor(track.difficulty)} >
                          {track.difficulty}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {track.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {track.totalModules} modules
                        </span>
                        {track.estimatedDuration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {track.estimatedDuration}
                          </span>
                        )}
                      </div>
                      <Button className="w-full" onClick={() => setActiveTab("modules")} data-testid={`button-start-track-${track.id}`}>
                        Start Learning
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Training Modules</h2>
              </div>
              <Button variant="ghost" onClick={() => setActiveTab("modules")}>
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-full mt-2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {modules.slice(0, 6).map((module) => (
                  <Card key={module.id} className="hover-elevate" data-testid={`card-module-${module.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        <Badge className={getDifficultyColor(module.difficulty)} >
                          {module.difficulty}
                        </Badge>
                      </div>
                      {module.category && (
                        <Badge variant="outline" className="w-fit">
                          {module.category}
                        </Badge>
                      )}
                      <CardDescription className="line-clamp-2">
                        {module.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        {module.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {module.duration}
                          </span>
                        )}
                      </div>
                      <Button variant="outline" className="w-full" asChild data-testid={`button-view-module-${module.id}`}>
                        <Link href={`/training/${module.slug}`}>
                          View Module
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {modules.length === 0 && !isLoading && (
              <Card className="p-12 text-center relative overflow-hidden border-white/10 bg-black/20">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 pointer-events-none" />
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-8 w-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white relative z-10">No modules yet</h3>
                <p className="text-white/60 relative z-10">Training modules will be available here soon.</p>
              </Card>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Quizzes & Assessments</h2>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/quizzes">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.slice(0, 3).map((quiz) => (
                <Card key={quiz.id} className="hover-elevate" data-testid={`card-quiz-${quiz.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <Badge className={getDifficultyColor(quiz.difficulty)} >
                        {quiz.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {quiz.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {quiz.questionsCount} questions
                      </span>
                      {quiz.timeLimit && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {quiz.timeLimit} min
                        </span>
                      )}
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/quizzes/${quiz.slug}`} data-testid={`button-take-quiz-${quiz.id}`}>
                        Take Quiz
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {quizzes.length === 0 && !isLoading && (
              <Card className="p-12 text-center relative overflow-hidden border-white/10 bg-black/20">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="h-8 w-8 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white relative z-10">No quizzes yet</h3>
                <p className="text-white/60 relative z-10">Quizzes and assessments will be available here soon.</p>
              </Card>
            )}
          </section>
        </TabsContent>

        <TabsContent value="progress" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Achievement Progress</span>
                    <span className="font-medium">{userAchievements.length}/{allAchievements.length}</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Total Points</span>
                  <Badge variant="secondary" className="text-lg px-3">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    {totalPoints}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Modules Completed</span>
                  <Badge variant="outline">{modules.filter(m => (m as any).progress === 100).length}/{modules.length}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-cyan-500" />
                  Achievement Badges
                </CardTitle>
                <CardDescription>Earn badges by completing training activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {allAchievements.map((achievement) => {
                    const isEarned = earnedIds.has(achievement.id);
                    return (
                      <div
                        key={achievement.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${isEarned
                            ? getAchievementColor(achievement.color || 'gold')
                            : 'bg-muted/30 text-muted-foreground opacity-60'
                          }`}
                        data-testid={`badge-${achievement.id}`}
                      >
                        <div className={`p-2 rounded-full ${isEarned ? 'bg-background/50' : 'bg-muted'}`}>
                          {getAchievementIcon(achievement.icon || 'trophy')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{achievement.name}</div>
                          <div className="text-xs opacity-80 truncate">{achievement.description}</div>
                          <div className="text-xs mt-1">{achievement.points} pts</div>
                        </div>
                        {isEarned && <Star className="h-4 w-4 text-yellow-500 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Your Learning Journey
              </CardTitle>
              <CardDescription>Track your progress through training modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {modules.slice(0, 10).map((module) => (
                  <div key={module.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex-shrink-0">
                      {(module as any).progress === 100 ? (
                        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Award className="h-5 w-5 text-green-500" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{module.title}</div>
                      <div className="text-sm text-muted-foreground">{module.category}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <Progress value={(module as any).progress || 0} className="h-2" />
                      </div>
                      <span className="text-sm text-muted-foreground w-10">{(module as any).progress || 0}%</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/training/${module.slug}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredModules.map((module) => (
              <Card key={module.id} className="hover-elevate" data-testid={`card-module-${module.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <Badge className={getDifficultyColor(module.difficulty)} >
                      {module.difficulty}
                    </Badge>
                  </div>
                  {module.category && (
                    <Badge variant="outline" className="w-fit">
                      {module.category}
                    </Badge>
                  )}
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {module.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {module.duration}
                      </span>
                    )}
                  </div>
                  <Button className="w-full" asChild data-testid={`button-start-module-${module.id}`}>
                    <Link href={`/training/${module.slug}`}>
                      Start Module
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredModules.length === 0 && (
            <Card className="p-12 text-center relative overflow-hidden border-white/10 bg-black/20">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 pointer-events-none" />
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white relative z-10">
                {searchQuery ? "No matches found" : "No modules yet"}
              </h3>
              <p className="text-white/60 relative z-10">
                {searchQuery ? "Try a different search term to find what you're looking for." : "Training modules will be available here soon."}
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover-elevate" data-testid={`card-quiz-${quiz.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <Badge className={getDifficultyColor(quiz.difficulty)} >
                      {quiz.difficulty}
                    </Badge>
                  </div>
                  <CardDescription>{quiz.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {quiz.questionsCount} questions
                    </span>
                    {quiz.timeLimit && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {quiz.timeLimit} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      Pass: {quiz.passingScore}%
                    </span>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href={`/quizzes/${quiz.slug}`} data-testid={`button-take-quiz-${quiz.id}`}>
                      Take Quiz
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredQuizzes.length === 0 && (
            <Card className="p-12 text-center relative overflow-hidden border-white/10 bg-black/20">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white relative z-10">
                {searchQuery ? "No matches found" : "No quizzes yet"}
              </h3>
              <p className="text-white/60 relative z-10">
                {searchQuery ? "Try a different search term to find what you're looking for." : "Quizzes will be available here soon."}
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {filteredDocuments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="hover-elevate" data-testid={`card-document-${doc.id}`}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-muted">
                        {getContentTypeIcon(doc.contentType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{doc.title}</CardTitle>
                        {doc.folderPath && (
                          <p className="text-xs text-muted-foreground truncate">{doc.folderPath}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{doc.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      {doc.contentType && <Badge variant="outline" >{doc.contentType}</Badge>}
                      {doc.viewCount !== null && doc.viewCount > 0 && (
                        <span>{doc.viewCount} views</span>
                      )}
                    </div>
                    {doc.webViewLink && (
                      <Button variant="outline" className="w-full" asChild>
                        <a href={doc.webViewLink} target="_blank" rel="noopener noreferrer" data-testid={`button-view-doc-${doc.id}`}>
                          View Document
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center relative overflow-hidden border-white/10 bg-black/20">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 pointer-events-none" />
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white relative z-10">
                {searchQuery ? "No matches found" : "No documents yet"}
              </h3>
              <p className="text-white/60 relative z-10">
                {searchQuery ? "Try a different search term." : "Training documents from Google Drive will appear here after sync."}
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-courses" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Bookmark className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">My Enrolled Courses</h2>
          </div>
          {modules.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modules.slice(0, 4).map((module) => (
                <Card key={module.id} className="hover-elevate" data-testid={`card-my-course-${module.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <Badge className={getDifficultyColor(module.difficulty)}>
                        {module.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={0} className="mb-3" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>In Progress</span>
                      {module.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {module.duration}
                        </span>
                      )}
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/training/${module.slug}`}>
                        Continue Learning
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center relative overflow-hidden border-white/10 bg-black/20">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 pointer-events-none" />
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6">
                <Bookmark className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white relative z-10">No enrolled courses yet</h3>
              <p className="text-white/60 relative z-10 mb-4">Start a training module to see your enrolled courses here.</p>
              <Button onClick={() => setActiveTab("modules")} className="relative z-10">
                Browse Modules
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quiz-history" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Quiz History</h2>
          </div>
          <Card className="p-12 text-center relative overflow-hidden border-white/10 bg-black/20">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none" />
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6">
              <Target className="h-8 w-8 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white relative z-10">No quiz attempts yet</h3>
            <p className="text-white/60 relative z-10 mb-4">Complete quizzes to track your scores and progress here.</p>
            <Button onClick={() => setActiveTab("quizzes")} className="relative z-10">
              Take a Quiz
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-pink-500" />
            <h2 className="text-xl font-semibold">My Wishlist</h2>
          </div>
          <Card className="p-12 text-center relative overflow-hidden border-white/10 bg-black/20">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5 pointer-events-none" />
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-8 w-8 text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white relative z-10">Wishlist is empty</h3>
            <p className="text-white/60 relative z-10 mb-4">Save courses you'd like to take later by adding them to your wishlist.</p>
            <Button onClick={() => setActiveTab("modules")} className="relative z-10">
              Browse Modules
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Course Reviews</h2>
          </div>
          <Card className="p-12 text-center relative overflow-hidden border-white/10 bg-black/20">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 pointer-events-none" />
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white relative z-10">No reviews yet</h3>
            <p className="text-white/60 relative z-10 mb-4">After completing a course, share your experience and help other members.</p>
            <Button onClick={() => setActiveTab("modules")} className="relative z-10">
              Start Learning
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
