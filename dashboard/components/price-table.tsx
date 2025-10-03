'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatPrice, getTimeSince } from '@/lib/near';

interface Price {
  multiplier: string;
  decimals: number;
  timestamp: number;
}

interface PriceData {
  asset_id: string;
  price: Price;
  num_sources: number;
}

interface Asset {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  active: boolean;
  min_sources: number;
}

interface PriceTableProps {
  prices: PriceData[];
  assets: Asset[];
}

export function PriceTable({ prices, assets }: PriceTableProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isStale = (timestamp: number) => {
    const then = timestamp / 1_000_000;
    return (now - then) > 300000; // 5 minutes
  };

  // Merge assets with price data
  const displayData = assets.map(asset => {
    const priceData = prices.find(p => p.asset_id === asset.id);
    return {
      asset,
      priceData,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Prices</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Price (USD)</TableHead>
              <TableHead>Sources</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map(({ asset, priceData }) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">
                  {asset.symbol}
                  <div className="text-xs text-muted-foreground">{asset.name}</div>
                </TableCell>
                {priceData ? (
                  <>
                    <TableCell className="text-right font-mono text-lg">
                      ${formatPrice(priceData.price.multiplier, priceData.price.decimals)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {priceData.num_sources} source{priceData.num_sources !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getTimeSince(priceData.price.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isStale(priceData.price.timestamp) ? 'destructive' : 'default'}>
                        {isStale(priceData.price.timestamp) ? 'Stale' : 'Fresh'}
                      </Badge>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="text-right text-muted-foreground">-</TableCell>
                    <TableCell>
                      <Badge variant="outline">Pending</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">-</TableCell>
                    <TableCell>
                      <Badge variant="outline">Waiting for data</Badge>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
