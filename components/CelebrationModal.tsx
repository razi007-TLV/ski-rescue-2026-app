'use client';

import { useEffect, useMemo } from 'react';
import { PHOTOS } from '@/config';
import Image from 'next/image';

interface CelebrationModalProps {
  onClose: () => void;
}

const shownPhotos: Set<string> = new Set();

function getNextPhoto(): string {
  if (shownPhotos.size >= PHOTOS.length) {
    shownPhotos.clear();
  }
  const remaining = PHOTOS.filter((p) => !shownPhotos.has(p));
  const pick = remaining[Math.floor(Math.random() * remaining.length)];
  shownPhotos.add(pick);
  return pick;
}

export default function CelebrationModal({ onClose }: CelebrationModalProps) {
  const photo = useMemo(() => getNextPhoto(), []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-sm w-full animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="relative w-full aspect-[3/4]">
            <Image
              src={photo}
              alt="Ski vibes"
              fill
              className="object-cover"
              sizes="(max-width: 384px) 100vw, 384px"
              priority
            />
          </div>
          <div className="p-4 text-center">
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
              Added!
            </p>
            <button
              onClick={onClose}
              className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium touch-manipulation"
            >
              Tap anywhere to close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
