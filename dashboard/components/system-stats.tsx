'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SystemStatsProps {
  totalAssets: number;
  activeNodes: number;
  freshPrices: number;
  totalPrices: number;
  nextUpdate?: number;
}

export function SystemStats({ totalAssets, activeNodes, freshPrices, totalPrices, nextUpdate }: SystemStatsProps) {
  const healthPercentage = totalPrices > 0 ? Math.round((freshPrices / totalPrices) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAssets}</div>
          <p className="text-xs text-muted-foreground">
            Supported cryptocurrencies
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeNodes}</div>
          <p className="text-xs text-muted-foreground">
            Providing price data
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fresh Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {freshPrices}/{totalPrices}
          </div>
          <p className="text-xs text-muted-foreground">
            Updated in last 5 minutes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{healthPercentage}%</div>
          <p className="text-xs text-muted-foreground">
            Price data freshness
          </p>
        </CardContent>
      </Card>
    </div>
  );
}