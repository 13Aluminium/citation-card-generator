import { toPng } from 'html-to-image';

export async function generateCardImage(node: HTMLElement): Promise<string> {
  try {
    return await toPng(node, {
      quality: 0.95,
      pixelRatio: 2,
    });
  } catch (err) {
    console.error('Failed to generate image:', err);
    throw err;
  }
}

export async function exportToPng(node: HTMLElement): Promise<void> {
  try {
    const dataUrl = await toPng(node, {
      quality: 0.95,
      pixelRatio: 2,
    });
    
    const link = document.createElement('a');
    link.download = 'citation-card.png';
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export image:', err);
    throw err;
  }
}

export async function shareToTwitter(node: HTMLElement, title: string): Promise<void> {
  try {
    const dataUrl = await toPng(node, {
      quality: 0.95,
      pixelRatio: 2,
    });
    
    // Convert data URL to Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create a File from the Blob
    const file = new File([blob], 'citation-card.png', { type: 'image/png' });
    
    // Share using Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Citation Card',
          text: `Check out this paper: ${title}`,
          files: [file],
        });
      } catch (shareError: any) {
        if (shareError.name === 'NotAllowedError') {
          // Fallback to opening Twitter intent
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `Check out this paper: ${title}`
          )}`;
          window.open(twitterUrl, '_blank');
        } else {
          console.error('Failed to share:', shareError);
          throw shareError;
        }
      }
    } else {
      // Fallback to opening Twitter intent
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Check out this paper: ${title}`
      )}`;
      window.open(twitterUrl, '_blank');
    }
  } catch (err) {
    console.error('Failed to share:', err);
    throw err;
  }
}