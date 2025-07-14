import React from 'react';
import { notFound } from 'next/navigation';
import { TrainingPageZustand } from '@shared/pages/TrainingPageZustand';
import { getServerPositionService } from '@shared/services/database/serverPositionService';
import { getLogger } from '@shared/services/logging';
import { ErrorService } from '@shared/services/errorService';

interface TrainingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TrainingPage({ params }: TrainingPageProps) {
  const { id: paramId } = await params;
  const id = Number(paramId);
  
  if (isNaN(id)) {
    notFound();
  }

  const logger = getLogger().setContext('TrainingPage');
  
  try {
    logger.info('Loading position for ID', { id });
    const positionService = getServerPositionService();
    logger.info('Got position service', { serviceName: positionService.constructor.name });
    const position = await positionService.getPosition(id);
    
    if (!position) {
      notFound();
    }

    return <TrainingPageZustand position={position} />;
  } catch (error) {
    ErrorService.handleNetworkError(error as Error, { component: 'train', action: 'load_position', additionalData: { positionId: id } });
    notFound();
  }
}

// Generate static paths for the first 20 positions
export async function generateStaticParams() {
  const popularPositionIds = Array.from({ length: Math.min(20, 13) }, (_, i) => i + 1);
  
  return popularPositionIds.map(id => ({
    id: id.toString()
  }));
}