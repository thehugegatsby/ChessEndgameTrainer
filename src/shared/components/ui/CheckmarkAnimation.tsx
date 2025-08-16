/**
 * @file Checkmark Animation Component
 * @description Displays an animated checkmark overlay when position is completed
 */

import React from 'react';

interface CheckmarkAnimationProps {
  /** Whether the animation should be visible */
  isVisible: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * CheckmarkAnimation Component
 *
 * Displays a large animated checkmark that appears when a training position
 * is completed successfully. The animation includes a scale-up effect and
 * a brief glow.
 *
 * @param props - Component props
 * @returns JSX.Element
 */
export const CheckmarkAnimation: React.FC<CheckmarkAnimationProps> = ({
  isVisible,
  className = '',
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${className}`}
      data-testid="checkmark-animation"
    >
      {/* Background overlay with fade */}
      <div className="absolute inset-0 bg-black bg-opacity-20 animate-fadeIn"></div>

      {/* Checkmark container */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-green-400 opacity-30 animate-ping scale-150"></div>

        {/* Main checkmark */}
        <div
          className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-checkmarkScale shadow-2xl"
          style={{
            boxShadow: '0 0 40px rgba(34, 197, 94, 0.5)',
          }}
        >
          <svg
            className="w-12 h-12 text-white animate-checkmarkDraw"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
              strokeDasharray="20"
              strokeDashoffset="20"
              style={{
                animation: 'checkmarkDraw 0.5s ease-in-out 0.2s forwards',
              }}
            />
          </svg>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes checkmarkScale {
          0% {
            transform: scale(0) rotate(-180deg);
          }
          50% {
            transform: scale(1.2) rotate(0deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes checkmarkDraw {
          from {
            stroke-dashoffset: 20;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-checkmarkScale {
          animation: checkmarkScale 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .animate-checkmarkDraw {
          animation: checkmarkDraw 0.5s ease-in-out 0.2s forwards;
        }
      `}</style>
    </div>
  );
};
