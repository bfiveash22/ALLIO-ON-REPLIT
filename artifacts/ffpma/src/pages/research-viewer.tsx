import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  BookOpen,
  Atom,
  Brain,
  FlaskConical,
} from "lucide-react";
import { allResearchDocuments } from "./advanced-research-data";

const divisionIcons: Record<string, typeof Atom> = {
  "QUANTUM (Science Division)": Atom,
  "ENTHEOS (Consciousness Division)": Brain,
};

export default function ResearchViewerPage() {
  const { slug } = useParams<{ slug: string }>();
  const doc = allResearchDocuments.find((d) => d.slug === slug);

  if (!doc) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Document not found</h3>
            <p className="text-muted-foreground mb-4">
              The research document you're looking for doesn't exist.
            </p>
            <Button variant="outline" asChild>
              <Link href="/resources">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Resources
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const DivisionIcon = divisionIcons[doc.division] || FlaskConical;

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/resources">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resources
            </Link>
          </Button>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 shrink-0">
              <DivisionIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">
                {doc.title}
              </h1>
              <p className="text-muted-foreground text-sm mb-3">
                {doc.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {doc.division}
                </Badge>
                {doc.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        <div className="space-y-6">
          {doc.sections.map((section, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {section.content.split("\n\n").map((paragraph, pIdx) => (
                    <p key={pIdx} className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 mb-4">
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground italic">
                This document is provided for educational purposes within the Forgotten Formula PMA member knowledge base. It represents current research and theoretical frameworks. Members should work with qualified practitioners when implementing any protocols. Always consult with medical and legal professionals regarding therapeutic applications.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
