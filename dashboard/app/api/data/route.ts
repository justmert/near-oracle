import { NextResponse } from 'next/server';
import { getPriceData, getAuthorizedNodes, getNodeDetails, getAssets } from '@/lib/near';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [prices, assets, nodeIds] = await Promise.all([
      getPriceData(),
      getAssets(),
      getAuthorizedNodes(),
    ]);

    const nodeDetails = await Promise.all(
      nodeIds.map(id => getNodeDetails(id))
    );

    const now = Date.now();
    const freshPrices = prices.filter(p => {
      const then = p.price.timestamp / 1_000_000;
      return (now - then) < 300000; // 5 minutes
    }).length;

    const activeNodes = nodeDetails.filter(n => n && n.active).length;

    return NextResponse.json({
      prices,
      assets,
      nodes: nodeDetails,
      stats: {
        totalAssets: assets.length,
        activeNodes,
        freshPrices,
        totalPrices: prices.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return NextResponse.json(
      {
        prices: [],
        assets: [],
        nodes: [],
        stats: {
          totalAssets: 0,
          activeNodes: 0,
          freshPrices: 0,
          totalPrices: 0,
        },
      },
      { status: 500 }
    );
  }
}
