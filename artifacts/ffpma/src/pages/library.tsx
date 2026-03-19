import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  FileText,
  BookOpen,
  Video,
  GraduationCap,
  File,
  Calendar,
  User,
  Eye,
  Download,
  ExternalLink,
  FolderOpen,
  RefreshCw,
  HardDrive,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LibraryItem } from "@shared/schema";

interface ExtendedLibraryItem extends LibraryItem {
  webViewLink?: string | null;
  webContentLink?: string | null;
  mimeType?: string | null;
  isDriveDocument?: boolean;
}

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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCategoryName(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: libraryItems = [], isLoading } = useQuery<ExtendedLibraryItem[]>({
    queryKey: ["/api/library"],
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const resp = await fetch("/api/library/sync-drive", { method: "POST", credentials: "include" });
      if (!resp.ok) throw new Error("Sync failed");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
    },
  });

  const filteredItems = libraryItems.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || item.contentType === selectedType;
    const matchesCategory = !selectedCategory || item.categorySlug === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const contentTypes = Array.from(new Set(libraryItems.map((item) => item.contentType)));
  const categories = Array.from(new Set(libraryItems.map((item) => item.categorySlug).filter(Boolean))) as string[];

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="text-page-title">
              Library
            </h1>
            <p className="text-muted-foreground">
              Browse our collection of books, protocols, and educational resources
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            data-testid="button-sync-drive"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "Syncing..." : "Sync Drive"}
          </Button>
        </div>

        {syncMutation.isSuccess && (
          <div className="mb-4 p-3 rounded-md bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 text-sm">
            {(syncMutation.data as any)?.message}
          </div>
        )}
        {syncMutation.isError && (
          <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 text-sm">
            Sync failed. Please try again.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search library..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedType === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(null)}
              data-testid="button-filter-all"
            >
              All
            </Button>
            {contentTypes.map((type) => {
              const Icon = contentTypeIcons[type] || FileText;
              return (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  data-testid={`button-filter-${type}`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {contentTypeLabels[type] || type}
                </Button>
              );
            })}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              data-testid="button-category-all"
            >
              All Categories
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                data-testid={`button-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {formatCategoryName(cat)}
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No content found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedType
                ? "Try adjusting your search or filters"
                : "Click 'Sync Drive' to import your Google Drive Library"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const Icon = contentTypeIcons[item.contentType] || FileText;
              return (
                <Card
                  key={item.id}
                  className="hover-elevate flex flex-col"
                  data-testid={`card-library-${item.id}`}
                >
                  {item.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-md">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        {contentTypeLabels[item.contentType] || item.contentType}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2 line-clamp-2">{item.title}</CardTitle>
                    {item.excerpt && (
                      <CardDescription className="line-clamp-2">
                        {item.excerpt}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="mt-auto pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      {item.authorName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.authorName}
                        </span>
                      )}
                      {item.categorySlug && (
                        <span className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          {formatCategoryName(item.categorySlug)}
                        </span>
                      )}
                      {item.createdAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.createdAt)}
                        </span>
                      )}
                      {item.viewCount !== null && item.viewCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {item.viewCount}
                        </span>
                      )}
                    </div>
                    {item.isDriveDocument ? (
                      <div className="space-y-2">
                        {item.fileSize && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <HardDrive className="h-3 w-3" />
                            {item.fileSize}
                          </div>
                        )}
                        <div className="flex gap-2">
                          {item.webViewLink && (
                            <Button variant="outline" className="flex-1" asChild>
                              <a href={item.webViewLink} target="_blank" rel="noopener noreferrer" data-testid={`link-view-${item.id}`}>
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Open
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/library/${item.slug}`} data-testid={`link-library-${item.id}`}>
                          Read More
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredItems.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {filteredItems.length} of {libraryItems.length} items
          </div>
        )}
      </div>
    </main>
  );
}
