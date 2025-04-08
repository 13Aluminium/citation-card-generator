import { CitationData } from '../types';
import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function scrapeWebPage(url: string): Promise<CitationData> {
  try {
    const response = await fetchWithTimeout(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Try to extract metadata from common meta tags
    const title = $('meta[name="citation_title"]').attr('content') ||
                 $('meta[property="og:title"]').attr('content') ||
                 $('title').text();
                 
    const authors = $('meta[name="citation_author"]')
      .map((_, el) => $(el).attr('content'))
      .get();
      
    const year = $('meta[name="citation_publication_date"]').attr('content')?.slice(0, 4) ||
                $('meta[name="citation_year"]').attr('content') ||
                new Date().getFullYear().toString();
                
    const venue = $('meta[name="citation_journal_title"]').attr('content') ||
                 $('meta[name="citation_conference"]').attr('content');
                 
    const institution = $('meta[name="citation_author_institution"]').attr('content');

    return {
      title: title || 'Unknown Title',
      authors: authors.length > 0 ? authors : ['Unknown Author'],
      year,
      identifier: {
        type: 'url',
        value: url
      },
      venue: venue || 'Unknown Venue',
      institution: institution || 'Unknown Institution',
      label: 'Academic Citation'
    };
  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error('Failed to extract citation data from webpage');
  }
}

async function parseArXivXML(xml: string): Promise<CitationData> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });
  
  try {
    const result = parser.parse(xml);
    const entry = result.feed.entry;
    
    // Extract authors
    const authors = Array.isArray(entry.author) 
      ? entry.author.map((a: any) => a.name)
      : [entry.author.name];
    
    // Extract date and convert to year
    const published = new Date(entry.published);
    
    return {
      title: entry.title,
      authors,
      year: published.getFullYear().toString(),
      identifier: {
        type: 'arxiv',
        value: entry.id.split('/').pop() || ''
      },
      venue: 'arXiv',
      institution: entry.author[0]?.affiliation || 'Unknown Institution',
      label: 'Academic Citation'
    };
  } catch (error) {
    console.error('XML parsing error:', error);
    throw new Error('Failed to parse arXiv metadata');
  }
}

export async function parseCitationUrl(url: string): Promise<CitationData> {
  // Extract DOI from URL if present
  const doiMatch = url.match(/10\.\d{4,}\/[-._;()\/:A-Z0-9]+/i);
  const doi = doiMatch ? doiMatch[0] : null;

  // Extract arXiv ID from URL if present
  const arxivMatch = url.match(/arxiv\.org\/abs\/(\d+\.\d+)/i);
  const arxivId = arxivMatch ? arxivMatch[1] : null;

  if (doi) {
    try {
      const response = await fetchWithTimeout(`https://api.crossref.org/works/${doi}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CitationCardGenerator/1.0 (mailto:support@example.com)'
        }
      });
      
      if (!response.ok) {
        // If API fails, try web scraping
        return await scrapeWebPage(url);
      }
      
      const data = await response.json();
      const work = data.message;

      return {
        title: work.title[0],
        authors: work.author?.map((a: any) => `${a.given} ${a.family}`) || ['Unknown Author'],
        year: work.created ? new Date(work.created['date-time']).getFullYear().toString() : 'Unknown Year',
        identifier: {
          type: 'doi',
          value: doi
        },
        venue: work.publisher || 'Unknown Venue',
        institution: work['group-title'] || work.publisher || 'Unknown Institution',
        label: 'Academic Citation'
      };
    } catch (error) {
      // If API fails, try web scraping
      return await scrapeWebPage(url);
    }
  }

  if (arxivId) {
    try {
      const response = await fetchWithTimeout(`https://export.arxiv.org/api/query?id_list=${arxivId}`, {
        headers: {
          'Accept': 'application/xml'
        }
      });
      
      if (!response.ok) {
        // If API fails, try web scraping
        return await scrapeWebPage(url);
      }
      
      const xml = await response.text();
      return await parseArXivXML(xml);
    } catch (error) {
      // If API fails, try web scraping
      return await scrapeWebPage(url);
    }
  }

  // If no DOI or arXiv ID found, try web scraping
  try {
    return await scrapeWebPage(url);
  } catch (error) {
    throw new Error('Failed to extract citation data. Please check the URL and try again.');
  }
}