import React, { useState } from "react";
import Head from "next/head";
import { Chessboard } from "@shared/components/chess/Chessboard";
import { Chess } from "chess.js";

/**
 *
 */
const DialogShowcase: React.FC = () => {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<
    "error" | "success" | "warning" | "info"
  >("error");

  // Chess game state for background
  const [game] = useState(
    new Chess(
      "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    ),
  );

  const dialogVariants = [
    { id: "original", name: "Original (Current)" },
    { id: "lichess", name: "Lichess-Inspired Minimal" },
    { id: "coaching", name: "Coaching Style" },
    { id: "modern", name: "Modern Clean" },
    { id: "subtle", name: "Subtle Integrated" },
    { id: "material", name: "Material Design Inspired" },
    { id: "floating", name: "Floating Card" },
    { id: "glassmorphism", name: "Glassmorphism" },
    { id: "toast", name: "Toast Notification" },
    { id: "neobrutalism", name: "Neobrutalism" },
    { id: "gradient", name: "Gradient Glow" },
    { id: "animated", name: "Animated Entry" },
  ];

  const dialogTypes = [
    { id: "error", name: "Fehler", color: "red" },
    { id: "success", name: "Erfolg", color: "green" },
    { id: "warning", name: "Warnung", color: "amber" },
    { id: "info", name: "Info", color: "blue" },
  ];

  /**
   *
   */
  const getDialogContent = () => {
    switch (dialogType) {
      case "error":
        return {
          title: "Fehler erkannt!",
          message: "Dieser Zug verdirbt den Gewinn!",
          detail: "Bester Zug war: e4",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          ),
        };
      case "success":
        return {
          title: "Großartig!",
          message: "Perfekter Zug! Sie behalten den Vorteil.",
          detail: "Weiter so!",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
      case "warning":
        return {
          title: "Achtung!",
          message: "Dieser Zug ist spielbar, aber nicht optimal.",
          detail: "Überlegen Sie noch einmal.",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          ),
        };
      case "info":
        return {
          title: "Hinweis",
          message: "Die Tablebase zeigt mehrere gleichwertige Züge.",
          detail: "Ihre Wahl ist eine davon.",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
    }
  };

  const content = getDialogContent();

  return (
    <>
      <Head>
        <title>Dialog Design Showcase</title>
      </Head>

      <div className="min-h-screen bg-[var(--bg-primary)]">
        {/* Header wie in der echten App */}
        <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] py-4">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Chess Endgame Trainer - Dialog Showcase
            </h1>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 flex gap-4">
          {/* Left Panel - Like the real app */}
          <div className="w-80 space-y-4">
            {/* Type Selector */}
            <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
              <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                Meldungstyp auswählen:
              </h2>
              <div className="flex flex-wrap gap-2">
                {dialogTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setDialogType(type.id as any)}
                    className={`px-3 py-1.5 rounded font-medium text-sm transition-all ${
                      dialogType === type.id
                        ? type.id === "error"
                          ? "bg-red-900/30 text-red-400 border border-red-700"
                          : type.id === "success"
                            ? "bg-green-900/30 text-green-400 border border-green-700"
                            : type.id === "warning"
                              ? "bg-amber-900/30 text-amber-400 border border-amber-700"
                              : "bg-blue-900/30 text-blue-400 border border-blue-700"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-color)]"
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Dialog Selection */}
            <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
              <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                Dialog-Varianten:
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {dialogVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setActiveDialog(variant.id)}
                    className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded hover:border-[var(--text-muted)] transition-all text-left"
                  >
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {variant.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area - Chessboard */}
          <div className="flex-1">
            <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
              <div className="max-w-2xl mx-auto">
                <Chessboard
                  fen={game.fen()}
                  boardWidth={600}
                  arePiecesDraggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs as overlays - outside main container */}
      {/* Original Dialog */}
      {activeDialog === "original" && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 dialog-wrapper">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl max-w-md w-full mx-4 p-6 dialog-content">
            <div className="mb-4">
              <h3
                className={`text-lg font-semibold ${
                  dialogType === "error"
                    ? "text-red-400"
                    : dialogType === "success"
                      ? "text-green-400"
                      : dialogType === "warning"
                        ? "text-amber-400"
                        : "text-blue-400"
                } flex items-center gap-2`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {content.icon}
                </svg>
                {content.title}
              </h3>
              <p className="mt-2 text-base text-[var(--text-primary)]">
                {content.message}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {content.detail && <strong>{content.detail}</strong>}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setActiveDialog(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md hover:bg-[var(--bg-accent)] dialog-button transition-all"
              >
                Weiterspielen
              </button>
              {dialogType === "error" && (
                <>
                  <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dialog-button transition-all">
                    Zug zurücknehmen
                  </button>
                  <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 dialog-button transition-all">
                    Besten Zug zeigen
                  </button>
                </>
              )}
              <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dialog-button transition-all">
                Neu starten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lichess-Inspired Minimal */}
      {activeDialog === "lichess" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setActiveDialog(null)}
        >
          <div
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h3 className="text-base font-medium text-[var(--text-primary)]">
                Stellung geschwächt
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Dieser Zug gibt deinen Gewinnvorteil auf. Der beste Zug war{" "}
                <span className="font-medium text-[var(--text-primary)]">
                  e4
                </span>
                .
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setActiveDialog(null)}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-3 py-1.5"
              >
                Fortfahren
              </button>
              <button className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-md border border-[var(--border-color)] hover:bg-[var(--bg-accent)]">
                Zug zeigen
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm">
                Zurücknehmen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coaching Style */}
      {activeDialog === "coaching" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setActiveDialog(null)}
        >
          <div
            className="bg-[var(--bg-secondary)] border-2 border-amber-700 rounded-xl shadow-2xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-[var(--text-primary)]">
                    Moment der Reflexion
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Es gibt hier einen stärkeren Zug! In dieser Position war{" "}
                    <span className="font-semibold text-[var(--text-primary)] bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded">
                      e4
                    </span>{" "}
                    die beste Fortsetzung.
                  </p>
                </div>
              </div>

              <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-3 mb-4">
                <p className="text-xs text-[var(--text-muted)]">
                  Was möchten Sie tun?
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  Zug zurücknehmen
                </button>
                <button className="w-full px-4 py-2.5 text-sm font-medium text-blue-400 bg-blue-900/30 border border-blue-700 rounded-lg hover:bg-blue-900/40">
                  Zeig mir den besten Zug
                </button>
                <button
                  onClick={() => setActiveDialog(null)}
                  className="w-full px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  Mit meinem Zug fortfahren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Clean */}
      {activeDialog === "modern" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={() => setActiveDialog(null)}
        >
          <div
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Analyse
              </h3>
            </div>
            <div className="p-6 bg-[var(--bg-tertiary)]">
              <p className="text-[var(--text-primary)] mb-3">
                Ein stärkerer Zug war verfügbar:
              </p>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 mb-6 text-center shadow-sm">
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  ♘e4
                </span>
              </div>
              <div className="space-y-2">
                <button className="w-full px-4 py-2.5 text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg">
                  Zurücknehmen
                </button>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-accent)] text-sm shadow-sm">
                    Analyse
                  </button>
                  <button
                    onClick={() => setActiveDialog(null)}
                    className="flex-1 px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-sm"
                  >
                    Fortfahren
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Integrated */}
      {activeDialog === "subtle" && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="fixed inset-0 bg-black bg-opacity-30"
            onClick={() => setActiveDialog(null)}
          />
          <div className="relative bg-[var(--bg-secondary)] rounded-lg shadow-lg border-2 border-[var(--border-color)] max-w-xs w-full mx-4 p-4">
            <button
              onClick={() => setActiveDialog(null)}
              className="absolute top-2 right-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-blue-100 rounded">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-[var(--text-primary)]">
                  <span className="font-medium bg-yellow-900/30 text-yellow-400 px-1 rounded">
                    e4
                  </span>{" "}
                  war präziser
                </p>
                <div className="mt-3 flex gap-2">
                  <button className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm">
                    Zurück
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100">
                    Zeigen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Design Inspired */}
      {activeDialog === "material" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={() => setActiveDialog(null)}
        >
          <div
            className="bg-[var(--bg-secondary)] rounded-lg shadow-2xl border border-[var(--border-color)] max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-medium text-[var(--text-primary)] mb-4">
                Überdenken Sie Ihren Zug
              </h3>
              <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                In dieser Stellung hätte{" "}
                <span className="font-medium text-[var(--text-primary)] bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded">
                  e4
                </span>{" "}
                Ihren Vorteil bewahrt.
              </p>
              <div className="bg-[var(--bg-tertiary)] border-l-4 border-blue-500 p-3 mb-6">
                <p className="text-xs text-[var(--text-muted)]">EMPFEHLUNG</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setActiveDialog(null)}
                  className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded uppercase tracking-wider"
                >
                  Weiter
                </button>
                <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded uppercase tracking-wider">
                  Zeigen
                </button>
                <button className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 shadow-md hover:shadow-lg uppercase tracking-wider">
                  Zurück
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Card */}
      {activeDialog === "floating" && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="fixed inset-0"
            onClick={() => setActiveDialog(null)}
          />
          <div
            className="relative bg-[var(--bg-secondary)] rounded-2xl shadow-2xl max-w-sm w-full p-1 transform hover:scale-105 transition-transform duration-300"
            style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
          >
            <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Trainingshinweis
                  </p>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Besserer Zug verfügbar
                  </h3>
                </div>
                <button
                  onClick={() => setActiveDialog(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  Die Engine empfiehlt in dieser Stellung:
                </p>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
                    <span className="text-2xl">♘</span>
                  </div>
                  <div>
                    <p className="font-bold text-xl text-[var(--text-primary)]">
                      e4
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Springerzug
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-accent)] hover:scale-105 transition-all">
                  Analyse zeigen
                </button>
                <button className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 hover:scale-105 transition-all shadow-lg">
                  Zurücknehmen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphism */}
      {activeDialog === "glassmorphism" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setActiveDialog(null)}
        >
          <div
            className="bg-[var(--bg-secondary)] bg-opacity-90 rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 border-2 border-[var(--border-color)] border-opacity-50"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              backdropFilter: "blur(10px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500 bg-opacity-20 text-amber-700 rounded-full text-xs font-medium mb-3 border border-amber-300">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 12H7v-2h2v2zm0-3H7V5h2v4z" />
                </svg>
                Tipp
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Zug-Empfehlung
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Die Analyse zeigt einen stärkeren Zug in dieser Position.
              </p>
            </div>

            <div className="bg-[var(--bg-tertiary)] bg-opacity-50 rounded-xl p-4 mb-5 border border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">
                  Empfohlener Zug:
                </span>
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  ♘e4
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveDialog(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                Ignorieren
              </button>
              <button className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-tertiary)] bg-opacity-70 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-accent)] hover:bg-opacity-90 shadow-sm">
                Zeigen
              </button>
              <button className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md">
                Zurück
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {activeDialog === "toast" && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`${
              dialogType === "error"
                ? "bg-red-600"
                : dialogType === "success"
                  ? "bg-green-600"
                  : dialogType === "warning"
                    ? "bg-amber-500"
                    : "bg-blue-600"
            } text-white rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 hover:scale-105`}
            style={{ animation: "slideUp 300ms ease-out" }}
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {content.icon}
              </svg>
              <div className="flex-1">
                <h4 className="font-medium">{content.title}</h4>
                <p className="text-sm opacity-90 mt-1">{content.message}</p>
                {content.detail && (
                  <p className="text-xs opacity-75 mt-2">{content.detail}</p>
                )}
              </div>
              <button
                onClick={() => setActiveDialog(null)}
                className="text-white/70 hover:text-white ml-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {dialogType === "error" && (
              <div className="flex gap-2 mt-3">
                <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded transition-colors">
                  Zurücknehmen
                </button>
                <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded transition-colors">
                  Zeigen
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Neobrutalism */}
      {activeDialog === "neobrutalism" && (
        <div
          className="fixed inset-0 bg-yellow-300 bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setActiveDialog(null)}
        >
          <div
            className="bg-[var(--bg-secondary)] border-4 border-[var(--text-primary)] shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] max-w-md w-full mx-4 p-6 transform hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.2)] transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`inline-block px-3 py-1 -mt-10 -ml-2 font-bold text-white ${
                dialogType === "error"
                  ? "bg-red-600"
                  : dialogType === "success"
                    ? "bg-green-600"
                    : dialogType === "warning"
                      ? "bg-orange-500"
                      : "bg-blue-600"
              } border-4 border-black`}
            >
              {dialogType.toUpperCase()}
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase">
                {content.title}
              </h3>
              <p className="mt-3 text-lg text-[var(--text-primary)] font-medium">
                {content.message}
              </p>
              {content.detail && (
                <p className="mt-2 text-[var(--text-primary)] bg-yellow-900/30 border-2 border-yellow-700 p-2 font-mono">
                  {content.detail}
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setActiveDialog(null)}
                className="flex-1 px-4 py-3 font-bold text-[var(--text-primary)] bg-[var(--bg-tertiary)] border-4 border-[var(--border-color)] hover:bg-[var(--bg-accent)] transform hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all"
              >
                OK
              </button>
              {dialogType === "error" && (
                <button className="flex-1 px-4 py-3 font-bold text-white bg-black border-4 border-black hover:bg-gray-800 transform hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all">
                  ZURÜCK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gradient Glow */}
      {activeDialog === "gradient" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setActiveDialog(null)}
        >
          <div
            className={`relative bg-gradient-to-br ${
              dialogType === "error"
                ? "from-red-500 to-pink-600"
                : dialogType === "success"
                  ? "from-green-500 to-emerald-600"
                  : dialogType === "warning"
                    ? "from-amber-500 to-orange-600"
                    : "from-blue-500 to-purple-600"
            } p-1 rounded-2xl max-w-md w-full mx-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-900 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-3 rounded-full bg-gradient-to-br ${
                    dialogType === "error"
                      ? "from-red-400 to-pink-500"
                      : dialogType === "success"
                        ? "from-green-400 to-emerald-500"
                        : dialogType === "warning"
                          ? "from-amber-400 to-orange-500"
                          : "from-blue-400 to-purple-500"
                  }`}
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {content.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {content.title}
                </h3>
              </div>
              <p className="text-gray-300 mb-2">{content.message}</p>
              {content.detail && (
                <p className="text-gray-400 text-sm mb-4">{content.detail}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveDialog(null)}
                  className="flex-1 px-4 py-2 text-white bg-white/10 backdrop-blur rounded-lg hover:bg-white/20 transition-all"
                >
                  Verstanden
                </button>
                {dialogType === "error" && (
                  <button
                    className={`flex-1 px-4 py-2 text-white bg-gradient-to-r ${
                      dialogType === "error"
                        ? "from-red-500 to-pink-600"
                        : "from-blue-500 to-purple-600"
                    } rounded-lg hover:shadow-lg transform hover:scale-105 transition-all`}
                  >
                    Aktion
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated Entry */}
      {activeDialog === "animated" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setActiveDialog(null)}
        >
          <div
            className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "scaleIn 400ms cubic-bezier(0.16, 1, 0.3, 1)",
              transformOrigin: "center center",
            }}
          >
            <div
              className={`h-2 bg-gradient-to-r ${
                dialogType === "error"
                  ? "from-red-500 to-red-600"
                  : dialogType === "success"
                    ? "from-green-500 to-green-600"
                    : dialogType === "warning"
                      ? "from-amber-500 to-amber-600"
                      : "from-blue-500 to-blue-600"
              }`}
            />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-full ${
                    dialogType === "error"
                      ? "bg-red-100"
                      : dialogType === "success"
                        ? "bg-green-100"
                        : dialogType === "warning"
                          ? "bg-amber-100"
                          : "bg-blue-100"
                  } transform transition-transform hover:rotate-12`}
                >
                  <svg
                    className={`w-6 h-6 ${
                      dialogType === "error"
                        ? "text-red-600"
                        : dialogType === "success"
                          ? "text-green-600"
                          : dialogType === "warning"
                            ? "text-amber-600"
                            : "text-blue-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {content.icon}
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {content.title}
                  </h3>
                  <p className="mt-2 text-[var(--text-secondary)]">
                    {content.message}
                  </p>
                  {content.detail && (
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      {content.detail}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-6 justify-end">
                <button
                  onClick={() => setActiveDialog(null)}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all transform hover:scale-105"
                >
                  Abbrechen
                </button>
                <button
                  className={`px-5 py-2 text-white rounded-lg transition-all transform hover:scale-105 hover:shadow-lg ${
                    dialogType === "error"
                      ? "bg-red-600 hover:bg-red-700"
                      : dialogType === "success"
                        ? "bg-green-600 hover:bg-green-700"
                        : dialogType === "warning"
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {dialogType === "error" ? "Zurücknehmen" : "Bestätigen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DialogShowcase;
