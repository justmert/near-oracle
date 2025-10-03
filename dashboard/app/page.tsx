import { getPriceData, getAuthorizedNodes, getNodeDetails, getAssets, getContractId, getNetwork, getAccountExplorerUrl } from '@/lib/near';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LiveIndicator } from '@/components/live-indicator';
import { DashboardClient } from '@/components/dashboard-client';

async function getData() {
  try {
    const [prices, assets, nodeIds] = await Promise.all([
      getPriceData(),
      getAssets(),
      getAuthorizedNodes(),
    ]);

    const nodeDetails = await Promise.all(
      nodeIds.map(id => getNodeDetails(id))
    );

    // Calculate stats
    const now = Date.now();
    const freshPrices = prices.filter(p => {
      const then = p.price.timestamp / 1_000_000;
      return (now - then) < 300000; // 5 minutes
    }).length;

    const activeNodes = nodeDetails.filter(n => n && n.active).length;

    return {
      prices,
      assets,
      nodes: nodeDetails,
      stats: {
        totalAssets: assets.length,
        activeNodes,
        freshPrices,
        totalPrices: prices.length,
      },
    };
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return {
      prices: [],
      assets: [],
      nodes: [],
      stats: {
        totalAssets: 0,
        activeNodes: 0,
        freshPrices: 0,
        totalPrices: 0,
      },
    };
  }
}

export const revalidate = 10; // Revalidate every 10 seconds

export default async function Home() {
  const data = await getData();
  const contractId = getContractId();
  const network = getNetwork();
  const contractUrl = getAccountExplorerUrl(contractId);

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">NEAR Price Oracle</h1>
            <p className="text-muted-foreground">
              TEE-secured price feeds powered by trusted execution environments
            </p>
          </div>
          <ThemeToggle />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Contract</div>
                <a
                  href={contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-mono hover:underline"
                >
                  {contractId}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Network</div>
                <div className="text-sm font-mono capitalize">{network}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DashboardClient initialData={data} />

      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <LiveIndicator />
        <span>·</span>
        <p>
          Powered by NEAR Protocol
        </p>
      </div>
    </div>
  );
}