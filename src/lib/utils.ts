import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LEAGUE_NAME_TO_CODE } from "../types";

/**
 * Merges Tailwind CSS classes
 * @param inputs - Array of class values
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets the code for a given league name
 * @param leagueName - Name of the league
 * @returns Code for the league
 */
export function getLeagueCodeFromName(leagueName: string): string {
  return LEAGUE_NAME_TO_CODE[leagueName];
}
