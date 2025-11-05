import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { LEAGUE_NAME_TO_CODE } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLeagueCodeFromName(leagueName: string): string {
  return LEAGUE_NAME_TO_CODE[leagueName]
}