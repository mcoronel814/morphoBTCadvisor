import type { Playbook } from './types'

export function exportPlaybookJson(playbook: Playbook): void {
  downloadJson(`morpho-btc-playbook-${playbook.id}.json`, playbook)
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