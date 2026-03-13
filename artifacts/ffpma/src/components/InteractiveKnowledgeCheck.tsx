import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Lock, 
  Unlock,
  RefreshCw,
  Brain,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface KnowledgeCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
}

interface InteractiveKnowledgeCheckProps {
  sectionTitle: string;
  sectionNumber: number;
  question: KnowledgeCheckQuestion;
  onPass: () => void;
  isLocked?: boolean;
}

export function InteractiveKnowledgeCheck({
  sectionTitle,
  sectionNumber,
  question,
  onPass,
  isLocked = false,
}: InteractiveKnowledgeCheckProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    setHasSubmitted(true);
    setAttempts(prev => prev + 1);
    const correct = selectedAnswer === question.correctIndex;
    setIsCorrect(correct);
    
    if (correct) {
      setTimeout(() => {
        onPass();
      }, 1500);
    }
  };

  const handleRetry = () => {
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setIsCorrect(false);
    if (attempts >= 2) {
      setShowHint(true);
    }
  };

  if (isLocked) {
    return (
      <Card className="border-amber-500/50 bg-amber-50/10">
        <CardContent className="py-8 text-center">
          <Lock className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <p className="text-muted-foreground">
            Complete the previous section to unlock this knowledge check
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-cyan-500/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Badge variant="outline" className="mb-1">
                  Knowledge Check - Section {sectionNumber}
                </Badge>
                <CardTitle className="text-lg">{sectionTitle}</CardTitle>
              </div>
            </div>
            {attempts > 0 && (
              <Badge variant={isCorrect ? "default" : "secondary"}>
                Attempt {attempts}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-base font-medium" data-testid="knowledge-check-question">
            {question.question}
          </p>

          <RadioGroup
            value={selectedAnswer?.toString()}
            onValueChange={(val) => !hasSubmitted && setSelectedAnswer(parseInt(val))}
            className="space-y-3"
            disabled={hasSubmitted && isCorrect}
          >
            {question.options.map((option, index) => {
              let optionClass = "border-muted-foreground/20 hover:border-primary/50";
              let icon = null;
              
              if (hasSubmitted) {
                if (index === question.correctIndex) {
                  optionClass = "border-green-500 bg-green-50/50 dark:bg-green-950/20";
                  icon = <CheckCircle2 className="h-5 w-5 text-green-500" />;
                } else if (index === selectedAnswer && !isCorrect) {
                  optionClass = "border-red-500 bg-red-50/50 dark:bg-red-950/20";
                  icon = <XCircle className="h-5 w-5 text-red-500" />;
                }
              }

              return (
                <div
                  key={index}
                  className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${optionClass}`}
                  data-testid={`knowledge-check-option-${index}`}
                >
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                    disabled={hasSubmitted && isCorrect}
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {option}
                  </Label>
                  {icon}
                </div>
              );
            })}
          </RadioGroup>

          <AnimatePresence>
            {showHint && question.hint && !hasSubmitted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">Hint</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {question.hint}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {hasSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg p-4 ${
                  isCorrect
                    ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <HelpCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium text-sm ${
                      isCorrect 
                        ? "text-green-800 dark:text-green-200" 
                        : "text-red-800 dark:text-red-200"
                    }`}>
                      {isCorrect ? "Correct!" : "Not quite right"}
                    </p>
                    <p className={`text-sm mt-1 ${
                      isCorrect
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }`}>
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-3">
            {!hasSubmitted && attempts > 1 && question.hint && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(true)}
                disabled={showHint}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Show Hint
              </Button>
            )}

            {hasSubmitted && !isCorrect ? (
              <Button onClick={handleRetry} data-testid="button-retry-knowledge-check">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            ) : !hasSubmitted ? (
              <Button
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                data-testid="button-submit-knowledge-check"
              >
                Check Answer
              </Button>
            ) : (
              <Button disabled className="bg-green-500 hover:bg-green-500">
                <Unlock className="h-4 w-4 mr-2" />
                Section Unlocked!
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ProgressGate({
  isUnlocked,
  sectionNumber,
  totalSections,
}: {
  isUnlocked: boolean;
  sectionNumber: number;
  totalSections: number;
}) {
  if (isUnlocked) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">
            Section {sectionNumber} of {totalSections} completed
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <Card className="border-amber-500/50 bg-amber-50/10 max-w-md w-full">
        <CardContent className="py-6 text-center">
          <Lock className="h-8 w-8 mx-auto text-amber-500 mb-3" />
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Complete the Knowledge Check to Continue
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Answer the question above correctly to unlock the next section
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
