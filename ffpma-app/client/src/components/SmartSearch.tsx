import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Sparkles, ArrowRight, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

interface SearchSuggestion {
  text: string;
  type: 'correction' | 'suggestion' | 'recent' | 'ai';
  confidence?: number;
  route?: string;
}

interface SmartSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

const SEARCHABLE_ROUTES = [
  { path: '/training', keywords: ['training', 'learn', 'course', 'module', 'education', 'study'] },
  { path: '/doctors', keywords: ['doctor', 'network', 'physician', 'clinic', 'medical'] },
  { path: '/products', keywords: ['product', 'supplement', 'formula', 'buy', 'shop'] },
  { path: '/protocols', keywords: ['protocol', 'treatment', 'healing', 'therapy', 'program'] },
  { path: '/library', keywords: ['library', 'blood', 'analysis', 'sample', 'pattern'] },
  { path: '/quizzes', keywords: ['quiz', 'test', 'assessment', 'certification'] },
  { path: '/dashboard', keywords: ['dashboard', 'home', 'overview', 'main'] },
  { path: '/about', keywords: ['about', 'mission', 'company', 'who', 'team'] },
];

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function findTypoCorrection(query: string, dictionary: string[]): SearchSuggestion | null {
  const queryLower = query.toLowerCase();
  let bestMatch: { word: string; distance: number } | null = null;
  
  for (const word of dictionary) {
    const distance = levenshteinDistance(queryLower, word.toLowerCase());
    if (distance <= 2 && distance > 0) {
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { word, distance };
      }
    }
  }
  
  if (bestMatch) {
    return {
      text: bestMatch.word,
      type: 'correction',
      confidence: 1 - (bestMatch.distance / Math.max(query.length, bestMatch.word.length))
    };
  }
  return null;
}

function findRouteMatches(query: string): SearchSuggestion[] {
  const queryLower = query.toLowerCase();
  const matches: SearchSuggestion[] = [];
  
  for (const route of SEARCHABLE_ROUTES) {
    for (const keyword of route.keywords) {
      if (keyword.includes(queryLower) || queryLower.includes(keyword)) {
        matches.push({
          text: `Go to ${route.path.slice(1).charAt(0).toUpperCase() + route.path.slice(2)}`,
          type: 'suggestion',
          route: route.path
        });
        break;
      }
    }
  }
  
  return matches.slice(0, 3);
}

export function SmartSearch({ placeholder = "Search ALLIO...", onSearch, className }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const dictionary = [
    'training', 'protocol', 'product', 'supplement', 'doctor', 'blood', 'analysis',
    'healing', 'formula', 'certificate', 'certification', 'quiz', 'lesson', 'module',
    'library', 'pattern', 'gene', 'tumor', 'ligand', 'pathway', 'endocannabinoid',
    'curcumin', 'quercetin', 'resveratrol', 'boswellia', 'genistein', 'EGCG',
    'melatonin', 'selenium', 'vitamin', 'antioxidant', 'inflammation', 'apoptosis'
  ];

  const fetchAISuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) return [];
    
    try {
      const response = await fetch('/api/search/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.suggestions || [];
      }
    } catch (error) {
      console.error('AI suggestions error:', error);
    }
    return [];
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsLoading(true);
      const newSuggestions: SearchSuggestion[] = [];

      const typoCorrection = findTypoCorrection(query, dictionary);
      if (typoCorrection) {
        newSuggestions.push(typoCorrection);
      }

      const routeMatches = findRouteMatches(query);
      newSuggestions.push(...routeMatches);

      const aiSuggestions = await fetchAISuggestions(query);
      newSuggestions.push(...aiSuggestions.map((s: string) => ({
        text: s,
        type: 'ai' as const
      })));

      setSuggestions(newSuggestions.slice(0, 6));
      setIsOpen(newSuggestions.length > 0);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, fetchAISuggestions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (query) {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.route) {
      navigate(suggestion.route);
    } else if (suggestion.type === 'correction') {
      setQuery(suggestion.text);
    } else {
      setQuery(suggestion.text);
      onSearch?.(suggestion.text);
    }
    setIsOpen(false);
  };

  const handleSearch = () => {
    if (query.trim()) {
      onSearch?.(query);
      setIsOpen(false);
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'ai':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'correction':
        return <span className="text-amber-400 text-xs font-medium">Fix:</span>;
      case 'suggestion':
        return <ArrowRight className="w-4 h-4 text-blue-400" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} data-testid="smart-search-container">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          className="pl-10 pr-20 bg-slate-800 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20"
          data-testid="input-smart-search"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); }}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              data-testid="button-clear-search"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSearch}
            className="h-6 px-2 text-cyan-400 hover:text-cyan-300"
            data-testid="button-search-submit"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
            data-testid="smart-search-dropdown"
          >
            <div className="p-2 border-b border-slate-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-400">AI-Powered Suggestions</span>
            </div>
            <ul className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.type}-${index}`}
                  className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-cyan-500/20 text-white'
                      : 'text-gray-300 hover:bg-slate-700'
                  }`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  data-testid={`suggestion-${suggestion.type}-${index}`}
                >
                  {getSuggestionIcon(suggestion.type)}
                  <span className="flex-1">{suggestion.text}</span>
                  {suggestion.confidence && (
                    <span className="text-xs text-gray-500">
                      {Math.round(suggestion.confidence * 100)}% match
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="p-2 border-t border-slate-700 text-center">
              <span className="text-xs text-gray-500">
                Press Enter to search or use ↑↓ to navigate
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
