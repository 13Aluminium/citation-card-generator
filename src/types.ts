export interface CitationData {
  title: string;
  authors: string[];
  year: string;
  identifier: {
    type: 'doi' | 'arxiv' | 'acm' | 'ieee' | 'pubmed';
    value: string;
  };
  venue?: string;
  institution?: string;
  label?: string;
}

export type CardLayout = 'horizontal' | 'vertical';

export type ExportFormat = 'png' | 'jpg' | 'svg';

export interface CardOptions {
  layout: CardLayout;
  label: string;
  maxAuthors: number;
  showInstitution: boolean;
  theme: 'light' | 'dark';
}