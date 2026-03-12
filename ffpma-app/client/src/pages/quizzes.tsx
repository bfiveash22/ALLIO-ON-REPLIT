import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { GraduationCap, Clock, Target, ChevronRight, Search } from "lucide-react";
import { DataSourceBadge } from "@/components/data-source-badge";
import type { Quiz } from "@shared/schema";

const difficultyColors: Record<string, string> = {
  beginner: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function QuizzesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === "all" || quiz.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [quizzes, searchQuery, difficultyFilter]);

  if (isLoading) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-6xl">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Training & Quizzes
            </h1>
            <p className="text-muted-foreground">
              Test your knowledge on products, protocols, and procedures
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-difficulty">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredQuizzes.length === 0 ? (
            <Card className="relative overflow-hidden border-white/10 bg-black/20">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 pointer-events-none" />
              <CardContent className="flex flex-col items-center justify-center py-16 text-center relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-6">
                  <GraduationCap className="h-8 w-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">No quizzes available</h3>
                <p className="text-white/60 max-w-sm mx-auto">
                  {quizzes.length === 0
                    ? "Interactive training quizzes will be appearing here soon to test your knowledge."
                    : "No quizzes match your current search criteria. Try a different term or level."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredQuizzes.map((quiz) => (
                <Card key={quiz.id} className="flex flex-col" data-testid={`card-quiz-${quiz.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={difficultyColors[quiz.difficulty || "beginner"]}>
                          {quiz.difficulty || "beginner"}
                        </Badge>
                        <DataSourceBadge source="postgresql" id={`quiz-${quiz.id}`} />
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {quiz.description || "Test your knowledge"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>{quiz.passingScore || 70}% to pass</span>
                      </div>
                      {quiz.timeLimit && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{quiz.timeLimit} min</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        <span>{quiz.questionsCount || 0} questions</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/quizzes/${quiz.slug}`} className="w-full">
                      <Button className="w-full" data-testid={`button-start-quiz-${quiz.id}`}>
                        Start Quiz
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
