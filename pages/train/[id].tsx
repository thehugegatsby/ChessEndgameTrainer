import React from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { TrainingPageZustand } from '@shared/pages/TrainingPageZustand';
import { EndgamePosition, allEndgamePositions, getPositionById } from '@shared/data/endgames/index';

interface TrainingPageProps {
  position: EndgamePosition;
}

// Main page component - now uses Zustand directly
export default function TrainingPage({ position }: TrainingPageProps) {
  return <TrainingPageZustand position={position} />;
}

// Static props generation
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = Number(params?.id);
  const position = getPositionById(id);

  if (!position) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      position,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = allEndgamePositions.map((position) => ({
    params: { id: position.id.toString() },
  }));

  return {
    paths,
    fallback: false,
  };
};