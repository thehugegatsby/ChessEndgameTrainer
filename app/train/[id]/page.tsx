import React from "react";
import { notFound } from "next/navigation";
import { TrainingPageZustand } from "@shared/pages/TrainingPageZustand";
import { getServerPositionService } from "@shared/services/database/serverPositionService";
import { getLogger } from "@shared/services/logging";
import { ErrorService } from "@shared/services/errorService";

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
export default async function TrainingPage({ params }: TrainingPageProps) {
  const { id: paramId } = await params;
  const id = Number(paramId);

  if (isNaN(id)) {
    notFound();
  }

  const logger = getLogger().setContext("TrainingPage");

  try {
    logger.info("Loading position for ID", { id });
    const positionService = getServerPositionService();
    logger.info("Got position service", {
      serviceName: positionService.constructor.name,
    });
    const position = await positionService.getPosition(id);

    if (!position) {
      notFound();
    }

    return <TrainingPageZustand position={position} />;
  } catch (error) {
    ErrorService.handleNetworkError(error as Error, {
      component: "train",
      action: "load_position",
      additionalData: { positionId: id },
    });
    notFound();
  }
}

/**
 * Generate static paths for available test positions
 * @returns Array of position IDs
 */
export async function generateStaticParams() {
  // Use actual available position IDs from TestScenarios
  const availablePositionIds = [1, 9, 10, 11]; // Match TestPositions in TestScenarios.ts

  return availablePositionIds.map((id) => ({
    id: id.toString(),
  }));
}
