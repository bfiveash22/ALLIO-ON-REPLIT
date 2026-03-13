import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCcw,
  Brain,
  Sparkles,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface InteractiveQuizProps {
  title: string;
  questions: QuizQuestion[];
  onComplete?: (score: number, total: number) => void;
  moduleSlug?: string;
}

export function InteractiveQuiz({ title, questions, onComplete, moduleSlug }: InteractiveQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100;

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    if (isCorrect) {
      setScore(s => s + 1);
    }
    setAnswers([...answers, isCorrect]);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCompleted(true);
      onComplete?.(score + (selectedAnswer === currentQuestion.correctIndex ? 1 : 0), questions.length);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setCompleted(false);
    setAnswers([]);
  };

  if (completed) {
    const finalScore = score;
    const percentage = Math.round((finalScore / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Quiz Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
                passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
              } mb-4`}
            >
              <span className={`text-4xl font-bold ${passed ? 'text-green-600' : 'text-amber-600'}`}>
                {percentage}%
              </span>
            </motion.div>
            <p className="text-lg font-medium">
              You scored {finalScore} out of {questions.length}
            </p>
            <p className="text-muted-foreground mt-2">
              {passed 
                ? "Great job! You've demonstrated solid understanding of the material."
                : "Keep learning! Review the material and try again when ready."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {answers.map((correct, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  correct 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={handleRestart} variant="outline" data-testid="button-restart-quiz">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <Badge variant="outline">
            Question {currentIndex + 1} of {questions.length}
          </Badge>
        </div>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <p className="text-lg font-medium" data-testid="text-quiz-question">
              {currentQuestion.question}
            </p>

            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQuestion.correctIndex;
                const showCorrectness = showResult;

                let bgClass = 'bg-card hover:bg-muted/50';
                let borderClass = 'border-border';
                
                if (showCorrectness) {
                  if (isCorrect) {
                    bgClass = 'bg-green-50 dark:bg-green-900/20';
                    borderClass = 'border-green-500';
                  } else if (isSelected && !isCorrect) {
                    bgClass = 'bg-red-50 dark:bg-red-900/20';
                    borderClass = 'border-red-500';
                  }
                } else if (isSelected) {
                  bgClass = 'bg-primary/10';
                  borderClass = 'border-primary';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    disabled={showResult}
                    data-testid={`button-quiz-option-${index}`}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${bgClass} ${borderClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {showCorrectness && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {showCorrectness && isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-muted rounded-lg"
              >
                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Explanation
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentQuestion.explanation}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-end gap-2 pt-4">
          {!showResult ? (
            <Button 
              onClick={handleSubmit} 
              disabled={selectedAnswer === null}
              data-testid="button-submit-answer"
            >
              Check Answer
            </Button>
          ) : (
            <Button onClick={handleNext} data-testid="button-next-question">
              {currentIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  See Results
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AITutorProps {
  moduleSlug: string;
  moduleTitle: string;
}

export function AITutor({ moduleSlug, moduleTitle }: AITutorProps) {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant'; content: string}>>([]);

  const askMutation = useMutation({
    mutationFn: async (q: string) => {
      const response = await fetch("/api/training/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, moduleSlug, moduleTitle }),
      });
      if (!response.ok) throw new Error("Failed to get response");
      return response.json();
    },
    onSuccess: (data) => {
      setConversation(prev => [...prev, { role: 'assistant', content: data.answer }]);
    }
  });

  const handleAsk = () => {
    if (!question.trim()) return;
    setConversation(prev => [...prev, { role: 'user', content: question }]);
    askMutation.mutate(question);
    setQuestion("");
  };

  return (
    <Card className="border-cyan-200 dark:border-cyan-900 bg-gradient-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-cyan-500" />
          Ask ALLIO
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Have questions about this module? ALLIO is here to help you understand.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {conversation.length > 0 && (
          <div className="space-y-4 max-h-64 overflow-y-auto p-2">
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary/10 ml-8'
                    : 'bg-muted mr-8'
                }`}
              >
                <p className="text-xs font-medium mb-1 text-muted-foreground">
                  {msg.role === 'user' ? 'You' : 'ALLIO'}
                </p>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Textarea
            placeholder="Ask a question about this module..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            data-testid="input-ai-tutor-question"
          />
          <Button 
            onClick={handleAsk} 
            disabled={!question.trim() || askMutation.isPending}
            className="w-full"
            data-testid="button-ask-allio"
          >
            {askMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Ask ALLIO
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export const ECS_QUIZ: QuizQuestion[] = [
  {
    id: "ecs-1",
    question: "When was the Endocannabinoid System first discovered?",
    options: [
      "1960s",
      "1970s",
      "1980s-1990s",
      "2000s"
    ],
    correctIndex: 2,
    explanation: "The ECS was discovered in the late 1980s-1990s. CB1 receptors were identified in 1988, and anandamide (the first endocannabinoid) was discovered in 1992 by Dr. Raphael Mechoulam's team."
  },
  {
    id: "ecs-2",
    question: "What is the primary function of CB1 receptors?",
    options: [
      "Immune system regulation",
      "Brain and central nervous system regulation",
      "Bone density maintenance",
      "Skin health"
    ],
    correctIndex: 1,
    explanation: "CB1 receptors are the most abundant G protein-coupled receptors in the brain, controlling pain, mood, memory, appetite, and motor function."
  },
  {
    id: "ecs-3",
    question: "What does 'anandamide' mean in Sanskrit?",
    options: [
      "Peace",
      "Healing",
      "Bliss",
      "Balance"
    ],
    correctIndex: 2,
    explanation: "Anandamide comes from the Sanskrit word 'ananda' meaning bliss. It's called the 'bliss molecule' and is associated with runner's high and mood regulation."
  },
  {
    id: "ecs-4",
    question: "What is CECD (Clinical Endocannabinoid Deficiency)?",
    options: [
      "A type of cannabis",
      "An overactive ECS condition",
      "An underactive or imbalanced ECS",
      "A genetic mutation"
    ],
    correctIndex: 2,
    explanation: "CECD refers to when the ECS is underactive or imbalanced. Research links it to conditions like migraines, fibromyalgia, and IBS."
  },
  {
    id: "ecs-5",
    question: "Which fatty acids are essential for proper ECS function?",
    options: [
      "Omega-3 fatty acids",
      "Trans fats",
      "Saturated fats",
      "Omega-6 only"
    ],
    correctIndex: 0,
    explanation: "Omega-3 fatty acids are crucial for ECS function because endocannabinoids are made on-demand from fatty acids in cell membranes."
  }
];
