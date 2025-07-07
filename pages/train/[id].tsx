import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { TrainingPageZustand } from '@shared/pages/TrainingPageZustand';
import { EndgamePosition, getPositionById } from '@shared/data/endgames/index';

// Main page component - client-side only to avoid SSR issues
export default function TrainingPage() {
  const router = useRouter();
  const [position, setPosition] = useState<EndgamePosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      const id = Number(router.query.id);
      const pos = getPositionById(id);
      
      if (!pos) {
        router.push('/404');
        return;
      }
      
      setPosition(pos);
      setLoading(false);
    }
  }, [router.isReady, router.query.id, router]);

  if (loading || !position) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return <TrainingPageZustand position={position} />;
}