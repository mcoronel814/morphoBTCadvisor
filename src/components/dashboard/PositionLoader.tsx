import { useAccount } from 'wagmi'
import { Loader2, Search, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/context/AppContext'
import { isValidAddress } from '@/lib/utils'

export function PositionLoader() {
  const { address, isConnected } = useAccount()
  const { loadFromWallet, loadManual, loading, error, market } = useApp()
  const [walletAddress, setWalletAddress] = useState('')
  const [collateralBtc, setCollateralBtc] = useState('')
  const [debtUsdc, setDebtUsdc] = useState('')
  const [btcPrice, setBtcPrice] = useState('')

  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address)
    }
  }, [isConnected, address])

  const handleWalletLoad = async () => {
    const addr = walletAddress.trim()
    if (!isValidAddress(addr)) return
    await loadFromWallet(addr)
  }

  const handleManualLoad = () => {
    const collateral = parseFloat(collateralBtc)
    const debt = parseFloat(debtUsdc)
    const price = btcPrice ? parseFloat(btcPrice) : undefined
    if (isNaN(collateral) || isNaN(debt)) return
    loadManual(collateral, debt, price)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Load Position</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wallet">
          <TabsList className="w-full">
            <TabsTrigger value="wallet" className="flex-1">
              <Wallet className="mr-1 h-4 w-4" />
              Wallet / Address
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1">
              Manual Input
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Wallet Address (Base)</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            </div>
            <Button
              onClick={handleWalletLoad}
              disabled={loading || !isValidAddress(walletAddress.trim())}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Load / Refresh Position
            </Button>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="collateral">cbBTC Collateral</Label>
                <Input
                  id="collateral"
                  type="number"
                  step="0.0001"
                  placeholder="0.5"
                  value={collateralBtc}
                  onChange={(e) => setCollateralBtc(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt">USDC Debt</Label>
                <Input
                  id="debt"
                  type="number"
                  step="1"
                  placeholder="25000"
                  value={debtUsdc}
                  onChange={(e) => setDebtUsdc(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">
                BTC Price Override (optional)
                {market?.oraclePrice ? ` — Oracle: $${market.oraclePrice.toLocaleString()}` : ''}
              </Label>
              <Input
                id="price"
                type="number"
                placeholder={market?.oraclePrice?.toString() ?? '95000'}
                value={btcPrice}
                onChange={(e) => setBtcPrice(e.target.value)}
              />
            </div>
            <Button onClick={handleManualLoad} className="w-full" variant="btc">
              Load Manual Position
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}