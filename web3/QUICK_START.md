# 🚀 Quick Start - Lit Oracle Setup

## ✅ What's Complete

- ✅ PKP minting script fixed and ready
- ✅ Backend oracle service created
- ✅ Set oracle script created
- ✅ Lit Action updated with proper encoding
- ✅ E2E test script created
- ✅ All documentation written

## 📋 What You Need To Do Now

### Step 1: Mint a PKP (5 minutes)

```bash
npm run mint-pkp
```

**What happens:**
- Creates a Programmable Key Pair (decentralized wallet)
- Saves config to `.pkp-config.json`
- Shows you the PKP address

**Expected output:**
```
✅ PKP Minted Successfully!
PKP Ethereum Address: 0xABC123...
```

**Save this address!** You'll need it in the next step.

---

### Step 2: Fund the PKP (10 minutes)

The PKP needs Sepolia ETH to pay gas fees when calling the contract.

**Get Sepolia ETH:**
1. Go to: https://sepoliafaucet.com/
2. Enter the PKP address from Step 1
3. Request 0.5 ETH (free testnet tokens)

**Or use Alchemy faucet:**
1. Go to: https://www.alchemy.com/faucets/ethereum-sepolia
2. Sign in with GitHub
3. Request Sepolia ETH for your PKP address

**Verify you received it:**
```
https://sepolia.etherscan.io/address/<YOUR_PKP_ADDRESS>
```

You should see a balance of ~0.5 ETH.

---

### Step 3: Set PKP as Oracle (2 minutes)

```bash
npm run set-oracle
```

**What happens:**
- Reads your PKP config
- Calls `setOracleAddress()` on your deployed contract
- Authorizes the PKP to mark tasks complete

**Expected output:**
```
✅ ORACLE SETUP COMPLETE!
Contract: 0xbaf067fe68f032d9fdc906c6dcb32299baa2404f      
Oracle (PKP): 0xABC123...
```

**Verify on Etherscan:**
```
https://sepolia.etherscan.io/address/0xbaf067fe68f032d9fdc906c6dcb32299baa2404f      #readContract
```

Click "authorizedOracle" - should show your PKP address.

---

### Step 4: Test Everything (5 minutes)

**Terminal 1 - Start Backend:**
```bash
npm run backend
```

**What happens:**
- Starts Express server on port 3000
- Connects to Lit Protocol network
- Loads your PKP config
- Ready to process verification requests

**Expected output:**
```
╔════════════════════════════════════════════════╗
║   🔐 Lit Protocol Oracle Service RUNNING     ║
╚════════════════════════════════════════════════╝

📡 Server: http://localhost:3000
✅ Ready for verification requests!
```

**Terminal 2 - Run E2E Test:**
```bash
npm run test-lit-e2e
```

**What happens:**
- Creates a test challenge
- Joins the challenge
- Attempts to mark task complete
- Shows full oracle flow

**Expected output:**
```
✅ E2E Test Summary
✅ Contract Connected
✅ Oracle Configured
✅ Challenge Created
✅ Participant Joined
```

---

## 🎯 You're Done!

Your Lit Protocol Oracle is now fully set up and ready to use.

## 🧪 Test the API

With the backend running, test verification:

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

**Expected response:**
```json
{
  "success": true,
  "result": {
    "signature": "...",
    "txData": "...",
    "transaction": {
      "transactionHash": "0x...",
      "status": "pending"
    }
  }
}
```

## 📱 Integrate with React Native

In your React Native app:

```typescript
const verifyRun = async (challengeId, userAddress) => {
  const response = await fetch('http://localhost:3000/verify-strava-run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeId,
      userAddress,
      mockActivityData: {
        id: Date.now(),
        distance: 5200,
        type: 'Run',
        start_date: new Date().toISOString()
      }
    })
  });
  
  return await response.json();
};
```

## 📚 Full Documentation

- **Complete Setup Guide**: [LIT_ORACLE_GUIDE.md](./LIT_ORACLE_GUIDE.md)
- **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Main README**: [README.md](./README.md)

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| "PKP config not found" | Run `npm run mint-pkp` first |
| "Only authorized oracle can call" | Run `npm run set-oracle` |
| "Insufficient funds" | Fund PKP with more Sepolia ETH |
| Backend won't start | Check PKP config exists, install deps |

## 📊 Monitor Your Oracle

**Check PKP Balance:**
```
https://sepolia.etherscan.io/address/<PKP_ADDRESS>
```

**Check Contract Events:**
```
https://sepolia.etherscan.io/address/0xbaf067fe68f032d9fdc906c6dcb32299baa2404f      #events
```

**Backend Health:**
```
curl http://localhost:3000/health
```

## 🎉 Next Steps

1. ✅ Oracle is set up
2. ⏭️ Test with real Strava API (optional)
3. ⏭️ Deploy backend to production (Railway, Render, etc.)
4. ⏭️ Integrate with React Native app
5. ⏭️ Demo for hackathon! 🏆

---

**Need Help?** Check the full guides listed above or review the terminal output for detailed error messages.

