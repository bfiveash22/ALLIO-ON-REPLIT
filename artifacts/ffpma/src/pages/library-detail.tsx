import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import DOMPurify from "dompurify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FileText,
  BookOpen,
  Video,
  GraduationCap,
  File,
  Calendar,
  User,
  Eye,
  Tag,
} from "lucide-react";
import type { LibraryItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const contentTypeIcons: Record<string, typeof FileText> = {
  document: File,
  protocol: BookOpen,
  training: GraduationCap,
  video: Video,
  article: FileText,
};

const contentTypeLabels: Record<string, string> = {
  document: "Document",
  protocol: "Protocol",
  training: "Training",
  video: "Video",
  article: "Article",
};

function formatDate(date: Date | string | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function LibraryDetailPage() {
  const [, params] = useRoute("/library/:slug");
  const slug = params?.slug;

  const { data: item, isLoading, error } = useQuery<LibraryItem>({
    queryKey: ["/api/library", slug],
    queryFn: async () => {
      const res = await fetch(`/api/library/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch library item");
      return res.json();
    },
    enabled: !!slug,
  });
  
  const sanitizedContent = useMemo(() => {
    if (!item?.content) return "";
    return DOMPurify.sanitize(item.content, {
      ALLOWED_TAGS: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "strong", "em", "br", "img", "blockquote", "pre", "code", "table", "thead", "tbody", "tr", "th", "td", "span", "div", "figure", "figcaption"],
      ALLOWED_ATTR: ["href", "src", "alt", "class", "id", "target", "rel"],
    });
  }, [item?.content]);

  if (isLoading) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/library">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Link>
          </Button>
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Content not found</h3>
              <p className="text-muted-foreground mb-4">
                The content you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link href="/library">Browse Library</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const Icon = contentTypeIcons[item.contentType] || FileText;

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6" data-testid="button-back">
          <Link href="/library">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Link>
        </Button>

        <article>
          {item.imageUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-md mb-6">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
              {contentTypeLabels[item.contentType] || item.contentType}
            </Badge>
            {item.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>

          <h1
            className="text-3xl font-bold tracking-tight mb-4"
            data-testid="text-title"
          >
            {item.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            {item.authorName && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {item.authorName}
              </span>
            )}
            {item.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(item.createdAt)}
              </span>
            )}
            {item.viewCount !== null && item.viewCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {item.viewCount} views
              </span>
            )}
          </div>

          {sanitizedContent && (
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              data-testid="content-body"
            />
          )}
        </article>
      </div>
    </main>
  );
}
