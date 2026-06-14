import {
  calculateCollateralUsd,
  calculateHealthFactor,
  calculateLtv,
  calculateMonthlyInterest,
  optimizeToTargetLtv,
} from './calculations'
import { LLTV, RISK_PROFILES } from './constants'
import { generateId } from './utils'
import type { Playbook, PlaybookMonth, Position, RiskProfile, UserSettings } from './types'

export function generatePlaybook(
  position: Position,
  settings: UserSettings,
  borrowApy: number,
  lltv: number = LLTV,
): Playbook {
  const profile = RISK_PROFILES[settings.riskProfile]
  const targetLtv = settings.targetLtv || profile.targetLtv
  const months: PlaybookMonth[] = []
  const horizon = Math.min(settings.timeHorizonYears * 12, 60)
  const netSurplus = settings.monthlyIncome - settings.monthlyExpenses

  let collateralBtc = position.collateralBtc
  let debtUsdc = position.debtUsdc
  let btcPrice = position.btcPrice

  const monthlyCagr = Math.pow(1 + settings.btcCagr, 1 / 12) - 1

  for (let m = 1; m <= horizon; m++) {
    btcPrice *= 1 + monthlyCagr
    const monthlyInterest = calculateMonthlyInterest(debtUsdc, borrowApy)
    debtUsdc += monthlyInterest

    let borrowNeeded = 0
    let collateralToAdd = 0
    let repayAmount = 0
    let action = 'Hold'
    let notes = 'Position within target band'

    if (settings.includeMinedBtc) {
      collateralToAdd += settings.monthlyMinedBtc
      collateralBtc += settings.monthlyMinedBtc
    }

    if (netSurplus < 0) {
      borrowNeeded = Math.abs(netSurplus)
      const collateralUsd = calculateCollateralUsd(collateralBtc, btcPrice)
      const available = collateralUsd * lltv - debtUsdc
      borrowNeeded = Math.min(borrowNeeded, Math.max(0, available))
      debtUsdc += borrowNeeded
      action = 'Borrow for expenses'
      notes = `Draw ${borrowNeeded.toFixed(0)} USDC to cover monthly deficit`
    } else if (netSurplus > 0) {
      const collateralUsd = calculateCollateralUsd(collateralBtc, btcPrice)
      const currentLtv = calculateLtv(debtUsdc, collateralUsd)

      if (currentLtv > settings.rebalanceThreshold) {
        repayAmount = Math.min(netSurplus, debtUsdc * 0.15)
        debtUsdc -= repayAmount
        action = 'Repay debt'
        notes = `LTV above threshold — repay ${repayAmount.toFixed(0)} USDC`
      } else if (currentLtv < targetLtv - 10) {
        const optimization = optimizeToTargetLtv(
          collateralBtc,
          debtUsdc,
          btcPrice,
          targetLtv,
          lltv,
        )
        if (optimization.action === 'borrow') {
          borrowNeeded = Math.min(optimization.amount, netSurplus)
          debtUsdc += borrowNeeded
          const btcBought = borrowNeeded / btcPrice
          collateralToAdd += btcBought
          collateralBtc += btcBought
          action = 'Borrow & stack'
          notes = `Borrow ${borrowNeeded.toFixed(0)} USDC, buy ${btcBought.toFixed(4)} cbBTC`
        }
      } else {
        const btcToAdd = (netSurplus * 0.5) / btcPrice
        collateralToAdd += btcToAdd
        collateralBtc += btcToAdd
        repayAmount = netSurplus * 0.5
        debtUsdc = Math.max(0, debtUsdc - repayAmount)
        action = 'Grow & deleverage'
        notes = `Split surplus: ${btcToAdd.toFixed(4)} BTC collateral + ${repayAmount.toFixed(0)} USDC repay`
      }
    }

    const collateralUsd = calculateCollateralUsd(collateralBtc, btcPrice)
    const projectedLtv = calculateLtv(debtUsdc, collateralUsd)
    const projectedHf = calculateHealthFactor(collateralUsd, debtUsdc, lltv)

    months.push({
      month: m,
      borrowNeeded,
      collateralToAdd,
      repayAmount,
      projectedLtv,
      projectedHf,
      action,
      notes,
    })
  }

  const recommendation = generateRecommendation(position, settings, borrowApy, lltv)

  return {
    id: generateId(),
    createdAt: Date.now(),
    riskProfile: settings.riskProfile,
    months,
    recommendation,
  }
}

function generateRecommendation(
  position: Position,
  settings: UserSettings,
  borrowApy: number,
  lltv: number,
): string {
  const profile = RISK_PROFILES[settings.riskProfile]
  const targetLtv = settings.targetLtv || profile.targetLtv
  const collateralUsd = calculateCollateralUsd(position.collateralBtc, position.btcPrice)
  const currentLtv = calculateLtv(position.debtUsdc, collateralUsd)
  const netSurplus = settings.monthlyIncome - settings.monthlyExpenses
  const monthlyInterest = calculateMonthlyInterest(position.debtUsdc, borrowApy)

  if (currentLtv > settings.rebalanceThreshold) {
    const optimization = optimizeToTargetLtv(
      position.collateralBtc,
      position.debtUsdc,
      position.btcPrice,
      targetLtv,
      lltv,
    )
    return `⚠️ LTV at ${currentLtv.toFixed(1)}% exceeds your ${settings.rebalanceThreshold}% threshold. ${optimization.description}`
  }

  if (netSurplus < 0) {
    const deficit = Math.abs(netSurplus) + monthlyInterest
    const borrowPower = collateralUsd * lltv - position.debtUsdc
    if (deficit > borrowPower) {
      return `Monthly deficit of ${deficit.toFixed(0)} USDC exceeds borrow power. Consider adding collateral or reducing expenses.`
    }
    return `Cover ${deficit.toFixed(0)} USDC/month (${Math.abs(netSurplus).toFixed(0)} expenses + ${monthlyInterest.toFixed(0)} interest) via borrow to maintain lifestyle without selling BTC.`
  }

  if (currentLtv < targetLtv - 15) {
    const optimization = optimizeToTargetLtv(
      position.collateralBtc,
      position.debtUsdc,
      position.btcPrice,
      targetLtv,
      lltv,
    )
    return `You have room to optimize. ${optimization.description}. Surplus of ${netSurplus.toFixed(0)} USDC/month available.`
  }

  return `Position healthy at ${currentLtv.toFixed(1)}% LTV. Continue monitoring. Monthly interest: ${monthlyInterest.toFixed(0)} USDC.`
}

export function applyRiskProfile(profile: RiskProfile): Partial<UserSettings> {
  const p = RISK_PROFILES[profile]
  return {
    riskProfile: profile,
    targetLtv: p.targetLtv,
    rebalanceThreshold: p.rebalanceThreshold,
    crashResilience: p.crashResilience,
  }
}