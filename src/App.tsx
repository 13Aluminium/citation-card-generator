import React, { useState, useRef, useEffect } from 'react';
import { Download, Share2, Layout, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { CitationCard } from './components/CitationCard';
import { CitationData, CardLayout } from './types';
import { parseCitationUrl } from './utils/urlParser';
import { generateCardImage, exportToPng, shareToTwitter } from './utils/export';

const sampleData: CitationData = {
  title: "Large Language Models are Zero-Shot Reasoners",
  authors: ["Takeshi Kojima", "Shixiang Shane Gu", "Machel Reid", "Yutaka Matsuo", "Yusuke Iwasawa"],
  year: "2022",
  identifier: {
    type: "arxiv",
    value: "2205.11916"
  },
  institution: "University of Tokyo",
  label: "Academic Citation"
};

function App() {
  const horizontalCardRef = useRef<HTMLDivElement>(null);
  const verticalCardRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citationData, setCitationData] = useState<CitationData>(sampleData);
  const [selectedLayout, setSelectedLayout] = useState<CardLayout>('horizontal');
  const [horizontalImage, setHorizontalImage] = useState<string | null>(null);
  const [verticalImage, setVerticalImage] = useState<string | null>(null);

  const generateImages = async () => {
    if (!horizontalCardRef.current || !verticalCardRef.current) return;
    
    setGenerating(true);
    try {
      // Force a small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const [horizontalPng, verticalPng] = await Promise.all([
        generateCardImage(horizontalCardRef.current),
        generateCardImage(verticalCardRef.current)
      ]);
      
      setHorizontalImage(horizontalPng);
      setVerticalImage(verticalPng);
    } catch (err) {
      console.error('Failed to generate images:', err);
      toast.error('Failed to generate card images');
    } finally {
      setGenerating(false);
    }
  };

  // Generate initial sample images
  useEffect(() => {
    generateImages();
  }, [citationData]); // Regenerate when citation data changes

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await parseCitationUrl(url);
      setCitationData(data);
      toast.success('Citation data fetched');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch citation data');
      toast.error('Failed to fetch citation data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const imageUrl = selectedLayout === 'horizontal' ? horizontalImage : verticalImage;
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.download = `citation-card-${selectedLayout}.png`;
    link.href = imageUrl;
    link.click();
    toast.success('Card exported');
  };

  const handleShare = async () => {
    const imageUrl = selectedLayout === 'horizontal' ? horizontalImage : verticalImage;
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'citation-card.png', { type: 'image/png' });
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Citation Card',
            text: `Check out this paper: ${citationData.title}`,
            files: [file],
          });
          toast.success('Ready to share');
        } catch (err) {
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `Check out this paper: ${citationData.title}`
          )}`;
          window.open(twitterUrl, '_blank');
        }
      } else {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Check out this paper: ${citationData.title}`
        )}`;
        window.open(twitterUrl, '_blank');
      }
    } catch (err) {
      toast.error('Failed to share');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-16">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Research Snap</h1>
          <p className="text-gray-400">
            Create beautiful citation cards for your research papers
          </p>
        </header>

        <div className="space-y-12">
          <div className="bg-zinc-900 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Enter Paper URL</h2>
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Paper URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://arxiv.org/abs/2112.11446"
                  className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-lg focus:outline-none focus:border-white transition-colors"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Currently supports arXiv links (e.g., arxiv.org/abs/2112.11446)
                </p>
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !url}
                  className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Fetching Data
                    </span>
                  ) : (
                    'Fetch Data'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedLayout(l => l === 'horizontal' ? 'vertical' : 'horizontal')}
                  className="px-6 py-2 border border-zinc-800 rounded-lg hover:border-white transition-colors flex items-center gap-2"
                >
                  <Layout size={18} />
                  {selectedLayout === 'horizontal' ? 'Horizontal' : 'Vertical'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-zinc-900 rounded-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Preview</h2>
              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  disabled={exporting || !horizontalImage || generating}
                  className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Download size={18} />
                  Export PNG
                </button>
                <button
                  onClick={handleShare}
                  disabled={exporting || !horizontalImage || generating}
                  className="px-4 py-2 border border-zinc-800 rounded-lg hover:border-white transition-colors flex items-center gap-2"
                >
                  <Share2 size={18} />
                  Share
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              {/* Hidden elements for generating PNGs */}
              <div className="fixed left-[-9999px]" aria-hidden="true">
                <div ref={horizontalCardRef} className="bg-white p-8 rounded-lg">
                  <CitationCard
                    data={citationData}
                    layout="horizontal"
                    className="mx-auto"
                  />
                </div>
                <div ref={verticalCardRef} className="bg-white p-8 rounded-lg">
                  <CitationCard
                    data={citationData}
                    layout="vertical"
                    className="mx-auto"
                  />
                </div>
              </div>

              {/* Display the generated PNG */}
              <div className="bg-white p-8 rounded-lg w-full flex justify-center">
                {generating ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 size={32} className="animate-spin text-gray-400" />
                  </div>
                ) : (
                  <img
                    src={selectedLayout === 'horizontal' ? horizontalImage || '' : verticalImage || ''}
                    alt="Citation Card"
                    className="max-w-full h-auto"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
