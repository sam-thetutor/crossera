# SDK API Request/Response Format

## Overview

This document defines the standardized request and response format for the SDK batch processing endpoints.

---

## POST /api/sdk/submit

### Request Format

**Endpoint**: `POST /api/sdk/submit`

**Headers**:
```json
{
  "Content-Type": "application/json"
}
```

**Request Body**:
```typescript
{
  transactionHash: string;    // Required: Transaction hash (0x format)
  network: "testnet" | "mainnet"; // Required: Network to submit to
  appId?: string;            // Optional: App ID (extracted if not provided)
  userAddress?: string;      // Optional: User address (extracted if not provided)
}
```

**Example**:
```json
{
  "transactionHash": "0x1adc4d460135601d0524cfb08446172a50ddbe2b4394b615c0dd769199d2b70e",
  "network": "mainnet",
  "appId": "my-app-id",
  "userAddress": "0x7818CEd1298849B47a9B56066b5adc72CDDAf733"
}
```

### Response Format

**Success Response** (200):
```typescript
{
  success: true;
  message: string;
  data: {
    id: number;                    // Database ID
    transaction_hash: string;      // Transaction hash
    app_id: string;               // App ID
    user_address: string;         // User address
    network: string;              // Network (testnet/mainnet)
    status: string;               // 'pending'
    submitted_at: string;         // ISO timestamp
    estimated_processing_time: string; // "~24 hours (next batch runs at 00:00 UTC)"
  }
}
```

**Example Success Response**:
```json
{
  "success": true,
  "message": "Transaction submitted for batch processing",
  "data": {
    "id": 42,
    "transaction_hash": "0x1adc4d460135601d0524cfb08446172a50ddbe2b4394b615c0dd769199d2b70e",
    "app_id": "my-app-id",
    "user_address": "0x7818ced1298849b47a9b56066b5adc72cddaf733",
    "network": "mainnet",
    "status": "pending",
    "submitted_at": "2025-10-06T10:30:00.000Z",
    "estimated_processing_time": "~14 hours (next batch runs at 00:00 UTC)"
  }
}
```

**Error Response - Already Submitted** (409):
```json
{
  "success": false,
  "error": "Transaction already submitted for batch processing on mainnet",
  "data": {
    "transaction_hash": "0x...",
    "network": "mainnet",
    "status": "pending",
    "submitted_at": "2025-10-06T09:00:00.000Z",
    "estimated_processing_time": "~15 hours"
  }
}
```

**Error Response - Validation Error** (400):
```json
{
  "success": false,
  "error": "Missing required field: network"
}
```

---

## GET /api/sdk/status/[txHash]

### Request Format

**Endpoint**: `GET /api/sdk/status/{transactionHash}`

**Query Parameters**:
```typescript
{
  network?: "testnet" | "mainnet"  // Optional: Filter by network
}
```

**Example**:
```
GET /api/sdk/status/0x1adc4d460135601d0524cfb08446172a50ddbe2b4394b615c0dd769199d2b70e?network=mainnet
```

### Response Format

**Success Response - Pending** (200):
```json
{
  "success": true,
  "data": {
    "transaction_hash": "0x...",
    "app_id": "my-app-id",
    "user_address": "0x7818ced1298849b47a9b56066b5adc72cddaf733",
    "network": "mainnet",
    "status": "pending",
    "submitted_at": "2025-10-06T10:30:00.000Z",
    "processed_at": null,
    "process_tx_hash": null,
    "error_message": null,
    "retry_count": 0,
    "max_retries": 3,
    "estimated_processing_time": "~14 hours",
    "batch_info": null
  }
}
```

**Success Response - Completed** (200):
```json
{
  "success": true,
  "data": {
    "transaction_hash": "0x...",
    "app_id": "my-app-id",
    "user_address": "0x7818ced1298849b47a9b56066b5adc72cddaf733",
    "network": "mainnet",
    "status": "completed",
    "submitted_at": "2025-10-05T10:30:00.000Z",
    "processed_at": "2025-10-06T00:05:23.000Z",
    "process_tx_hash": "0xabc123...",
    "error_message": null,
    "retry_count": 0,
    "max_retries": 3,
    "estimated_processing_time": null,
    "batch_info": {
      "id": 123,
      "started_at": "2025-10-06T00:00:00.000Z",
      "completed_at": "2025-10-06T01:30:00.000Z",
      "status": "completed"
    }
  }
}
```

**Success Response - Failed** (200):
```json
{
  "success": true,
  "data": {
    "transaction_hash": "0x...",
    "app_id": "my-app-id",
    "user_address": "0x7818ced1298849b47a9b56066b5adc72cddaf733",
    "network": "mainnet",
    "status": "failed",
    "submitted_at": "2025-10-05T10:30:00.000Z",
    "processed_at": "2025-10-06T00:05:23.000Z",
    "process_tx_hash": null,
    "error_message": "App 'my-app-id' is not registered on-chain",
    "retry_count": 3,
    "max_retries": 3,
    "estimated_processing_time": null,
    "batch_info": {
      "id": 123,
      "started_at": "2025-10-06T00:00:00.000Z",
      "completed_at": "2025-10-06T01:30:00.000Z",
      "status": "partial"
    }
  }
}
```

**Error Response - Not Found** (404):
```json
{
  "success": false,
  "error": "Transaction not found in batch processing queue"
}
```

---

## Field Naming Convention

### Request Bodies
- **camelCase** format (e.g., `transactionHash`, `appId`, `userAddress`)
- Follows JavaScript/TypeScript conventions
- Matches SDK interface

### Response Bodies
- **snake_case** format (e.g., `transaction_hash`, `app_id`, `user_address`)
- Follows database column naming
- SDK handles conversion to camelCase

### SDK Mapping
The SDK automatically maps between formats:

```typescript
// SDK Request (camelCase)
{
  transactionHash: "0x...",
  appId: "...",
  userAddress: "0x..."
}

// API Request (camelCase maintained)
{
  transactionHash: "0x...",
  appId: "...",
  userAddress: "0x..."
}

// API Response (snake_case from database)
{
  transaction_hash: "0x...",
  app_id: "...",
  user_address: "0x..."
}

// SDK Response (mapped to camelCase)
{
  transactionHash: "0x...",
  appId: "...",
  userAddress: "0x..."
}
```

---

## Validation Rules

### Transaction Hash
- Format: `^0x[a-fA-F0-9]{64}$`
- Must be 66 characters (0x + 64 hex chars)
- Case-insensitive

### Network
- Must be exactly: `"testnet"` or `"mainnet"`
- Case-sensitive
- Required field

### App ID
- Format: `^[a-zA-Z0-9-]{3,32}$`
- 3-32 characters
- Alphanumeric and hyphens only

### User Address
- Format: `^0x[a-fA-F0-9]{40}$`
- Must be valid Ethereum address format
- Case-insensitive (stored as lowercase)

---

## Status Values

| Status | Description |
|--------|-------------|
| `pending` | Waiting for batch processing |
| `processing` | Currently being processed |
| `completed` | Successfully processed |
| `failed` | Processing failed (max retries reached) |
| `skipped` | Skipped due to duplicate or invalid data |

---

## Estimated Processing Time

Format: `"~X hours (next batch runs at 00:00 UTC)"`

Examples:
- `"~2 hours (next batch runs at 00:00 UTC)"` - If submitted at 22:00 UTC
- `"~14 hours (next batch runs at 00:00 UTC)"` - If submitted at 10:00 UTC
- `"~24 hours (next batch runs at 00:00 UTC)"` - If submitted just after midnight

---

## Error Codes

| HTTP Code | Error | Description |
|-----------|-------|-------------|
| 400 | Bad Request | Invalid or missing parameters |
| 404 | Not Found | Transaction not found in queue |
| 409 | Conflict | Transaction already submitted |
| 500 | Internal Server Error | Server error during processing |

---

## Network Handling

### Same Transaction, Different Networks

A transaction hash can be submitted to both `testnet` and `mainnet` independently:

```typescript
// Submit to mainnet
await sdk.submitForProcessing({
  transactionHash: "0x...",
  network: "mainnet"
});

// Submit same hash to testnet (this is allowed!)
await sdk.submitForProcessing({
  transactionHash: "0x...",
  network: "testnet"
});
```

The database uses a composite unique constraint:
```sql
CONSTRAINT unique_tx_hash_network UNIQUE(transaction_hash, network)
```

### Network Configuration

The batch processor uses different RPC URLs and contract addresses per network:

```typescript
const networkConfig = network === 'mainnet' 
  ? { 
      rpcUrl: process.env.MAINNET_RPC_URL,
      contractAddress: process.env.MAINNET_CONTRACT_ADDRESS 
    }
  : { 
      rpcUrl: process.env.TESTNET_RPC_URL,
      contractAddress: process.env.TESTNET_CONTRACT_ADDRESS 
    };
```

---

## Example SDK Usage

```typescript
import { CrossEraSDK } from '@crossera/sdk';

const sdk = new CrossEraSDK();

// Submit transaction for batch processing
try {
  const result = await sdk.submitForProcessing({
    transactionHash: '0x1adc4d460135601d0524cfb08446172a50ddbe2b4394b615c0dd769199d2b70e',
    network: 'mainnet',
    appId: 'my-app-id',        // Optional
    userAddress: '0x7818...'   // Optional
  });

  console.log('Submitted successfully!');
  console.log('Status:', result.status);
  console.log('Estimated time:', result.estimatedProcessingTime);
  
  // Poll for status
  const checkStatus = async () => {
    const status = await sdk.getTransactionStatus({
      transactionHash: result.transactionHash,
      network: 'mainnet'
    });
    
    if (status.status === 'completed') {
      console.log('Processing complete!');
      console.log('Process TX Hash:', status.processTxHash);
    } else if (status.status === 'failed') {
      console.error('Processing failed:', status.errorMessage);
    } else {
      console.log('Still pending/processing...');
      setTimeout(checkStatus, 60000); // Check again in 1 minute
    }
  };
  
  checkStatus();
  
} catch (error) {
  if (error.status === 409) {
    console.log('Already submitted');
  } else {
    console.error('Submission error:', error.message);
  }
}
```

---

## Summary

✅ **Request Format**: camelCase with `transactionHash` and `network` required
✅ **Response Format**: snake_case from database
✅ **Network Support**: Both testnet and mainnet
✅ **Validation**: Strong validation on all inputs
✅ **Error Handling**: Clear error messages with appropriate HTTP codes
✅ **SDK Integration**: Automatic field name mapping

