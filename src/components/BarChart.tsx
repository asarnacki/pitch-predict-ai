import type { PredictionProbabilities, UserChoice } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface BarChartProps {
  prediction: PredictionProbabilities;
  homeTeam: string;
  awayTeam: string;
  interactive?: boolean; // Default false - for display mode
  selectedChoice?: UserChoice | null; // Which bar is selected (for display mode)
  onChoiceSelect?: (choice: UserChoice) => void; // Called when user clicks a bar (interactive mode)
}

export function BarChart({
  prediction,
  homeTeam,
  awayTeam,
  interactive = false,
  selectedChoice = null,
  onChoiceSelect,
}: BarChartProps) {
  const t = useTranslation();
  const homePercent = Math.round(prediction.home * 100);
  const drawPercent = Math.round(prediction.draw * 100);
  const awayPercent = Math.round(prediction.away * 100);

  const handleBarClick = (choice: UserChoice) => {
    if (interactive && onChoiceSelect) {
      onChoiceSelect(choice);
    }
  };

  const getBarClasses = (choice: UserChoice, baseColor: string) => {
    const isSelected = selectedChoice === choice;
    const baseClasses = `h-full transition-all duration-150 ease-out rounded-full`;

    if (!interactive && !selectedChoice) {
      // Display mode without selection - normal bars
      return `${baseClasses} ${baseColor}`;
    }

    if (isSelected) {
      // Selected bar - full opacity with subtle scale
      return `${baseClasses} ${baseColor} opacity-100 scale-y-105`;
    }

    // Unselected bar - dimmed
    return `${baseClasses} ${baseColor} opacity-40`;
  };

  const getContainerClasses = () => {
    return `h-3 sm:h-4 bg-secondary rounded-full overflow-visible relative transition-all duration-150`;
  };

  const getLabelClasses = (choice: UserChoice) => {
    const isSelected = selectedChoice === choice;
    const baseClasses = "font-medium text-xs sm:text-sm transition-all duration-150";

    if (!interactive && !selectedChoice) {
      return baseClasses;
    }

    return `${baseClasses} ${isSelected ? "font-bold" : "opacity-60"}`;
  };

  const getPercentageClasses = (choice: UserChoice, color: string) => {
    const isSelected = selectedChoice === choice;
    const baseClasses = `font-bold text-sm sm:text-base flex-shrink-0 transition-all duration-150 ${color}`;

    if (!interactive && !selectedChoice) {
      return baseClasses;
    }

    return `${baseClasses} ${isSelected ? "scale-110" : "opacity-60"}`;
  };

  // Get classes for the entire row container (handles both selected state and hover)
  const getRowClasses = (choice: UserChoice) => {
    if (!interactive) return "";

    const isSelected = selectedChoice === choice;

    if (isSelected) {
      return "cursor-pointer border-2 border-primary rounded-lg bg-accent/5 shadow-sm transition-all duration-150";
    }

    return "cursor-pointer border-2 border-transparent rounded-lg hover:border-primary hover:bg-accent/10 hover:shadow-md hover:scale-[1.02] transition-all duration-150";
  };

  return (
    <div className="space-y-8 sm:space-y-9 lg:space-y-16">
      {/* Home Win */}
      <div
        className={`space-y-2 p-2 -mx-2 my-4 ${getRowClasses("home")}`}
        onClick={() => handleBarClick("home")}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={(e) => {
          if (interactive && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleBarClick("home");
          }
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={`${getLabelClasses("home")} truncate`}>
            {homeTeam} ({t.predictions.ui.chart.homeWin})
          </span>
          <span className={getPercentageClasses("home", "text-primary")}>{homePercent}%</span>
        </div>
        <div className={getContainerClasses()}>
          <div className={getBarClasses("home", "bg-primary")} style={{ width: `${homePercent}%` }} />
        </div>
      </div>

      {/* Draw */}
      <div
        className={`space-y-2 p-2 -mx-2 my-4 ${getRowClasses("draw")}`}
        onClick={() => handleBarClick("draw")}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={(e) => {
          if (interactive && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleBarClick("draw");
          }
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={getLabelClasses("draw")}>{t.predictions.ui.chart.draw}</span>
          <span className={getPercentageClasses("draw", "text-blue-600 dark:text-blue-400")}>{drawPercent}%</span>
        </div>
        <div className={getContainerClasses()}>
          <div className={getBarClasses("draw", "bg-blue-600 dark:bg-blue-400")} style={{ width: `${drawPercent}%` }} />
        </div>
      </div>

      {/* Away Win */}
      <div
        className={`space-y-2 p-2 -mx-2 my-4 ${getRowClasses("away")}`}
        onClick={() => handleBarClick("away")}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={(e) => {
          if (interactive && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleBarClick("away");
          }
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={`${getLabelClasses("away")} truncate`}>
            {awayTeam} ({t.predictions.ui.chart.awayWin})
          </span>
          <span className={getPercentageClasses("away", "text-green-600 dark:text-green-400")}>{awayPercent}%</span>
        </div>
        <div className={getContainerClasses()}>
          <div
            className={getBarClasses("away", "bg-green-600 dark:bg-green-400")}
            style={{ width: `${awayPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
