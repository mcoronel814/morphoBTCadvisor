import type { Playbook, Snapshot } from './types'

export function exportSnapshotsCsv(snapshots: Snapshot[]): void {
  const headers = [
    'Timestamp',
    'Date',
    'Collateral BTC',
    'Debt USDC',
    'BTC Price',
    'LTV %',
    'Health Factor',
    'Borrow APY',
  ]

  const rows = snapshots.map((s) => [
    s.timestamp,
    new Date(s.timestamp).toISOString(),
    s.collateralBtc,
    s.debtUsdc,
    s.btcPrice,
    s.ltv.toFixed(2),
    s.healthFactor === Infinity ? '∞' : s.healthFactor.toFixed(3),
    (s.borrowApy * 100).toFixed(2),
  ])

  downloadCsv('morpho-btc-snapshots.csv', [headers, ...rows])
}

export function exportSnapshotsJson(snapshots: Snapshot[]): void {
  downloadJson('morpho-btc-snapshots.json', snapshots)
}

export function exportPlaybookJson(playbook: Playbook): void {
  downloadJson(`morpho-btc-playbook-${playbook.id}.json`, playbook)
}

function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csv = rows.map((row) => row.join(',')).join('\n')
  downloadBlob(filename, csv, 'text/csv')
}

function downloadJson(filename: string, data: unknown): void {
  downloadBlob(filename, JSON.stringify(data, null, 2), 'application/json')
}

function downloadBlob(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function printReport(): void {
  window.print()
}