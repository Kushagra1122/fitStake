# Auto-Stake Challenge Ability

Vincent ability that automatically stakes user deposits to FitStake challenges via PKP.

## Overview

This ability accepts user deposits and automatically executes the `joinChallenge()` transaction on behalf of users, allowing for automated DeFi participation without requiring users to manage gas or sign transactions manually.

## Features

- **Automated Staking**: PKP stakes user funds to challenges
- **Pre-validation**: Checks challenge status and stake amount before execution
- **Error Handling**: Comprehensive error messages for debugging
- **Gas Management**: PKP covers gas costs

## Installation

```bash
npm install @sogalabhi/ability-auto-stake
```

## Usage

```typescript
import { bundledVincentAbility } from '@sogalabhi/ability-auto-stake';

// Execute via Vincent Ability Client
const result = await vincentAbilityClient.execute(
  {
    challengeId: 1,
    userAddress: '0x...',
    contractAddress: '0xe38d8f585936c60ecb7bfae7297457f6a35058bb',
    stakeAmount: '10000000000000000' // 0.01 ETH in wei
  },
  {
    delegatorPkpEthAddress: PKP_ADDRESS
  }
);
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `challengeId` | number | Challenge ID to join |
| `userAddress` | string | User's wallet address |
| `contractAddress` | string | Challenge contract address |
| `stakeAmount` | string | Stake amount in wei |

## Response

Success:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "challengeId": 1,
  "userAddress": "0x...",
  "stakedAmount": "10000000000000000",
  "blockNumber": 123456
}
```

Error:
```json
{
  "success": false,
  "error": "CHALLENGE_NOT_FOUND",
  "reason": "Challenge 1 does not exist"
}
```

## Development

Build:
```bash
npm run build
```

Deploy to IPFS:
```bash
npm run deploy
```

## License

MIT

