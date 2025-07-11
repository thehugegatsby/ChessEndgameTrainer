import React from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import { TrainingPageZustand } from '@shared/pages/TrainingPageZustand';
import { EndgamePosition } from '@shared/types';
import { positionService } from '@shared/services/database/positionService';

interface TrainingPageProps {
  position: EndgamePosition | null;
}

export default function TrainingPage({ position }: TrainingPageProps) {
  const router = useRouter();

  // Handle fallback state for ISR
  if (router.isFallback) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading training position...</div>
      </div>
    );
  }

  // This should not happen with proper getStaticProps, but kept for safety
  if (!position) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Position not found</div>
      </div>
    );
  }

  return <TrainingPageZustand position={position} />;
}

export const getStaticPaths: GetStaticPaths = async () => {
  // For now, pre-generate pages for the first 20 positions (most popular)
  // As we scale to 1000-10000 positions, we'll adjust this
  const popularPositionIds = Array.from({ length: Math.min(20, 13) }, (_, i) => i + 1);
  
  const paths = popularPositionIds.map(id => ({
    params: { id: id.toString() }
  }));

  return {
    paths,
    fallback: true // Enable ISR for positions not pre-generated
  };
};

export const getStaticProps: GetStaticProps<TrainingPageProps> = async ({ params }) => {
  if (!params?.id) {
    return { notFound: true };
  }

  const id = Number(params.id);
  
  if (isNaN(id)) {
    return { notFound: true };
  }

  try {
    const position = await positionService.getPosition(id);
    
    if (!position) {
      return { notFound: true };
    }

    return {
      props: {
        position
      },
      // Revalidate every 24 hours (86400 seconds) since data changes rarely
      revalidate: 86400
    };
  } catch (error) {
    console.error('Error loading position in getStaticProps:', error);
    return { notFound: true };
  }
};