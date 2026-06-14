import {
  calculateCollateralUsd,
  calculateHealthFactor,
  calculateLtv,
  calculateMonthlyInterest,
} from './calculations'
import { LLTV } from './constants'
import { powerLawPriceAtMonthOffset, type PowerLawBand } from './power-law'
import type { SimulationMonth, SimulationScenario, UserSettings } from './types'

export interface SimulationInput {
  collateralBtc: number
  debtUsdc: number
  btcPrice: number
  borrowApy: number
  settings: UserSettings
  targetLtv: number
  lltv?: number
  powerLawBand?: PowerLawBand
  simulationStartDate?: Date
}

function monthlyCagrRate(annualCagr: number): number {
  return Math.pow(1 + annualCagr, 1 / 12) - 1
}

export function runSimulation(
  input: SimulationInput,
  name: string,
  color: string,
): SimulationScenario {
  const {
    collateralBtc: startCollateral,
    debtUsdc: startDebt,
    btcPrice: startPrice,
    borrowApy,
    settings,
    targetLtv,
    lltv = LLTV,
    powerLawBand,
    simulationStartDate = new Date(),
  } = input

  const usePowerLaw = settings.simulationMode === 'power-law' && powerLawBand

  const months: SimulationMonth[] = []
  const totalMonths = settings.timeHorizonYears * 12
  const monthlyCagr = monthlyCagrRate(settings.btcCagr)
  const netSurplus = settings.monthlyIncome - settings.monthlyExpenses

  let collateralBtc = startCollateral
  let debtUsdc = startDebt
  let btcPrice = startPrice
  let cumulativeInterest = 0

  for (let m = 1; m <= totalMonths; m++) {
    if (usePowerLaw) {
      btcPrice = powerLawPriceAtMonthOffset(m, powerLawBand, simulationStartDate)
    } else {
      btcPrice *= 1 + monthlyCagr
    }

    const monthlyInterest = calculateMonthlyInterest(debtUsdc, borrowApy)
    debtUsdc += monthlyInterest
    cumulativeInterest += monthlyInterest

    if (settings.includeMinedBtc) {
      collateralBtc += settings.monthlyMinedBtc
    }

    if (netSurplus > 0) {
      const collateralUsd = calculateCollateralUsd(collateralBtc, btcPrice)
      const currentLtv = calculateLtv(debtUsdc, collateralUsd)

      if (currentLtv < targetLtv - 5) {
        const borrowAmount = Math.min(netSurplus, collateralUsd * (lltv) - debtUsdc)
        if (borrowAmount > 0) {
          debtUsdc += borrowAmount
          const btcToBuy = borrowAmount / btcPrice
          collateralBtc += btcToBuy
        }
      } else if (currentLtv > targetLtv + 5) {
        const repayAmount = Math.min(netSurplus, debtUsdc * 0.1)
        debtUsdc = Math.max(0, debtUsdc - repayAmount)
      }
    } else if (netSurplus < 0) {
      const expenseGap = Math.abs(netSurplus)
      const collateralUsd = calculateCollateralUsd(collateralBtc, btcPrice)
      const maxBorrow = collateralUsd * lltv - debtUsdc

      if (maxBorrow >= expenseGap) {
        debtUsdc += expenseGap
      } else {
        debtUsdc += maxBorrow
      }
    }

    const collateralUsd = calculateCollateralUsd(collateralBtc, btcPrice)
    const ltv = calculateLtv(debtUsdc, collateralUsd)
    const healthFactor = calculateHealthFactor(collateralUsd, debtUsdc, lltv)
    const netEquity = collateralUsd - debtUsdc

    months.push({
      month: m,
      btcPrice,
      collateralBtc,
      debtUsdc,
      ltv,
      healthFactor,
      interestPaid: monthlyInterest,
      cumulativeInterest,
      netEquity,
    })
  }

  const last = months[months.length - 1]

  return {
    name,
    color,
    months,
    finalBtc: last?.collateralBtc ?? startCollateral,
    finalEquity: last?.netEquity ?? 0,
    totalInterest: last?.cumulativeInterest ?? 0,
  }
}

export function runStressTestAtMonth(
  scenario: SimulationScenario,
  crashPercent: number,
  month: number,
): SimulationMonth {
  const base = scenario.months.find((m) => m.month === month) ?? scenario.months[0]
  const crashedPrice = base.btcPrice * (1 - crashPercent / 100)
  const collateralUsd = base.collateralBtc * crashedPrice
  const ltv = calculateLtv(base.debtUsdc, collateralUsd)
  const healthFactor = calculateHealthFactor(collateralUsd, base.debtUsdc)

  return {
    ...base,
    btcPrice: crashedPrice,
    ltv,
    healthFactor,
    netEquity: collateralUsd - base.debtUsdc,
  }
}

export function compareStrategies(input: SimulationInput): SimulationScenario[] {
  if (input.settings.simulationMode === 'power-law') {
    return comparePowerLawStrategies(input)
  }
  return [
    runSimulation({ ...input, targetLtv: 0 }, 'No Leverage', '#94a3b8'),
    runSimulation({ ...input, targetLtv: 35 }, 'Conservative', '#22c55e'),
    runSimulation({ ...input, targetLtv: 50 }, 'Balanced', '#3b82f6'),
    runSimulation({ ...input, targetLtv: 65 }, 'Aggressive', '#f7931a'),
  ]
}

export function comparePowerLawStrategies(input: SimulationInput): SimulationScenario[] {
  return [
    runSimulation(
      { ...input, targetLtv: 35, powerLawBand: 'floor' },
      'Floor (Support)',
      '#166534',
    ),
    runSimulation(
      { ...input, targetLtv: 50, powerLawBand: 'fair' },
      'Fair (Regression)',
      '#3b82f6',
    ),
    runSimulation(
      { ...input, targetLtv: 65, powerLawBand: 'ceiling' },
      'Ceiling (Resistance)',
      '#f7931a',
    ),
  ]
}

export function buildPowerLawPriceChartData(
  totalMonths: number,
  startDate: Date = new Date(),
): Array<{ month: number; floor: number; fair: number; ceiling: number }> {
  return Array.from({ length: totalMonths }, (_, i) => {
    const month = i + 1
    return {
      month,
      floor: powerLawPriceAtMonthOffset(month, 'floor', startDate),
      fair: powerLawPriceAtMonthOffset(month, 'fair', startDate),
      ceiling: powerLawPriceAtMonthOffset(month, 'ceiling', startDate),
    }
  })
}