import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Lock, 
  BookOpen,
  Brain,
  Award,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InteractiveKnowledgeCheck, ProgressGate, type KnowledgeCheckQuestion } from "./InteractiveKnowledgeCheck";
import { DrMillerNarration } from "./DrMillerNarration";

interface Section {
  title: string;
  content: string;
}

interface EnhancedInteractiveModuleProps {
  moduleId: string;
  moduleTitle: string;
  sections: Section[];
  keyPoints?: string[];
  knowledgeChecks: KnowledgeCheckQuestion[];
  instructorName?: string;
  instructorTitle?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export function EnhancedInteractiveModule({
  moduleId,
  moduleTitle,
  sections,
  keyPoints,
  knowledgeChecks,
  instructorName = "Dr. Miller",
  instructorTitle = "Medical Director",
  onProgress,
  onComplete,
}: EnhancedInteractiveModuleProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [unlockedSections, setUnlockedSections] = useState<Set<number>>(new Set([0]));
  const [completedChecks, setCompletedChecks] = useState<Set<string>>(new Set());
  const [showCertificate, setShowCertificate] = useState(false);

  const totalSections = sections.length;
  const checkFrequency = Math.max(1, Math.floor(totalSections / knowledgeChecks.length));
  
  const getSectionCheckIndex = (sectionIndex: number): number | null => {
    if (knowledgeChecks.length === 0) return null;
    
    const checkIndex = Math.floor(sectionIndex / checkFrequency);
    if (checkIndex < knowledgeChecks.length && (sectionIndex + 1) % checkFrequency === 0) {
      return checkIndex;
    }
    return null;
  };

  const hasCheckAfterSection = (sectionIndex: number): boolean => {
    return getSectionCheckIndex(sectionIndex) !== null;
  };

  const isCheckPassed = (checkIndex: number): boolean => {
    if (checkIndex >= knowledgeChecks.length) return true;
    return completedChecks.has(knowledgeChecks[checkIndex].id);
  };

  const canAccessSection = (sectionIndex: number): boolean => {
    if (sectionIndex === 0) return true;
    
    for (let i = 0; i < sectionIndex; i++) {
      const checkIndex = getSectionCheckIndex(i);
      if (checkIndex !== null && !isCheckPassed(checkIndex)) {
        return false;
      }
    }
    return true;
  };

  const handleCheckPass = (checkId: string) => {
    setCompletedChecks(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.add(checkId);
      return newSet;
    });
    
    const nextSection = currentSection + 1;
    if (nextSection < totalSections) {
      setUnlockedSections(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.add(nextSection);
        return newSet;
      });
    }
  };

  const handleNextSection = () => {
    const checkIndex = getSectionCheckIndex(currentSection);
    
    if (checkIndex !== null && !isCheckPassed(checkIndex)) {
      return;
    }

    if (currentSection < totalSections - 1) {
      const nextSection = currentSection + 1;
      setCurrentSection(nextSection);
      setUnlockedSections(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.add(nextSection);
        return newSet;
      });
    } else {
      setShowCertificate(true);
      onComplete?.();
    }
  };

  const handlePrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  useEffect(() => {
    const progress = ((currentSection + 1) / totalSections) * 100;
    onProgress?.(progress);
  }, [currentSection, totalSections, onProgress]);

  const currentCheck = getSectionCheckIndex(currentSection);
  const isCurrentCheckPassed = currentCheck !== null ? isCheckPassed(currentCheck) : true;
  const isLastSection = currentSection === totalSections - 1;
  const allChecksComplete = knowledgeChecks.every(check => completedChecks.has(check.id));

  if (showCertificate && allChecksComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <Card className="max-w-lg mx-auto border-2 border-primary bg-gradient-to-br from-primary/10 to-cyan-500/10">
          <CardContent className="pt-8 pb-8">
            <div className="w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center mb-6">
              <Award className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Module Complete!</h2>
            <p className="text-muted-foreground mb-4">
              You've successfully completed all sections and knowledge checks for
            </p>
            <p className="text-lg font-semibold text-primary mb-6">{moduleTitle}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{totalSections} sections completed</span>
              <span className="mx-2">•</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{knowledgeChecks.length} knowledge checks passed</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-card-border">
        <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-cyan-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">{moduleTitle}</CardTitle>
                <CardDescription>
                  Section {currentSection + 1} of {totalSections}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {knowledgeChecks.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Brain className="h-3 w-3" />
                  {completedChecks.size}/{knowledgeChecks.length} checks
                </Badge>
              )}
            </div>
          </div>
          <Progress 
            value={((currentSection + 1) / totalSections) * 100} 
            className="mt-4 h-2"
          />
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sections.map((_, index) => {
              const canAccess = canAccessSection(index);
              const isActive = index === currentSection;
              const isComplete = index < currentSection;
              
              return (
                <Button
                  key={index}
                  variant={isActive ? "default" : isComplete ? "secondary" : "outline"}
                  size="sm"
                  className={`flex-shrink-0 ${!canAccess ? "opacity-50" : ""}`}
                  onClick={() => canAccess && setCurrentSection(index)}
                  disabled={!canAccess}
                  data-testid={`section-nav-${index}`}
                >
                  {!canAccess ? (
                    <Lock className="h-3 w-3 mr-1" />
                  ) : isComplete ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  ) : null}
                  {index + 1}
                </Button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {currentSection + 1}
                </span>
                {sections[currentSection].title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed text-base pl-11">
                {sections[currentSection].content}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="pl-11">
            <DrMillerNarration
              sectionTitle={sections[currentSection].title}
              sectionContent={sections[currentSection].content}
              instructorName={instructorName}
              instructorTitle={instructorTitle}
            />
          </div>

          {keyPoints && keyPoints.length > 0 && isLastSection && isCurrentCheckPassed && (
            <div className="bg-muted/50 rounded-lg p-4 mt-6">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Key Takeaways
              </h4>
              <ul className="space-y-1 text-sm">
                {keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevSection}
              disabled={currentSection === 0}
              data-testid="button-prev-section"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentCheck !== null && !isCurrentCheckPassed ? (
              <Badge variant="outline" className="py-2 px-4">
                <Lock className="h-4 w-4 mr-2" />
                Complete knowledge check to continue
              </Badge>
            ) : (
              <Button
                onClick={handleNextSection}
                data-testid="button-next-section"
              >
                {isLastSection ? (
                  <>
                    Complete Module
                    <Award className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next Section
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {currentCheck !== null && !isCurrentCheckPassed && (
        <InteractiveKnowledgeCheck
          sectionTitle={sections[currentSection].title}
          sectionNumber={currentSection + 1}
          question={knowledgeChecks[currentCheck]}
          onPass={() => handleCheckPass(knowledgeChecks[currentCheck].id)}
        />
      )}

      {currentCheck !== null && (
        <ProgressGate
          isUnlocked={isCurrentCheckPassed}
          sectionNumber={currentSection + 1}
          totalSections={totalSections}
        />
      )}
    </div>
  );
}
