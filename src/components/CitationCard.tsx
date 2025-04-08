import React from 'react';
import { CitationData, CardLayout } from '../types';

interface CitationCardProps {
  data: CitationData;
  layout: CardLayout;
  className?: string;
}

export function CitationCard({ data, layout, className = '' }: CitationCardProps) {
  const isHorizontal = layout === 'horizontal';
  
  // Show only one author if there are more than 10
  const displayAuthors = data.authors.length > 10 
    ? [data.authors[0]] 
    : data.authors.slice(0, 3);
  
  const hasMoreAuthors = data.authors.length > (data.authors.length > 10 ? 1 : 3);

  return (
    <div 
      className={`${
        isHorizontal ? 'horizontal-card' : 'vertical-card'
      } ${className} relative bg-white`}
    >
      <div className="absolute inset-0 bg-gray-100 transform translate-x-2 translate-y-2"></div>
      <div className="absolute inset-0 border border-gray-300 transform translate-x-1 translate-y-1"></div>
      <div className={`relative border border-black ${isHorizontal ? 'p-6' : 'p-5'} h-full ${!isHorizontal ? 'flex flex-col' : ''}`}>
        <div className={`flex justify-between items-start ${!isHorizontal ? 'border-b border-black pb-2 mb-4' : 'mb-3'}`}>
          <div className="text-xs uppercase tracking-widest text-gray-500">{data.label || 'Academic Citation'}</div>
          <div className={`text-xs ${isHorizontal ? 'bg-black text-white px-2 py-1' : 'font-bold text-black'}`}>{data.year}</div>
        </div>
        
        <h3 className={`${isHorizontal ? 'text-xl lg:text-2xl' : 'text-lg'} font-bold mb-3 leading-tight text-black`}>
          {data.title}
        </h3>
        
        <div className="text-sm text-gray-600 mb-3">
          {displayAuthors.map((author, index) => (
            <span key={author} className="mr-2 mb-1">
              {author}{index < displayAuthors.length - 1 ? ',' : ''}
            </span>
          ))}
          {hasMoreAuthors && <span className="mr-2 mb-1">et al.</span>}
        </div>
        
        {isHorizontal ? (
          <div className="flex justify-between items-center mt-auto">
            <div className="text-xs roboto-mono text-black">{data.identifier.type}:{data.identifier.value}</div>
            {data.institution && data.institution !== 'Unknown Institution' && (
              <div className="flex items-center">
                <div className="h-1 w-6 bg-black mr-1"></div>
                <div className="text-xs text-black">{data.institution}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-t border-gray-200 pt-3 mt-auto">
            <div className="flex justify-between items-center">
              <div className="text-xs roboto-mono text-black">{data.identifier.type}</div>
              <div className="h-5 w-5 border border-black flex items-center justify-center">
                <div className="h-2 w-2 bg-black"></div>
              </div>
            </div>
            {data.institution && data.institution !== 'Unknown Institution' && (
              <div className="text-xs text-black mt-1">{data.institution}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}