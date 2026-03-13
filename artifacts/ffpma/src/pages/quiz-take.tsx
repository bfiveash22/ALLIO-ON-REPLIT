import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Clock, CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Quiz, QuizAttempt } from "@shared/schema";

interface QuestionWithAnswers {
  id: string;
  questionText: string;
  questionType: string | null;
  imageUrl: string | null;
  explanation: string | null;
  sortOrder: number | null;
  points: number | null;
  answers: {
    id: string;
    answerText: string;
    sortOrder: number | null;
  }[];
}

interface QuizResult {
  attempt: QuizAttempt;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
}

export default function QuizTakePage() {
  const [, params] = useRoute("/quizzes/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug;

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);

  const { data: quizData, isLoading: loadingQuiz } = useQuery<{ quiz: Quiz; questions: QuestionWithAnswers[] }>({
    queryKey: ["/api/quizzes", slug],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch quiz");
      return res.json();
    },
    enabled: !!slug,
  });

  const quiz = quizData?.quiz;
  const questions = quizData?.questions || [];
  const loadingQuestions = loadingQuiz;

  const startQuizMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/quizzes/${quiz?.id}/attempts`);
      return res.json();
    },
    onSuccess: (data) => {
      setAttemptId(data.id);
      setQuizStarted(true);
      if (quiz?.timeLimit) {
        setTimeRemaining(quiz.timeLimit * 60);
      }
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      const responses = Object.entries(answers).map(([questionId, selectedAnswerId]) => ({
        questionId,
        selectedAnswerId,
      }));
      const res = await apiRequest("POST", `/api/quizzes/attempts/${attemptId}/submit`, { responses });
      return res.json();
    },
    onSuccess: (data: QuizResult) => {
      setQuizResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/my-quiz-attempts"] });
    },
  });

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || quizResult) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          submitQuizMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, quizResult]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (answerId: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answerId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    submitQuizMutation.mutate();
  };

  const handleRetry = () => {
    setQuizResult(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setQuizStarted(false);
    setAttemptId(null);
  };

  if (loadingQuiz) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-3xl">
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  if (!quiz) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-3xl">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold mb-2">Quiz not found</h2>
              <p className="text-muted-foreground mb-4">This quiz doesn't exist or has been removed.</p>
              <Button onClick={() => navigate("/quizzes")}>Back to Quizzes</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Show results
  if (quizResult) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-3xl">
          <Card>
            <CardHeader className="text-center">
              {quizResult.passed ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-cyan-100 dark:bg-cyan-900/30 p-4">
                    <Trophy className="h-12 w-12 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <CardTitle className="text-2xl text-cyan-600 dark:text-cyan-400">
                    Congratulations! You Passed!
                  </CardTitle>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
                    <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                    Not Quite There
                  </CardTitle>
                </div>
              )}
              <CardDescription className="text-lg mt-2">
                {quiz.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-3xl font-bold">{quizResult.percentage}%</div>
                  <div className="text-sm text-muted-foreground">Your Score</div>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-3xl font-bold">{quizResult.score}/{quizResult.maxScore}</div>
                  <div className="text-sm text-muted-foreground">Points</div>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-3xl font-bold">{quizResult.passingScore}%</div>
                  <div className="text-sm text-muted-foreground">Passing Score</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-4 justify-center">
              <Button variant="outline" onClick={handleRetry} data-testid="button-retry">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => navigate("/quizzes")} data-testid="button-back-to-quizzes">
                Back to Quizzes
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  // Show start screen
  if (!quizStarted) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{quiz.title}</CardTitle>
              <CardDescription>{quiz.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{quiz.questionsCount || 0} Questions</div>
                    <div className="text-sm text-muted-foreground">Multiple choice</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Badge className="capitalize">{quiz.difficulty || "beginner"}</Badge>
                  <div className="text-sm">Difficulty Level</div>
                </div>
                {quiz.timeLimit && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{quiz.timeLimit} Minutes</div>
                      <div className="text-sm text-muted-foreground">Time limit</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Trophy className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{quiz.passingScore || 70}%</div>
                    <div className="text-sm text-muted-foreground">Passing score</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button variant="outline" onClick={() => navigate("/quizzes")} data-testid="button-cancel">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => startQuizMutation.mutate()}
                disabled={startQuizMutation.isPending}
                className="flex-1"
                data-testid="button-start"
              >
                {startQuizMutation.isPending ? "Starting..." : "Start Quiz"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  // Show questions
  if (loadingQuestions) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-3xl">
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-3xl">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold mb-2">No questions available</h2>
              <p className="text-muted-foreground mb-4">This quiz has no questions yet.</p>
              <Button onClick={() => navigate("/quizzes")}>Back to Quizzes</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Badge>
              {timeRemaining !== null && (
                <Badge variant={timeRemaining < 60 ? "destructive" : "secondary"}>
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(timeRemaining)}
                </Badge>
              )}
            </div>
            <Progress value={progress} className="mb-4" />
            <CardTitle className="text-xl">{currentQuestion.questionText}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={handleAnswerSelect}
              className="space-y-3"
            >
              {currentQuestion.answers.map((answer) => (
                <div
                  key={answer.id}
                  className="flex items-center space-x-3 p-4 rounded-md border hover-elevate cursor-pointer"
                  onClick={() => handleAnswerSelect(answer.id)}
                  data-testid={`answer-${answer.id}`}
                >
                  <RadioGroupItem value={answer.id} id={answer.id} />
                  <Label htmlFor={answer.id} className="flex-1 cursor-pointer">
                    {answer.answerText}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              data-testid="button-previous"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitQuizMutation.isPending || Object.keys(answers).length < questions.length}
                data-testid="button-submit"
              >
                {submitQuizMutation.isPending ? "Submitting..." : "Submit Quiz"}
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleNext} data-testid="button-next">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
