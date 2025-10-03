'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTimeSince, getAccountExplorerUrl } from '@/lib/near';
import { ExternalLink } from 'lucide-react';

interface OracleNode {
  account_id: string;
  operator_id: string;
  registered_at: number;
  code_hash: string;
  last_report: number;
  active: boolean;
}

interface NodeStatusProps {
  nodes: (OracleNode | null)[];
}

export function NodeStatus({ nodes }: NodeStatusProps) {
  const validNodes = nodes.filter((n): n is OracleNode => n !== null);

  const getNodeHealth = (node: OracleNode) => {
    if (!node.active) return 'inactive';
    if (node.last_report === 0) return 'new';

    const now = Date.now();
    const then = node.last_report / 1_000_000;
    const diff = now - then;

    if (diff < 300000) return 'healthy'; // < 5 minutes
    if (diff < 600000) return 'warning'; // < 10 minutes
    return 'down';
  };

  const getHealthBadge = (health: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      healthy: 'default',
      warning: 'secondary',
      down: 'destructive',
      inactive: 'outline',
      new: 'secondary',
    };

    const labels: Record<string, string> = {
      healthy: 'Online',
      warning: 'Slow',
      down: 'Offline',
      inactive: 'Inactive',
      new: 'New',
    };

    return (
      <Badge variant={variants[health] || 'outline'}>
        {labels[health] || health}
      </Badge>
    );
  };

  if (validNodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Oracle Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No nodes registered</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Oracle Nodes ({validNodes.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {validNodes.map((node) => {
            const health = getNodeHealth(node);
            return (
              <div
                key={node.account_id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={getAccountExplorerUrl(node.account_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium font-mono text-sm hover:underline flex items-center gap-1"
                    >
                      {node.account_id}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Operator: <span className="font-mono">{node.operator_id}</span>
                  </p>
                  {node.last_report > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Last report: {getTimeSince(node.last_report)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono">
                    Code: {node.code_hash.substring(0, 16)}...
                  </p>
                </div>
                <div className="text-right">
                  {getHealthBadge(health)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}