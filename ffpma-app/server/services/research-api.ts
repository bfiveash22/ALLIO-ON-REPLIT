import axios from 'axios';
import { db } from '../db';
import { researchPapers, agentResearchQueries, agentResearchCollections } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';
import crypto from 'crypto';

const OPENALEX_API_URL = 'https://api.openalex.org';
const SEMANTIC_SCHOLAR_API_URL = 'https://api.semanticscholar.org/graph/v1';

// We should use an email for polite pool in OpenAlex if possible
const POLITE_EMAIL = process.env.OPENALEX_EMAIL || 'research@ffpma.com';

interface ResearchPaperResult {
  externalId: string;
  source: 'openalex' | 'semantic_scholar' | 'pubmed' | 'arxiv';
  title: string;
  authors: string[];
  abstract: string | null;
  publicationDate: string | null;
  journal: string | null;
  doi: string | null;
  url: string | null;
  citationCount: number | null;
  tldr: string | null;
  keywords: string[];
  fullTextUrl: string | null;
}

export class ResearchAPIService {

  /**
   * Searches Semantic Scholar for papers and TLDRs
   */
  async searchSemanticScholar(query: string, limit: number = 10): Promise<ResearchPaperResult[]> {
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;

    try {
      const response = await axios.get(`${SEMANTIC_SCHOLAR_API_URL}/paper/search`, {
        headers: apiKey ? { 'x-api-key': apiKey } : undefined,
        params: {
          query,
          limit,
          fields: 'title,authors,abstract,year,publicationDate,venue,url,referenceCount,citationCount,isOpenAccess,openAccessPdf,tldr'
        },
        timeout: 10000
      });

      if (!response.data || !response.data.data) return [];

      return response.data.data.map((paper: any) => ({
        externalId: paper.paperId,
        source: 'semantic_scholar',
        title: paper.title,
        authors: paper.authors?.map((a: any) => a.name) || [],
        abstract: paper.abstract,
        publicationDate: paper.publicationDate || (paper.year ? `${paper.year}` : null),
        journal: paper.venue,
        doi: null, // S2 might provide externalIds.DOI, ignoring for simplicity if deep nested
        url: paper.url,
        citationCount: paper.citationCount,
        tldr: paper.tldr?.text || null,
        keywords: [],
        fullTextUrl: paper.openAccessPdf?.url || null
      }));
    } catch (error) {
      console.error('[RESEARCH] Semantic Scholar Error:', error);
      return [];
    }
  }

  /**
   * Searches OpenAlex for comprehensive metadata
   */
  async searchOpenAlex(query: string, limit: number = 10): Promise<ResearchPaperResult[]> {
    try {
      const response = await axios.get(`${OPENALEX_API_URL}/works`, {
        params: {
          search: query,
          per_page: limit,
          mailto: POLITE_EMAIL
        },
        timeout: 10000
      });

      if (!response.data || !response.data.results) return [];

      return response.data.results.map((work: any) => {
        
        let abstract = null;
        if (work.abstract_inverted_index) {
          // Reconstruct abstract from inverted index
          const words = [];
          for (const [word, positions] of Object.entries(work.abstract_inverted_index)) {
            for (const pos of (positions as number[])) {
              words[pos] = word;
            }
          }
          abstract = words.join(' ');
        }

        return {
          externalId: work.id.replace('https://openalex.org/', ''),
          source: 'openalex',
          title: work.title,
          authors: work.authorships?.map((a: any) => a.author.display_name) || [],
          abstract: abstract,
          publicationDate: work.publication_date,
          journal: work.primary_location?.source?.display_name || null,
          doi: work.doi,
          url: work.id,
          citationCount: work.cited_by_count,
          tldr: null, // OpenAlex doesn't do native TLDRs
          keywords: work.concepts?.map((c: any) => c.display_name).slice(0, 5) || [],
          fullTextUrl: work.open_access?.oa_url || null
        };
      });
    } catch (error) {
      console.error('[RESEARCH] OpenAlex Error:', error);
      return [];
    }
  }

  /**
   * Searches CORE for Open-Access full-text research
   */
  async searchCore(query: string, limit: number = 10): Promise<ResearchPaperResult[]> {
    const apiKey = process.env.CORE_API_KEY;
    if (!apiKey) return [];

    try {
      const response = await axios.post(`https://api.core.ac.uk/v3/search/works`, {
        q: query,
        limit: limit,
        scroll: false
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (!response.data || !response.data.results) return [];

      return response.data.results.map((work: any) => ({
        externalId: work.id?.toString() || '',
        source: 'arxiv', // For now, use arxiv as a generic open-access fallback mapping since CORE isn't explicitly in our enum right now.
        title: work.title,
        authors: work.authors?.map((a: any) => a.name).filter(Boolean) || [],
        abstract: work.abstract,
        publicationDate: work.year ? `${work.year}` : null,
        journal: work.publisher || null,
        doi: work.identifiers?.find((id: string) => id.startsWith('doi:'))?.replace('doi:', '') || null,
        url: work.downloadUrl || work.links?.find((l: any) => l.type === 'download')?.url || null,
        citationCount: work.citationCount || 0,
        tldr: null,
        keywords: work.topics || [],
        fullTextUrl: work.downloadUrl || null
      }));
    } catch (error) {
      console.error('[RESEARCH] CORE API Error:', error);
      return [];
    }
  }

  /**
   * Searches PubMed (NCBI E-utilities) for biomedical literature
   */
  async searchPubMed(query: string, limit: number = 10): Promise<ResearchPaperResult[]> {
    const apiKey = process.env.PUBMED_API_KEY;
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    
    try {
      // Step 1: Search for IDs
      const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json${apiKey ? `&api_key=${apiKey}` : ''}`;
      const searchRes = await axios.get(searchUrl, { timeout: 10000 });
      const pmids: string[] = searchRes.data?.esearchresult?.idlist || [];
      
      if (pmids.length === 0) return [];

      // Step 2: Fetch details for those IDs
      const detailsUrl = `${baseUrl}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json${apiKey ? `&api_key=${apiKey}` : ''}`;
      const detailsRes = await axios.get(detailsUrl, { timeout: 10000 });
      const results = detailsRes.data?.result || {};

      return pmids.map(pmid => {
        const paper = results[pmid];
        if (!paper) return null;
        
        return {
          externalId: pmid,
          source: 'pubmed',
          title: paper.title,
          authors: paper.authors?.map((a: any) => a.name) || [],
          abstract: null, // esummary doesn't return full abstract, requires efetch
          publicationDate: paper.pubdate?.split(' ')[0] || null,
          journal: paper.source,
          doi: paper.elocationid?.replace('doi: ', '') || null,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          citationCount: 0,
          tldr: null,
          keywords: [],
          fullTextUrl: null
        };
      }).filter(Boolean) as ResearchPaperResult[];
    } catch (error) {
      console.error('[RESEARCH] PubMed API Error:', error);
      return [];
    }
  }

  /**
   * Tries to find full text links for papers that only have DOIs
   */
  async addFullTextLinks(papers: ResearchPaperResult[]): Promise<ResearchPaperResult[]> {
    const withLinks = await Promise.all(
      papers.map(async (paper) => {
        if (paper.fullTextUrl || !paper.doi) return paper;
        try {
          const url = `https://api.unpaywall.org/v2/${paper.doi}?email=${POLITE_EMAIL}`;
          const response = await axios.get(url, { timeout: 8000 });
          if (response.data?.best_oa_location?.url_for_pdf || response.data?.best_oa_location?.url) {
            paper.fullTextUrl = response.data.best_oa_location.url_for_pdf || response.data.best_oa_location.url;
          }
        } catch (err) {
          // Silently fail, it just won't have a full text link
        }
        return paper;
      })
    );
    return withLinks;
  }

  /**
   * Agent orchestration method: Search multiple sources, deduplicate, and cache
   */
  async agentSearch(agentId: string, agentName: string, query: string, purpose: string): Promise<string[]> {
    console.log(`[RESEARCH] ${agentName} searching for: "${query}"`);
    
    // Fire all APIs in parallel using Promise.allSettled so one failure doesn't crash the rest
    const results = await Promise.allSettled([
      this.searchSemanticScholar(query, 5),
      this.searchOpenAlex(query, 5),
      this.searchPubMed(query, 5),
      this.searchCore(query, 5)
    ]);

    let allResults: ResearchPaperResult[] = [];
    
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        allResults = [...allResults, ...result.value];
      } else {
        console.log(`[RESEARCH] Database ${idx + 1} error:`, result.reason?.message);
      }
    });

    // Combine and loosely deduplicate by title
    const uniqueResults = new Map<string, ResearchPaperResult>();
    
    for (const res of allResults) {
      if (!res.title) continue;
      const normalizedTitle = res.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!uniqueResults.has(normalizedTitle)) {
        uniqueResults.set(normalizedTitle, res);
      } else {
        // Prefer Semantic Scholar if it has a TLDR, or if the new one has a fullTextUrl and existing doesn't
        const existing = uniqueResults.get(normalizedTitle)!;
        if ((res.tldr && !existing.tldr) || (res.fullTextUrl && !existing.fullTextUrl)) {
          uniqueResults.set(normalizedTitle, res);
        }
      }
    }

    const deduplicatedResults = Array.from(uniqueResults.values());
    
    // Try to resolve full text for top 10 results
    const finalResults = await this.addFullTextLinks(deduplicatedResults.slice(0, 10));

    const savedPaperIds: string[] = [];

    // Cache results in database
    for (const paper of finalResults) {
      try {
        // Check if paper already exists
        const [existing] = await db.select({ id: researchPapers.id }).from(researchPapers).where(eq(researchPapers.externalId, paper.externalId)).limit(1);
        
        if (existing) {
          savedPaperIds.push(existing.id);
        } else {
          const [inserted] = await db.insert(researchPapers).values({
            externalId: paper.externalId,
            source: paper.source,
            title: paper.title,
            authors: paper.authors,
            abstract: paper.abstract,
            publicationDate: paper.publicationDate,
            journal: paper.journal,
            doi: paper.doi,
            url: paper.url,
            citationCount: paper.citationCount,
            tldr: paper.tldr,
            keywords: paper.keywords,
            fullTextUrl: paper.fullTextUrl
          }).returning({ id: researchPapers.id });
          
          savedPaperIds.push(inserted.id);
        }
      } catch (err: any) {
        console.warn(`[RESEARCH] Paper cache warn: ${paper.title} - ${err.message}`);
      }
    }

    // Log the search query for the agent
    await db.insert(agentResearchQueries).values({
      agentId,
      agentName,
      query,
      sources: ['openalex', 'semantic_scholar', 'pubmed', 'core', 'unpaywall'],
      resultsCount: savedPaperIds.length,
      topPaperIds: savedPaperIds,
      purpose
    });

    return savedPaperIds;
  }
}

export const researchApi = new ResearchAPIService();
