import React from 'react';
import { notFound } from 'next/navigation';
import dynamicImport from 'next/dynamic';
import { createInitialStateForPosition } from '@shared/store/server/createInitialState';
import { getServerPositionService } from '@shared/services/database/serverPositionService';
import { getLogger } from '@shared/services/logging';
import { ErrorService } from '@shared/services/ErrorService';

// Dynamically import the client page to reduce initial bundle
const ClientPage = dynamicImport(() => import('./ClientPage'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
    </div>
  ),
});

// Force dynamic rendering for this page - no static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

/**
 * Training page props
 */
interface TrainingPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Training page component
 * @param props - Component props
 * @param props.params - Route parameters
 * @returns Training page with position
 */
export default async function TrainingPage({
  params,
}: TrainingPageProps): Promise<React.JSX.Element> {
  const { id: paramId } = await params;
  const id = Number(paramId);

  if (isNaN(id)) {
    notFound();
  }

  const logger = getLogger().setContext('TrainingPage');

  try {
    logger.info('Loading position for ID', { id });
    const positionService = getServerPositionService();
    logger.info('Got position service', {
      serviceName: positionService.constructor.name,
    });
    const position = await positionService.getPosition(id);

    if (!position) {
      notFound();
    }

    // Generate the initial state on the server for SSR hydration
    logger.info('Creating initial state for position', { positionId: position.id });
    const initialStoreState = await createInitialStateForPosition(position);

    return <ClientPage initialState={initialStoreState} />;
  } catch (error) {
    logger.error('Failed to load training page', { error, positionId: id });
    ErrorService.handleNetworkError(error as Error, {
      component: 'train',
      action: 'load_position',
      additionalData: { positionId: id },
    });
    notFound();
  }
}

/**
 * Generate static paths for available test positions
 * @returns Array of position IDs
 */
export function generateStaticParams(): Array<{ id: string }> {
  // Use actual available position IDs
  const availablePositionIds = [1, 2]; // Only existing positions

  return availablePositionIds.map(id => ({
    id: id.toString(),
  }));
}
