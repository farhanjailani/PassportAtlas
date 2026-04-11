'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface PlaceImage {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  alt_description: string;
  attribution: {
    name: string;
    url: string;
  };
  landmarkName: string;
}

interface PlaceImageCarouselProps {
  placeName: string;
  onClose: () => void;
}

const CACHE_KEY_PREFIX = 'place_images_wiki_';

export default function PlaceImageCarousel({ placeName, onClose }: PlaceImageCarouselProps) {
  const [images, setImages] = useState<PlaceImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);

    const cacheKey = `${CACHE_KEY_PREFIX}${query.toLowerCase().replace(/\s+/g, '_')}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setImages(parsed);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      // Step 1: Discover top tourist attractions via Wikipedia OpenSearch
      const wikiRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=tourist%20attractions%20in%20${encodeURIComponent(query)}&utf8=&format=json&origin=*`
      );
      
      let landmarks: string[] = [query]; // Always include the main destination
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const topAttractions = wikiData.query.search
          .map((s: any) => s.title)
          .filter((title: string) => !title.toLowerCase().includes('list of') && title.toLowerCase() !== query.toLowerCase())
          .slice(0, 4); // Take up to 4 additional landmarks
          
        landmarks = [...landmarks, ...topAttractions];
      }

      // Step 2: Fetch factual primary images for these Wikipedia pages
      const titlesGroup = landmarks.map(t => encodeURIComponent(t)).join('|');
      const imgRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${titlesGroup}&format=json&pithumbsize=1200&origin=*`
      );
      
      if (!imgRes.ok) throw new Error('Failed to fetch Wikipedia images');
      
      const imgData = await imgRes.json();
      const pages = imgData.query?.pages || {};
      
      const results: PlaceImage[] = Object.values(pages)
        .filter((page: any) => page.thumbnail && page.thumbnail.source)
        .map((page: any) => ({
          id: String(page.pageid),
          urls: {
            regular: page.thumbnail.source,
            small: page.thumbnail.source,
          },
          alt_description: page.title,
          attribution: {
            name: 'Wikipedia',
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`
          },
          landmarkName: page.title
        }));

      if (results.length === 0) {
        setError('No accurate photos found for this destination.');
      } else {
        setImages(results);
        localStorage.setItem(cacheKey, JSON.stringify(results));
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('Error loading destination images. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (placeName) {
      fetchImages(placeName);
    }
  }, [placeName, fetchImages]);

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!placeName) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-8 right-64 z-[2000] w-72 md:w-80 lg:w-96 overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 border border-black/10 dark:border-white/10"
    >
      <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {/* Header Overlay */}
        <div className="absolute top-0 inset-x-0 z-10 p-3 flex flex-col justify-start bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-white text-sm font-semibold truncate pr-8">{placeName}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors pointer-events-auto shrink-0"
            >
              <X size={16} />
            </button>
          </div>
          {!loading && images[currentIndex]?.landmarkName && (
            <p className="text-xs text-white/90 truncate mt-0.5 font-medium">
              {images[currentIndex].landmarkName}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="h-full flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-blue-500" size={24} />
              <span className="text-xs text-zinc-500">Discovering tourist areas...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <ImageIcon className="text-zinc-400" size={32} />
              <p className="text-xs text-zinc-500">{error}</p>
            </div>
          ) : (
            <div className="relative w-full h-full group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={images[currentIndex]?.id}
                  src={images[currentIndex]?.urls.regular}
                  alt={images[currentIndex]?.alt_description || placeName}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => prevImage(e)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => nextImage(e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Progress Dots */}
              <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentIndex ? 'w-5 bg-white shadow-sm' : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>


            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
