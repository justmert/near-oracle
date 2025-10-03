export interface Price {
  multiplier: string;
  decimals: number;
  timestamp: number;
}

export interface PriceData {
  asset_id: string;
  price: Price;
  num_sources: number;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  active: boolean;
  min_sources: number;
}

export interface OracleNode {
  account_id: string;
  operator_id: string;
  registered_at: number;
  code_hash: string;
  last_report: number;
  active: boolean;
}

const NEAR_CONFIG = {
  testnet: {
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.fastnear.com',
  },
  mainnet: {
    networkId: 'mainnet',
    nodeUrl: 'https://rpc.mainnet.near.org',
  },
};

const network = (process.env.NEXT_PUBLIC_NEAR_NETWORK as 'testnet' | 'mainnet') || 'testnet';
const contractId = process.env.NEXT_PUBLIC_ORACLE_CONTRACT_ID || 'oracle.testnet';
const config = NEAR_CONFIG[network];

type ViewFunctionArgs = Record<string, unknown>;

interface RpcQuerySuccess {
  result: {
    result: number[];
  };
  error?: undefined;
}

interface RpcQueryError {
  error: {
    message?: string;
  };
}

type RpcQueryResponse = RpcQuerySuccess | RpcQueryError;

async function viewFunction<T>(
  methodName: string,
  args: ViewFunctionArgs = {},
): Promise<T> {
  const response = await fetch(config.nodeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'dontcare',
      method: 'query',
      params: {
        request_type: 'call_function',
        finality: 'final',
        account_id: contractId,
        method_name: methodName,
        args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      },
    }),
  });

  const json = (await response.json()) as RpcQueryResponse;

  if ('error' in json && json.error) {
    throw new Error(json.error.message || 'Query failed');
  }

  if (!('result' in json)) {
    throw new Error('Malformed RPC response');
  }

  const rawBytes = json.result.result ?? [];
  const resultBuffer = Buffer.from(rawBytes);
  const decoded = resultBuffer.toString() || 'null';

  return JSON.parse(decoded) as T;
}

export async function getPriceData(): Promise<PriceData[]> {
  return viewFunction<PriceData[]>('get_price_data');
}

export async function getAssets(): Promise<Asset[]> {
  return viewFunction<Asset[]>('get_assets');
}

export async function getAuthorizedNodes(): Promise<string[]> {
  return viewFunction<string[]>('get_authorized_nodes');
}

export async function getNodeDetails(accountId: string): Promise<OracleNode | null> {
  try {
    return await viewFunction<OracleNode>('get_node_details', { account_id: accountId });
  } catch {
    return null;
  }
}

export function formatPrice(multiplier: string, decimals: number): string {
  const num = parseInt(multiplier) / Math.pow(10, decimals);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp / 1_000_000); // Convert from nanoseconds
  return date.toLocaleString();
}

export function getTimeSince(timestamp: number): string {
  const now = Date.now();
  const then = timestamp / 1_000_000; // Convert from nanoseconds
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins}m ${secs}s ago`;
  }
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function getExplorerUrl(path: string): string {
  const baseUrl = network === 'testnet'
    ? 'https://explorer.testnet.near.org'
    : 'https://explorer.near.org';
  return `${baseUrl}${path}`;
}

export function getAccountExplorerUrl(accountId: string): string {
  return getExplorerUrl(`/accounts/${accountId}`);
}

export function getContractId(): string {
  return contractId;
}

export function getNetwork(): string {
  return network;
}

import { Buffer } from 'buffer';
