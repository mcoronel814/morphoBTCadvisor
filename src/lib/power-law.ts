/**
 * Giovanni Santostasi Bitcoin Power Law model.
 *
 * Price(t) = 10^(-16.493) × t^5.688
 * where t = days since genesis block (Jan 3, 2009)
 *
 * Bands (σ = 0.20):
 *   Fair (trend)  → Price(t)
 *   Floor (−2σ)   → Price(t) × 10^(-0.4)  ≈ 0.398× trend
 *   Ceiling (+2σ) → Price(t) × 10^(+0.4)  ≈ 2.512× trend
 *
 * Source: Santostasi power law research (R² ≈ 0.956 over 5,700+ daily closes).
 * Projections beyond ~2040 are extrapolation — treat as illustrative, not predictive.
 */

export const GENESIS_DATE = new Date(Date.UTC(2009, 0, 3))

/** Last year the model is commonly cited for long-range projections */
export const POWER_LAW_MAX_YEAR = 2040

export const POWER_LAW_PARAMS = {
  logA: -16.493,
  beta: 5.688,
  sigma: 0.2,
} as const

export type PowerLawBand = 'floor' | 'fair' | 'ceiling'

export const POWER_LAW_BANDS: Record<
  PowerLawBand,
  { label: string; shortLabel: string; description: string; multiplier: number }
> = {
  floor: {
    label: 'Floor (Support)',
    shortLabel: 'Floor',
    description: '−2σ support band. Historical price attractor; never sustainably breached.',
    multiplier: Math.pow(10, -2 * POWER_LAW_PARAMS.sigma),
  },
  fair: {
    label: 'Fair (Regression)',
    shortLabel: 'Fair',
    description: 'Central power-law trend. Long-term fair-value regression line.',
    multiplier: 1,
  },
  ceiling: {
    label: 'Ceiling (Resistance)',
    shortLabel: 'Ceiling',
    description: '+2σ resistance band. Upper corridor during bull cycles.',
    multiplier: Math.pow(10, 2 * POWER_LAW_PARAMS.sigma),
  },
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function daysSinceGenesis(date: Date): number {
  return Math.floor((date.getTime() - GENESIS_DATE.getTime()) / MS_PER_DAY)
}

export function powerLawTrendPrice(days: number): number {
  if (days <= 0) return 0
  const logTrend = POWER_LAW_PARAMS.logA + POWER_LAW_PARAMS.beta * Math.log10(days)
  return Math.pow(10, logTrend)
}

export function powerLawBandPrice(days: number, band: PowerLawBand): number {
  const trend = powerLawTrendPrice(days)
  return trend * POWER_LAW_BANDS[band].multiplier
}

export function powerLawPriceAtDate(date: Date, band: PowerLawBand): number {
  return powerLawBandPrice(daysSinceGenesis(date), band)
}

export function powerLawPriceAtMonthOffset(
  monthOffset: number,
  band: PowerLawBand,
  fromDate: Date = new Date(),
): number {
  const target = new Date(fromDate)
  target.setMonth(target.getMonth() + monthOffset)
  return powerLawPriceAtDate(target, band)
}

export function getPowerLawPricesToday(date: Date = new Date()): Record<PowerLawBand, number> {
  const days = daysSinceGenesis(date)
  return {
    floor: powerLawBandPrice(days, 'floor'),
    fair: powerLawBandPrice(days, 'fair'),
    ceiling: powerLawBandPrice(days, 'ceiling'),
  }
}

export function maxHorizonYearsTo2040(fromDate: Date = new Date()): number {
  const end = new Date(Date.UTC(POWER_LAW_MAX_YEAR, 11, 31))
  const years = (end.getTime() - fromDate.getTime()) / (MS_PER_DAY * 365.25)
  return Math.max(1, Math.ceil(years))
}

export function isBeyondPowerLawRange(years: number, fromDate: Date = new Date()): boolean {
  const target = new Date(fromDate)
  target.setFullYear(target.getFullYear() + years)
  return target.getFullYear() > POWER_LAW_MAX_YEAR
}

export function getPriceBandContext(currentPrice: number, date: Date = new Date()): {
  band: PowerLawBand | 'below-floor' | 'above-ceiling'
  ratioToFair: number
} {
  const prices = getPowerLawPricesToday(date)
  if (currentPrice < prices.floor) return { band: 'below-floor', ratioToFair: currentPrice / prices.fair }
  if (currentPrice > prices.ceiling) return { band: 'above-ceiling', ratioToFair: currentPrice / prices.fair }
  if (currentPrice < prices.fair) return { band: 'floor', ratioToFair: currentPrice / prices.fair }
  return { band: 'ceiling', ratioToFair: currentPrice / prices.fair }
}