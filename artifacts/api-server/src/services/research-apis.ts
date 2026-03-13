/**
 * ALLIO Research API Service
 * Unified interface for querying scientific databases
 * 
 * Integrated APIs:
 * - OpenAlex (primary): 250M+ records, LLM-optimized, 100K requests/day free
 * - PubMed (E-Utils): 39M+ medical/biomedical citations
 * - Semantic Scholar: AI-powered summaries with TL;DR feature
 * - arXiv: Physics, math, computer science preprints
 * 
 * Agent Assignments:
 * - HIPPOCRATES: Medical research (PubMed primary)
 * - PARACELSUS: Peptide/biochemistry (OpenAlex + PubMed)
 * - HELIX: General science (OpenAlex primary)
 * - ORACLE: AI-powered insights (Semantic Scholar)
 */

interface ResearchPaper {
  id: string;
  source: 'openalex' | 'pubmed' | 'semantic_scholar' | 'arxiv';
  title: string;
  authors: string[];
  abstract?: string;
  publicationDate?: string;
  journal?: string;
  doi?: string;
  url?: string;
  citationCount?: number;
  tldr?: string;
  keywords?: string[];
  fullTextUrl?: string;
}

interface SearchOptions {
  query: string;
  sources?: ('openalex' | 'pubmed' | 'semantic_scholar' | 'arxiv')[];
  limit?: number;
  yearFrom?: number;
  yearTo?: number;
  openAccessOnly?: boolean;
}

interface SearchResult {
  success: boolean;
  papers: ResearchPaper[];
  totalResults: number;
  source: string;
  error?: string;
}

// Rate limiting tracker
const rateLimits: Record<string, { count: number; resetTime: number }> = {
  openalex: { count: 0, resetTime: Date.now() + 86400000 },
  pubmed: { count: 0, resetTime: Date.now() + 1000 },
  semantic_scholar: { count: 0, resetTime: Date.now() + 1000 },
  arxiv: { count: 0, resetTime: Date.now() + 3000 }
};

function checkRateLimit(source: string, maxRequests: number): boolean {
  const now = Date.now();
  const limit = rateLimits[source];
  
  if (now > limit.resetTime) {
    limit.count = 0;
    limit.resetTime = now + (source === 'openalex' ? 86400000 : 1000);
  }
  
  if (limit.count >= maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

/**
 * OpenAlex API - Primary research database
 * 250M+ records, fully open, LLM-optimized
 * Rate limit: 100,000 requests/day (free)
 */
export async function searchOpenAlex(query: string, options: Partial<SearchOptions> = {}): Promise<SearchResult> {
  try {
    if (!checkRateLimit('openalex', 100000)) {
      return { success: false, papers: [], totalResults: 0, source: 'openalex', error: 'Rate limit exceeded' };
    }

    const limit = options.limit || 25;
    
    // Build filters array and combine properly
    const filters: string[] = [];
    if (options.yearFrom) {
      filters.push(`publication_year:>${options.yearFrom - 1}`);
    }
    if (options.openAccessOnly) {
      filters.push('is_oa:true');
    }
    
    const params = new URLSearchParams({
      search: query,
      per_page: limit.toString(),
      mailto: 'sentinel@forgottenformula.com'
    });
    
    // Combine filters with comma for OpenAlex
    if (filters.length > 0) {
      params.set('filter', filters.join(','));
    }

    const response = await fetch(`https://api.openalex.org/works?${params}`);
    
    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status}`);
    }

    const data = await response.json();
    
    const papers: ResearchPaper[] = data.results?.map((work: any) => ({
      id: work.id?.replace('https://openalex.org/', '') || '',
      source: 'openalex' as const,
      title: work.title || 'Untitled',
      authors: work.authorships?.map((a: any) => a.author?.display_name).filter(Boolean) || [],
      abstract: work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : undefined,
      publicationDate: work.publication_date,
      journal: work.primary_location?.source?.display_name,
      doi: work.doi?.replace('https://doi.org/', ''),
      url: work.primary_location?.landing_page_url || work.doi,
      citationCount: work.cited_by_count,
      keywords: work.concepts?.slice(0, 5).map((c: any) => c.display_name) || [],
      fullTextUrl: work.open_access?.oa_url
    })) || [];

    return {
      success: true,
      papers,
      totalResults: data.meta?.count || papers.length,
      source: 'openalex'
    };
  } catch (error: any) {
    console.error('[Research] OpenAlex error:', error.message);
    return { success: false, papers: [], totalResults: 0, source: 'openalex', error: error.message };
  }
}

// Helper to reconstruct abstract from inverted index
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  if (!invertedIndex) return '';
  
  const words: [string, number][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([word, pos]);
    }
  }
  
  words.sort((a, b) => a[1] - b[1]);
  return words.map(w => w[0]).join(' ');
}

/**
 * PubMed E-Utilities API
 * 39M+ medical/biomedical citations
 * Rate limit: 3 requests/second (10 with API key)
 */
export async function searchPubMed(query: string, options: Partial<SearchOptions> = {}): Promise<SearchResult> {
  try {
    if (!checkRateLimit('pubmed', 3)) {
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    const limit = Math.min(options.limit || 25, 100);
    
    // Step 1: Search for IDs
    const searchParams = new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmax: limit.toString(),
      retmode: 'json',
      usehistory: 'y'
    });

    if (options.yearFrom) {
      searchParams.set('term', `${query} AND ${options.yearFrom}:3000[pdat]`);
    }

    const searchResponse = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams}`);
    
    if (!searchResponse.ok) {
      throw new Error(`PubMed search error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const ids = searchData.esearchresult?.idlist || [];
    
    if (ids.length === 0) {
      return { success: true, papers: [], totalResults: 0, source: 'pubmed' };
    }

    // Step 2: Fetch article details
    const fetchParams = new URLSearchParams({
      db: 'pubmed',
      id: ids.join(','),
      retmode: 'json',
      rettype: 'abstract'
    });

    const fetchResponse = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${fetchParams}`);
    
    if (!fetchResponse.ok) {
      throw new Error(`PubMed fetch error: ${fetchResponse.status}`);
    }

    const fetchData = await fetchResponse.json();
    const results = fetchData.result || {};
    
    const papers: ResearchPaper[] = ids.map((id: string) => {
      const article = results[id];
      if (!article) return null;
      
      return {
        id: `pmid:${id}`,
        source: 'pubmed' as const,
        title: article.title || 'Untitled',
        authors: article.authors?.map((a: any) => a.name) || [],
        publicationDate: article.pubdate,
        journal: article.source,
        doi: article.elocationid?.replace('doi: ', ''),
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        keywords: []
      };
    }).filter(Boolean) as ResearchPaper[];

    return {
      success: true,
      papers,
      totalResults: parseInt(searchData.esearchresult?.count || '0'),
      source: 'pubmed'
    };
  } catch (error: any) {
    console.error('[Research] PubMed error:', error.message);
    return { success: false, papers: [], totalResults: 0, source: 'pubmed', error: error.message };
  }
}

/**
 * Semantic Scholar API
 * AI-powered with TL;DR summaries
 * Rate limit: 100 requests/5 minutes (public) = ~0.33 req/sec
 */
export async function searchSemanticScholar(query: string, options: Partial<SearchOptions> = {}): Promise<SearchResult> {
  try {
    // Respect rate limit: 100 requests per 5 minutes = wait 3 seconds between requests
    if (!checkRateLimit('semantic_scholar', 1)) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const limit = Math.min(options.limit || 10, 50);
    
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
      fields: 'paperId,title,abstract,authors,year,venue,citationCount,tldr,openAccessPdf,externalIds'
    });

    if (options.yearFrom) {
      params.append('year', `${options.yearFrom}-`);
    }

    const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?${params}`, {
      headers: {
        'User-Agent': 'ALLIO-Research-Agent/1.0 (sentinel@forgottenformula.com)'
      }
    });
    
    if (!response.ok) {
      // Fall back to OpenAlex if Semantic Scholar fails
      console.warn(`[Research] Semantic Scholar returned ${response.status}, falling back to OpenAlex`);
      return searchOpenAlex(query, options);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      // Fall back to OpenAlex if no results
      console.log('[Research] Semantic Scholar returned no results, falling back to OpenAlex');
      return searchOpenAlex(query, options);
    }
    
    const papers: ResearchPaper[] = data.data?.map((paper: any) => ({
      id: paper.paperId,
      source: 'semantic_scholar' as const,
      title: paper.title || 'Untitled',
      authors: paper.authors?.map((a: any) => a.name) || [],
      abstract: paper.abstract,
      publicationDate: paper.year?.toString(),
      journal: paper.venue,
      doi: paper.externalIds?.DOI,
      url: `https://www.semanticscholar.org/paper/${paper.paperId}`,
      citationCount: paper.citationCount,
      tldr: paper.tldr?.text,
      fullTextUrl: paper.openAccessPdf?.url
    })) || [];

    return {
      success: true,
      papers,
      totalResults: data.total || papers.length,
      source: 'semantic_scholar'
    };
  } catch (error: any) {
    console.error('[Research] Semantic Scholar error:', error.message);
    // Fall back to OpenAlex on any error
    console.log('[Research] Falling back to OpenAlex due to Semantic Scholar error');
    return searchOpenAlex(query, options);
  }
}

/**
 * arXiv API
 * Physics, math, computer science, quantitative biology
 * Rate limit: 1 request/3 seconds
 */
export async function searchArxiv(query: string, options: Partial<SearchOptions> = {}): Promise<SearchResult> {
  try {
    if (!checkRateLimit('arxiv', 1)) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const limit = Math.min(options.limit || 25, 100);
    
    const params = new URLSearchParams({
      search_query: `all:${query}`,
      start: '0',
      max_results: limit.toString(),
      sortBy: 'relevance',
      sortOrder: 'descending'
    });

    const response = await fetch(`http://export.arxiv.org/api/query?${params}`);
    
    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`);
    }

    const xmlText = await response.text();
    
    // Parse XML (simplified parser)
    const papers: ResearchPaper[] = [];
    const entries = xmlText.split('<entry>').slice(1);
    
    for (const entry of entries) {
      const getTag = (tag: string): string => {
        const match = entry.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
        return match ? match[1].trim() : '';
      };
      
      const getAllTags = (tag: string): string[] => {
        const matches = entry.matchAll(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'g'));
        return Array.from(matches).map(m => m[1].trim());
      };

      const id = getTag('id').replace('http://arxiv.org/abs/', '');
      const title = getTag('title').replace(/\s+/g, ' ');
      const summary = getTag('summary').replace(/\s+/g, ' ');
      const published = getTag('published');
      const authors = getAllTags('name');
      
      // Get PDF link
      const pdfMatch = entry.match(/href="([^"]*\.pdf)"/);
      const pdfUrl = pdfMatch ? pdfMatch[1] : undefined;

      papers.push({
        id: `arxiv:${id}`,
        source: 'arxiv' as const,
        title,
        authors,
        abstract: summary,
        publicationDate: published?.split('T')[0],
        url: `https://arxiv.org/abs/${id}`,
        fullTextUrl: pdfUrl
      });
    }

    return {
      success: true,
      papers,
      totalResults: papers.length,
      source: 'arxiv'
    };
  } catch (error: any) {
    console.error('[Research] arXiv error:', error.message);
    return { success: false, papers: [], totalResults: 0, source: 'arxiv', error: error.message };
  }
}

/**
 * Unified search across all sources
 * Aggregates results and deduplicates by DOI
 */
export async function searchAllSources(options: SearchOptions): Promise<{
  success: boolean;
  papers: ResearchPaper[];
  totalResults: number;
  sourceResults: Record<string, SearchResult>;
}> {
  const sources = options.sources || ['openalex', 'pubmed', 'semantic_scholar', 'arxiv'];
  const searchFns: Record<string, (q: string, opts: Partial<SearchOptions>) => Promise<SearchResult>> = {
    openalex: searchOpenAlex,
    pubmed: searchPubMed,
    semantic_scholar: searchSemanticScholar,
    arxiv: searchArxiv
  };

  const results = await Promise.all(
    sources.map(async source => {
      const fn = searchFns[source];
      if (!fn) return { success: false, papers: [], totalResults: 0, source, error: 'Unknown source' };
      return fn(options.query, options);
    })
  );

  const sourceResults: Record<string, SearchResult> = {};
  sources.forEach((source, i) => {
    sourceResults[source] = results[i];
  });

  // Execute internal library search concurrently, bypassing external rate limit rules
  let driveMatches: ResearchPaper[] = [];
  try {
    const { searchDriveLibrary } = await import('./drive');
    const driveResults = await searchDriveLibrary(options.query);
    driveMatches = driveResults.map(f => ({
      id: f.id,
      source: 'semantic_scholar' as const, // Spoofing to allow frontend UI to render it properly if needed, although it's internal
      title: `[INTERNAL] ${f.name}`,
      authors: ['ALLIO System Library'],
      url: f.webViewLink,
      citationCount: 999 // Ensure it floats to the top of standard sorts
    }));
    
    // Inject the drive results to act as another top priority source
    if (driveMatches.length > 0) {
      sourceResults['internal_drive'] = {
        success: true,
        papers: driveMatches,
        totalResults: driveMatches.length,
        source: 'internal_drive'
      };
    }
  } catch (error) {
    console.error('[Research] Failed to query internal Drive library:', error);
  }

  // Aggregate and deduplicate by DOI (and Google Drive ID)
  const seenDois = new Set<string>();
  const seenIDs = new Set<string>();
  const allPapers: ResearchPaper[] = [];
  
  // Always push internal drive matches first to ensure agents prioritize local knowledge
  for (const paper of driveMatches) {
    if (paper.id && seenIDs.has(paper.id)) continue;
    if (paper.id) seenIDs.add(paper.id);
    allPapers.push(paper);
  }
  
  for (const result of results) {
    for (const paper of result.papers) {
      if (paper.doi && seenDois.has(paper.doi)) continue;
      if (paper.doi) seenDois.add(paper.doi);
      allPapers.push(paper);
    }
  }

  // Sort by citation count (if available) - internal docs artificially boosted
  allPapers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));

  return {
    success: results.some(r => r.success),
    papers: allPapers.slice(0, options.limit || 50),
    totalResults: results.reduce((sum, r) => sum + r.totalResults, 0),
    sourceResults
  };
}

/**
 * Agent-specific search functions
 */

// HIPPOCRATES: Medical research specialist
export async function hippocratesSearch(query: string, limit = 20): Promise<SearchResult> {
  console.log(`[HIPPOCRATES] Searching medical literature: "${query}"`);
  
  // Search internal library first
  let driveMatches: ResearchPaper[] = [];
  try {
    const { searchDriveLibrary } = await import('./drive');
    const driveResults = await searchDriveLibrary(query);
    driveMatches = driveResults.map(f => ({
      id: f.id,
      source: 'semantic_scholar' as const, // Spoofing for unified frontend
      title: `[INTERNAL] ${f.name}`,
      authors: ['ALLIO System Library'],
      url: f.webViewLink,
      citationCount: 999
    }));
  } catch (error) {
    console.error('[Research] Failed to query internal Drive library:', error);
  }

  // Prioritize PubMed for medical queries
  const pubmedResult = await searchPubMed(query, { limit });
  
  if (pubmedResult.papers.length >= limit && driveMatches.length === 0) {
    return pubmedResult;
  }
  
  // Supplement with OpenAlex medical filter
  const openalexResult = await searchOpenAlex(`${query} medicine health clinical`, { 
    limit: limit - pubmedResult.papers.length 
  });
  
  return {
    success: pubmedResult.success || openalexResult.success || driveMatches.length > 0,
    papers: [...driveMatches, ...pubmedResult.papers, ...openalexResult.papers],
    totalResults: driveMatches.length + pubmedResult.totalResults + openalexResult.totalResults,
    source: 'hippocrates_combined'
  };
}

// PARACELSUS: Peptide and biochemistry specialist
export async function paracelsusSearch(query: string, limit = 20): Promise<SearchResult> {
  console.log(`[PARACELSUS] Searching peptide/biochemistry: "${query}"`);
  
  const enrichedQuery = `${query} peptide biochemistry molecular`;
  
  // Search internal library first
  let driveMatches: ResearchPaper[] = [];
  try {
    const { searchDriveLibrary } = await import('./drive');
    const driveResults = await searchDriveLibrary(query);
    driveMatches = driveResults.map(f => ({
      id: f.id,
      source: 'semantic_scholar' as const, // Spoofing for unified frontend
      title: `[INTERNAL] ${f.name}`,
      authors: ['ALLIO System Library'],
      url: f.webViewLink,
      citationCount: 999
    }));
  } catch (error) {
    console.error('[Research] Failed to query internal Drive library:', error);
  }

  const [pubmed, openalex] = await Promise.all([
    searchPubMed(enrichedQuery, { limit: Math.ceil(limit / 2) }),
    searchOpenAlex(enrichedQuery, { limit: Math.ceil(limit / 2) })
  ]);
  
  // Deduplicate
  const seenDois = new Set(pubmed.papers.map(p => p.doi).filter(Boolean));
  const uniqueOpenalex = openalex.papers.filter(p => !p.doi || !seenDois.has(p.doi));
  
  return {
    success: pubmed.success || openalex.success || driveMatches.length > 0,
    papers: [...driveMatches, ...pubmed.papers, ...uniqueOpenalex].slice(0, limit),
    totalResults: driveMatches.length + pubmed.totalResults + openalex.totalResults,
    source: 'paracelsus_combined'
  };
}

// HELIX: General science coordinator
export async function helixSearch(query: string, limit = 20): Promise<SearchResult> {
  console.log(`[HELIX] Searching all scientific databases: "${query}"`);
  
  const result = await searchAllSources({ query, limit });
  
  // Note: searchAllSources already injects Drive results, so we just pass it through
  return {
    success: result.success,
    papers: result.papers,
    totalResults: result.totalResults,
    source: 'helix_unified'
  };
}

// ORACLE: AI-powered insights with summaries
export async function oracleSearch(query: string, limit = 20): Promise<SearchResult> {
  console.log(`[ORACLE] Searching with AI summaries: "${query}"`);
  
  // Search internal library first
  let driveMatches: ResearchPaper[] = [];
  try {
    const { searchDriveLibrary } = await import('./drive');
    const driveResults = await searchDriveLibrary(query);
    driveMatches = driveResults.map(f => ({
      id: f.id,
      source: 'semantic_scholar' as const, // Spoofing for unified frontend
      title: `[INTERNAL] ${f.name}`,
      authors: ['ALLIO System Library'],
      url: f.webViewLink,
      citationCount: 999,
      tldr: 'Internal document from Trustee Library. Needs direct review.'
    }));
  } catch (error) {
    console.error('[Research] Failed to query internal Drive library:', error);
  }

  // Prioritize Semantic Scholar for TL;DR summaries
  const result = await searchSemanticScholar(query, { limit });
  
  // Filter to only papers with TL;DR available
  const withSummaries = result.papers.filter(p => p.tldr);
  
  if (withSummaries.length >= 5 || driveMatches.length > 0) {
    return {
      success: result.success || driveMatches.length > 0,
      papers: [...driveMatches, ...withSummaries],
      totalResults: driveMatches.length + (result.totalResults || withSummaries.length),
      source: 'oracle_summarized'
    };
  }
  
  return {
    ...result,
    source: 'oracle_semantic'
  };
}

export type { ResearchPaper, SearchOptions, SearchResult };
