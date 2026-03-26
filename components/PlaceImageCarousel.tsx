'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  alt_description: string;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

interface PlaceImageCarouselProps {
  placeName: string;
  onClose: () => void;
}

const CACHE_KEY_PREFIX = 'place_images_';
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || ''; // User should provide this

export default function PlaceImageCarousel({ placeName, onClose }: PlaceImageCarouselProps) {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);

    // Check cache
    const cacheKey = `${CACHE_KEY_PREFIX}${query.toLowerCase().replace(/\s+/g, '_')}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setImages(parsed);
        setLoading(false);
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
      return;
    }

    if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
      // Fallback/Mock data if no key is provided
      const mockImages: UnsplashImage[] = Array.from({ length: 5 }).map((_, i) => ({
        id: `mock-${i}`,
        urls: {
          regular: `https://picsum.photos/seed/${query}-${i}/800/600`,
          small: `https://picsum.photos/seed/${query}-${i}/400/300`,
        },
        alt_description: `Mock image for ${query}`,
        user: { name: 'Placeholder', links: { html: '#' } },
      }));
      setImages(mockImages);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query + ' travel landmarks'
        )}&per_page=5&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch images');

      const data = await response.json();
      const results = data.results as UnsplashImage[];

      if (results.length === 0) {
        setError('No images found for this place.');
      } else {
        setImages(results);
        localStorage.setItem(cacheKey, JSON.stringify(results));
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('Error loading images. Please try again later.');
      console.error(err);
    } finally {
      // Don't set loading to false if we aborted
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
        <div className="absolute top-0 inset-x-0 z-10 p-3 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <h3 className="text-white text-sm font-semibold truncate pr-8">{placeName}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors pointer-events-auto"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="h-full flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-blue-500" size={24} />
              <span className="text-xs text-zinc-500">Searching images...</span>
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
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => nextImage(e)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
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
                    className={`h-1 rounded-full transition-all ${
                      i === currentIndex ? 'w-4 bg-white' : 'w-1 bg-white/50'
                    }`}
                  />
                ))}
              </div>

              {/* Attribution */}
              {!loading && images[currentIndex] && (
                <div className="absolute bottom-0 right-0 p-1 px-2 text-[10px] text-white/70 bg-black/40 rounded-tl-lg backdrop-blur-sm">
                  Photo by{' '}
                  <a
                    href={images[currentIndex].user.links.html}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white"
                  >
                    {images[currentIndex].user.name}
                  </a>{' '}
                  on Unsplash
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
