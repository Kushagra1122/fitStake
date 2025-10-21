# Lit Protocol Oracle Setup Guide

This guide walks you through setting up and testing the Lit Protocol Oracle for FitStake.

## Overview

The Lit Protocol Oracle allows decentralized verification of Strava fitness activities. When a user completes a run, the oracle:

1. Verifies the Strava activity data against challenge criteria
2. Signs a transaction with a Programmable Key Pair (PKP)
3. Calls `markTaskComplete()` on the smart contract
4. Updates the user's challenge status on-chain

## Architecture

```
┌─────────────────┐
│  React Native   │
│      App        │
└────────┬────────┘
         │
         │ POST /verify-strava-run
         ▼
┌─────────────────┐
│   Backend API   │  (Express.js)
│  Oracle Service │
└────────┬────────┘
         │
         │ Execute Lit Action
         ▼
┌─────────────────┐
│  Lit Protocol   │  (Decentralized PKP)
│   Lit Action    │
└────────┬────────┘
         │
         │ markTaskComplete()
         ▼
┌─────────────────┐
│    Sepolia      │
│ ChallengeContract│
└─────────────────┘
```

## Prerequisites

- [x] Contract deployed to Sepolia (`0x21854089df4aeb1e0ac1770a43f5e892a8fd04d9`)
- [ ] PKP minted and funded with Sepolia ETH
- [ ] Oracle address set on contract
- [ ] Backend service running

## Step-by-Step Setup

### Phase 1: Mint PKP (Programmable Key Pair)

A PKP is a decentralized wallet controlled by Lit Protocol that will sign transactions.

```bash
# Run the PKP minting script
npm run mint-pkp
```

This will:
- Create a new PKP on the Lit Protocol network
- Save the PKP config to `.pkp-config.json`
- Display the PKP's Ethereum address

**Expected Output:**
```
✅ PKP Minted Successfully!
PKP Ethereum Address: 0xABC123...
PKP Token ID: 456789...
Network: datil-test
```

**Important:** Save the `.pkp-config.json` file - you'll need it for the next steps.

### Phase 2: Fund the PKP

The PKP needs Sepolia ETH to pay for gas when calling `markTaskComplete()`.

1. Get the PKP address from `.pkp-config.json`
2. Send 0.1-0.2 Sepolia ETH to the PKP address
3. Get Sepolia ETH from faucets:
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia

**Verify funding:**
```bash
# Check balance on Etherscan
https://sepolia.etherscan.io/address/<PKP_ADDRESS>
```

### Phase 3: Set PKP as Authorized Oracle

Configure the smart contract to accept transactions from your PKP.

```bash
npm run set-oracle
```

This will:
- Read your PKP config from `.pkp-config.json`
- Call `setOracleAddress()` on the contract
- Set the PKP as the authorized oracle

**Expected Output:**
```
✅ ORACLE SETUP COMPLETE!
Contract: 0x21854089df4aeb1e0ac1770a43f5e892a8fd04d9
Oracle (PKP): 0xABC123...
```

**Verify on Etherscan:**
```
https://sepolia.etherscan.io/address/0x21854089df4aeb1e0ac1770a43f5e892a8fd04d9#readContract
```
- Call `authorizedOracle()` - should return your PKP address

### Phase 4: Start Backend Oracle Service

The backend service listens for verification requests and triggers Lit Actions.

```bash
npm run backend
```

**Expected Output:**
```
╔════════════════════════════════════════════════╗
║   🔐 Lit Protocol Oracle Service RUNNING     ║
╚════════════════════════════════════════════════╝

📡 Server: http://localhost:3000
🌐 Network: datil-test
📝 Contract: 0x21854089df4aeb1e0ac1770a43f5e892a8fd04d9
🔑 PKP: 0xABC123...

✅ Ready for verification requests!
```

The backend is now running and ready to process verification requests.

### Phase 5: Test the Oracle

Run the end-to-end test to verify everything is working.

```bash
# In a new terminal (keep backend running)
npm run test-lit-e2e
```

This will:
1. Create a test challenge
2. Join the challenge
3. Attempt to mark task complete (via oracle)
4. Verify participant status

**Expected Output:**
```
✅ E2E Test Summary
✅ Contract Connected
✅ Oracle Configured
✅ Challenge Created
✅ Participant Joined
```

## Using the Oracle

### From React Native App

When a user completes a run, call the backend verification endpoint:

```typescript
// React Native code
const verifyRun = async (challengeId, userAddress, stravaAccessToken, activityId) => {
  const response = await fetch('http://your-backend:3000/verify-strava-run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeId,
      userAddress,
      stravaAccessToken,
      activityId
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('✅ Run verified and marked complete!');
    console.log('Transaction:', result.transaction.transactionHash);
  }
};
```

### Testing with cURL

Test the backend without React Native:

```bash
curl -X POST http://localhost:3000/verify-strava-run \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": "1",
    "userAddress": "0xYourAddress",
    "mockActivityData": {
      "id": 12345,
      "distance": 5200,
      "type": "Run",
      "start_date": "2025-10-21T10:00:00Z"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "signature": "...",
    "txData": "...",
    "transaction": {
      "transactionHash": "0xABC123...",
      "status": "pending"
    }
  }
}
```

### Health Check

Verify the backend is running:

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "litNetwork": "datil-test",
  "contractAddress": "0x21854089df4aeb1e0ac1770a43f5e892a8fd04d9",
  "pkpConfigured": true,
  "litClientReady": true
}
```

## Troubleshooting

### Issue: "PKP config not found"

**Solution:** Run `npm run mint-pkp` to create a PKP first.

### Issue: "Only authorized oracle can call this function"

**Solution:** 
1. Verify PKP is set as oracle: `npm run set-oracle`
2. Check on Etherscan that `authorizedOracle()` returns your PKP address

### Issue: "Transaction failed - insufficient funds"

**Solution:** Fund the PKP with more Sepolia ETH. It needs ~0.01 ETH per transaction.

### Issue: "Lit Protocol client not initialized"

**Solution:** 
1. Wait a few seconds for the client to connect
2. Check the backend logs for connection errors
3. Restart the backend: `npm run backend`

### Issue: "RPC error: 429 Too Many Requests"

**Solution:** The default RPC has rate limits. Update `.env`:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

Get a free Alchemy API key: https://www.alchemy.com/

## Monitoring

### Check Contract Events

View all `TaskCompleted` events on Etherscan:
```
https://sepolia.etherscan.io/address/0x21854089df4aeb1e0ac1770a43f5e892a8fd04d9#events
```

### Check PKP Balance

Monitor PKP gas funds:
```
https://sepolia.etherscan.io/address/<PKP_ADDRESS>
```

**Refill when balance drops below 0.05 ETH**

### Backend Logs

The backend logs all verification requests:
```
🏃 Verification request received
Challenge ID: 1
User Address: 0x123...
Activity ID: using mock data
🔐 Executing Lit Action...
✅ Lit Action executed
Transaction: 0xABC...
```

## Production Deployment

### Backend Hosting

Deploy the backend to:
- **Railway**: https://railway.app/
- **Render**: https://render.com/
- **Fly.io**: https://fly.io/

### Environment Variables

Set these in your hosting platform:

```env
ORACLE_PORT=3000
LIT_NETWORK=datil-test
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### Security

1. **API Authentication**: Add auth tokens to backend endpoints
2. **Rate Limiting**: Prevent abuse with rate limits
3. **PKP Access Control**: Restrict who can trigger Lit Actions
4. **HTTPS**: Always use HTTPS in production

### React Native Integration

Update your React Native app's API endpoint:

```typescript
const ORACLE_BACKEND = 'https://your-backend.railway.app';
```

## Cost Estimation

### Per Verification (Sepolia Testnet)

- Gas for `markTaskComplete()`: ~50,000 gas
- Gas price (Sepolia): ~0.5 gwei
- **Cost per verification: ~0.000025 ETH ($0.00)**

### PKP Funding Schedule

- 100 verifications ≈ 0.0025 ETH
- **Fund with 0.1 ETH** = ~4,000 verifications

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run mint-pkp` | Create a new PKP wallet |
| `npm run set-oracle` | Set PKP as authorized oracle |
| `npm run backend` | Start oracle backend service |
| `npm run test-lit-e2e` | Test full oracle flow |
| `npm run mock-strava` | Start mock Strava API (for testing) |

## File Reference

| File | Purpose |
|------|---------|
| `.pkp-config.json` | PKP credentials (DO NOT COMMIT) |
| `backend/lit-oracle-service.ts` | Express API for oracle |
| `lit-actions/verifyStravaActivity.js` | Lit Action verification logic |
| `scripts/mint-pkp.ts` | PKP creation script |
| `scripts/set-oracle.ts` | Oracle configuration script |

## Next Steps

- [x] PKP minted and funded ✅
- [x] Oracle set on contract ✅
- [x] Backend running ✅
- [ ] Test with real Strava API
- [ ] Deploy backend to production
- [ ] Integrate with React Native app
- [ ] Monitor gas usage and refill PKP as needed

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review backend logs
3. Check Etherscan for transaction details
4. Verify PKP has sufficient balance

---

**🎉 Congratulations!** Your decentralized oracle is ready to verify fitness activities!

