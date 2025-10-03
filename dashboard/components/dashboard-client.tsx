'use client';

import { useEffect, useState } from 'react';
import { PriceTable } from '@/components/price-table';
import { NodeStatus } from '@/components/node-status';
import { SystemStats } from '@/components/system-stats';
import type { PriceData, Asset, OracleNode } from '@/lib/near';

interface DashboardData {
  prices: PriceData[];
  assets: Asset[];
  nodes: OracleNode[];
  stats: {
    totalAssets: number;
    activeNodes: number;
    freshPrices: number;
    totalPrices: number;
  };
}

interface DashboardClientProps {
  initialData: DashboardData;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [nextUpdate, setNextUpdate] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const newData = await response.json();
          setData(newData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    // Fetch data every 10 seconds
    const dataInterval = setInterval(() => {
      fetchData();
      setNextUpdate(10);
    }, 10000);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      setNextUpdate((prev) => (prev > 0 ? prev - 1 : 10));
    }, 1000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  return (
    <>
      <SystemStats {...data.stats} nextUpdate={nextUpdate} />

      <div className="grid gap-8 lg:grid-cols-2">
        <PriceTable prices={data.prices} assets={data.assets} />
        <NodeStatus nodes={data.nodes} />
      </div>
    </>
  );
}
