# CrossEra SDK

Official SDK for CrossEra - CrossFi Reward System. This SDK provides easy access to CrossEra's reward system functionality.

## Installation

```bash
npm install crossera-sdk
```

## Quick Start

```typescript
import { CrossEraSDK } from 'crossera-sdk';

const sdk = new CrossEraSDK();

// Get app ID by address
const appId = await sdk.getAppIdByAddress({
  address: '0x46992B61b7A1d2e4F59Cd881B74A96a549EF49BF',
  network: 'testnet'
});

// Submit transaction for rewards
const result = await sdk.submitTransaction({
  transactionHash: '0xede6251cb0667ac7a2b51bbb9308c5b244321fe4dbb9145e1a084e6bc84053de',
  network: 'testnet'
});
```

## API Reference

### CrossEraSDK

#### Constructor

```typescript
new CrossEraSDK(config?: SDKConfig)
```

**Parameters:**
- `config` (optional): SDK configuration object
  - `defaultNetwork?: Network` - Default network to use
  - `timeout?: number` - Request timeout in milliseconds
  - `apiKey?: string` - API key for authentication (future use)

#### Methods

##### getAppIdByAddress

Get app ID by wallet address on specified network.

```typescript
async getAppIdByAddress(params: GetAppIdParams): Promise<string | null>
```

**Parameters:**
- `params.address` - Wallet address (0x format)
- `params.network` - Network to query ('testnet' or 'mainnet')

**Returns:** App ID string or null if not found

**Example:**
```typescript
const appId = await sdk.getAppIdByAddress({
  address: '0x46992B61b7A1d2e4F59Cd881B74A96a549EF49BF',
  network: 'testnet'
});
```

##### submitTransaction

Submit transaction for rewards on specified network.

```typescript
async submitTransaction(params: SubmitTransactionParams): Promise<TransactionResult>
```

**Parameters:**
- `params.transactionHash` - Transaction hash (0x format)
- `params.network` - Network to submit to ('testnet' or 'mainnet')

**Returns:** Transaction processing result

**Example:**
```typescript
const result = await sdk.submitTransaction({
  transactionHash: '0xede6251cb0667ac7a2b51bbb9308c5b244321fe4dbb9145e1a084e6bc84053de',
  network: 'testnet'
});
```

##### getNetworkConfig

Get network configuration.

```typescript
getNetworkConfig(network: Network): NetworkConfig
```

**Parameters:**
- `network` - Network to get config for

**Returns:** Network configuration object

##### getAvailableNetworks

List available networks.

```typescript
getAvailableNetworks(): Network[]
```

**Returns:** Array of available networks

## Types

### Network

```typescript
type Network = 'testnet' | 'mainnet';
```

### GetAppIdParams

```typescript
interface GetAppIdParams {
  address: string;
  network: Network;
}
```

### SubmitTransactionParams

```typescript
interface SubmitTransactionParams {
  transactionHash: string;
  network: Network;
}
```

### TransactionResult

```typescript
interface TransactionResult {
  success: boolean;
  transactionHash: string;
  appId: string;
  processedAt: string;
  network: Network;
  metrics: {
    gasUsed: string;
    gasPrice: string;
    feeGenerated: string;
    transactionValue: string;
  };
  campaignsUpdated: number;
  campaignMetrics: CampaignMetric[];
}
```

## Usage Examples

### React Hook

```typescript
import { CrossEraSDK, Network } from '@crossera/sdk';
import { useCallback, useMemo } from 'react';

function useCrossEra(network: Network) {
  const sdk = useMemo(() => new CrossEraSDK(), []);
  
  const getAppId = useCallback(async (address: string) => {
    try {
      return await sdk.getAppIdByAddress({ address, network });
    } catch (error) {
      console.error(`Failed to get app ID on ${network}:`, error);
      return null;
    }
  }, [sdk, network]);
  
  const submitTransaction = useCallback(async (hash: string) => {
    try {
      return await sdk.submitTransaction({ transactionHash: hash, network });
    } catch (error) {
      console.error(`Failed to submit transaction on ${network}:`, error);
      throw error;
    }
  }, [sdk, network]);
  
  return { getAppId, submitTransaction };
}
```

### Error Handling

```typescript
import { CrossEraSDK } from 'crossera-sdk';

const sdk = new CrossEraSDK();

async function handleAppIdLookup(address: string, network: Network) {
  try {
    const appId = await sdk.getAppIdByAddress({ address, network });
    
    if (appId) {
      console.log(`App ID found on ${network}:`, appId);
    } else {
      console.log(`No app ID found for address ${address} on ${network}`);
    }
    
    return appId;
  } catch (error) {
    console.error(`Error looking up app ID on ${network}:`, error.message);
    throw error;
  }
}
```

### Batch Operations

```typescript
import { CrossEraSDK } from 'crossera-sdk';

const sdk = new CrossEraSDK();

async function batchGetAppIds(addresses: string[], network: Network) {
  const results = await Promise.allSettled(
    addresses.map(address => 
      sdk.getAppIdByAddress({ address, network })
    )
  );
  
  return results.map((result, index) => ({
    address: addresses[index],
    appId: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : null
  }));
}
```

## Network Configuration

### Testnet
- **Base URL:** `https://crossera-testnet.vercel.app`
- **Chain ID:** 1144
- **Name:** CrossFi Testnet

### Mainnet
- **Base URL:** `https://crossera.vercel.app`
- **Chain ID:** 1144
- **Name:** CrossFi Mainnet

## Error Handling

The SDK provides comprehensive error handling:

- **Validation Errors:** Invalid address, transaction hash, or network
- **Network Errors:** Connection issues or server errors
- **API Errors:** Specific error messages from the API

All errors include context about the network and operation that failed.

## Development

### Setup

```bash
git clone https://github.com/samthetutor/crossera-sdk.git
cd crossera-sdk
npm install
```

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

For support and questions:
- GitHub Issues: [https://github.com/samthetutor/crossera-sdk/issues](https://github.com/samthetutor/crossera-sdk/issues)
- Documentation: [https://crossera.vercel.app](https://crossera.vercel.app)


