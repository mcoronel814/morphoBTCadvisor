import { LLTV } from './constants'
import type { Position, PositionMetrics } from './types'

/**
 * LTV (%) = (borrowed USDC value / collateral cbBTC value in USDC) × 100
 */
export function calculateLtv(debtUsd: number, collateralUsd: number): number {
  if (collateralUsd <= 0) return debtUsd > 0 ? 100 : 0
  return (debtUsd / collateralUsd) * 100
}

/**
 * Health Factor = (collateral value in USDC × LLTV) / borrowed USDC value
 * HF > 1.0 = healthy; HF ≤ 1.0 = liquidatable
 */
export function calculateHealthFactor(
  collateralUsd: number,
  debtUsd: number,
  lltv: number = LLTV,
): number {
  if (debtUsd <= 0) return Infinity
  return (collateralUsd * lltv) / debtUsd
}

export function calculateCollateralUsd(collateralBtc: number, btcPrice: number): number {
  return collateralBtc * btcPrice
}

export function calculateBorrowPowerAvailable(
  collateralUsd: number,
  debtUsd: number,
  lltv: number = LLTV,
): number {
  const maxBorrow = collateralUsd * lltv
  return Math.max(0, maxBorrow - debtUsd)
}

export function calculateMonthlyInterest(debtUsd: number, borrowApy: number): number {
  return (debtUsd * borrowApy) / 12
}

/**
 * Distance to liquidation: % BTC price drop tolerable at current debt
 * At liquidation: debt = collateral * price * LLTV → price_liq = debt / (collateral * LLTV)
 */
export function calculateDistanceToLiquidation(
  collateralBtc: number,
  debtUsd: number,
  btcPrice: number,
  lltv: number = LLTV,
): number {
  if (collateralBtc <= 0 || btcPrice <= 0) return 0
  const liquidationPrice = debtUsd / (collateralBtc * lltv)
  if (liquidationPrice >= btcPrice) return 0
  return ((btcPrice - liquidationPrice) / btcPrice) * 100
}

export function calculateMetrics(
  position: Position,
  borrowApy: number,
  lltv: number = LLTV,
): PositionMetrics {
  const collateralUsd = calculateCollateralUsd(position.collateralBtc, position.btcPrice)
  const debtUsd = position.debtUsdc
  const ltv = calculateLtv(debtUsd, collateralUsd)
  const healthFactor = calculateHealthFactor(collateralUsd, debtUsd, lltv)

  return {
    collateralUsd,
    debtUsd,
    ltv,
    healthFactor,
    borrowPowerAvailable: calculateBorrowPowerAvailable(collateralUsd, debtUsd, lltv),
    monthlyInterest: calculateMonthlyInterest(debtUsd, borrowApy),
    distanceToLiquidation: calculateDistanceToLiquidation(
      position.collateralBtc,
      debtUsd,
      position.btcPrice,
      lltv,
    ),
    isHealthy: healthFactor > 1,
  }
}

export function getLtvZone(ltv: number): 'safe' | 'caution' | 'danger' | 'critical' {
  if (ltv < 50) return 'safe'
  if (ltv < 70) return 'caution'
  if (ltv < 80) return 'danger'
  return 'critical'
}

export function getLtvColor(ltv: number): string {
  const zone = getLtvZone(ltv)
  switch (zone) {
    case 'safe':
      return '#22c55e'
    case 'caution':
      return '#eab308'
    case 'danger':
      return '#f97316'
    case 'critical':
      return '#ef4444'
  }
}

export interface OptimizeResult {
  action: 'borrow' | 'repay' | 'add_collateral' | 'none'
  amount: number
  description: string
}

export function optimizeToTargetLtv(
  collateralBtc: number,
  debtUsdc: number,
  btcPrice: number,
  targetLtv: number,
  lltv: number = LLTV,
): OptimizeResult {
  const collateralUsd = calculateCollateralUsd(collateralBtc, btcPrice)
  const currentLtv = calculateLtv(debtUsdc, collateralUsd)
  const targetDebt = (targetLtv / 100) * collateralUsd

  if (Math.abs(currentLtv - targetLtv) < 0.5) {
    return { action: 'none', amount: 0, description: 'Already at target LTV' }
  }

  if (currentLtv > targetLtv) {
    const repayAmount = debtUsdc - targetDebt
    return {
      action: 'repay',
      amount: repayAmount,
      description: `Repay ${repayAmount.toFixed(0)} USDC to reach ${targetLtv}% LTV`,
    }
  }

  const borrowAmount = targetDebt - debtUsdc
  if (borrowAmount > calculateBorrowPowerAvailable(collateralUsd, debtUsdc, lltv)) {
    const neededCollateralBtc =
      (debtUsdc / (targetLtv / 100) - collateralUsd) / btcPrice
    return {
      action: 'add_collateral',
      amount: neededCollateralBtc,
      description: `Supply ${neededCollateralBtc.toFixed(4)} cbBTC to safely reach ${targetLtv}% LTV`,
    }
  }

  return {
    action: 'borrow',
    amount: borrowAmount,
    description: `Borrow ${borrowAmount.toFixed(0)} USDC to reach ${targetLtv}% LTV`,
  }
}

export function stressTestCrash(
  collateralBtc: number,
  debtUsdc: number,
  btcPrice: number,
  crashPercent: number,
  lltv: number = LLTV,
): {
  newBtcPrice: number
  newLtv: number
  newHf: number
  repayToTarget: (targetLtv: number) => number
  collateralToAdd: (targetLtv: number) => number
} {
  const newBtcPrice = btcPrice * (1 - crashPercent / 100)
  const newCollateralUsd = collateralBtc * newBtcPrice
  const newLtv = calculateLtv(debtUsdc, newCollateralUsd)
  const newHf = calculateHealthFactor(newCollateralUsd, debtUsdc, lltv)

  return {
    newBtcPrice,
    newLtv,
    newHf,
    repayToTarget: (targetLtv: number) => {
      const targetDebt = (targetLtv / 100) * newCollateralUsd
      return Math.max(0, debtUsdc - targetDebt)
    },
    collateralToAdd: (targetLtv: number) => {
      const neededCollateralUsd = debtUsdc / (targetLtv / 100)
      const additionalUsd = neededCollateralUsd - newCollateralUsd
      return Math.max(0, additionalUsd / newBtcPrice)
    },
  }
}