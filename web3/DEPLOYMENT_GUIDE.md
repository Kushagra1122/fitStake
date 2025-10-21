# 🚀 Sepolia Deployment Guide

Quick guide to deploy ChallengeContract to Sepolia testnet.

## Prerequisites

- [x] Node.js 18+ installed
- [x] MetaMask or crypto wallet
- [ ] Sepolia testnet ETH (get from faucet)
- [ ] Private key ready

## Step 1: Setup Environment Variables

Your `.env` file should look like this:

```env
# Sepolia Network Configuration  
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_PRIVATE_KEY=your_private_key_without_0x_prefix

# Lit Protocol (for oracle - Phase 3)
LIT_NETWORK=datil-test
PKP_FUNDING_AMOUNT=0.1
```

### Get Your Private Key

**⚠️ SECURITY WARNING: Never commit your .env file or share your private key!**

From MetaMask:
1. Click three dots → Account Details
2. Click "Show Private Key"
3. Enter password
4. Copy key (remove `0x` prefix)
5. Paste into `.env` file

**Recommendation**: Use a separate wallet for testnet only!

## Step 2: Get Sepolia ETH

You need ~0.05 ETH for deployment. Get free Sepolia ETH from faucets:

### Faucet Links:
- **Alchemy**: https://sepoliafaucet.com/
- **QuickNode**: https://faucet.quicknode.com/ethereum/sepolia
- **Infura**: https://www.infura.io/faucet/sepolia
- **Chainlink**: https://faucets.chain.link/sepolia

### Verify You Have ETH:
Check your balance on Sepolia Etherscan:
https://sepolia.etherscan.io/address/YOUR_WALLET_ADDRESS

## Step 3: Deploy Contract

Run the simple deployment script:

```bash
npm run deploy-sepolia
```

This will:
1. ✅ Deploy ChallengeContract to Sepolia
2. ✅ Verify network and balance
3. ✅ Save deployment info to `deployment-sepolia.json`
4. ✅ Display contract address and Etherscan link

**Expected Output:**
```
🚀 Starting Simple Sepolia Deployment...

🌐 Checking network configuration...
📍 Chain ID: 11155111
👤 Deployer: 0xYourAddress...
💰 Deployer Balance: 0.05 ETH

📦 Deploying ChallengeContract to Sepolia...
⏳ Waiting for deployment confirmation...
✅ Contract deployed successfully!
📍 Contract Address: 0x1234567890abcdef...
📝 Transaction Hash: 0xabcd...

╔════════════════════════════════════════════════╗
║     ✅ SEPOLIA DEPLOYMENT SUCCESSFUL!         ║
╚════════════════════════════════════════════════╝

📋 Contract Details:
   Address: 0x1234567890abcdef...
   Owner: 0xYourAddress...
   Network: Sepolia (Chain ID: 11155111)
   Etherscan: https://sepolia.etherscan.io/address/0x...

🔗 Use in React Native:
   CONTRACT_ADDRESS = "0x1234567890abcdef..."
   SEPOLIA_CHAIN_ID = 11155111
```

## Step 4: Save Contract Address

Copy the contract address and save it for your React Native app:

```typescript
// In your React Native app config
export const CONTRACT_ADDRESS = "0x..." // From deployment
export const SEPOLIA_CHAIN_ID = 11155111
```

## Step 5: Verify on Etherscan (Optional)

Verify your contract source code for transparency:

```bash
# Get Etherscan API key from https://etherscan.io/myapikey
# Add to .env:
ETHERSCAN_API_KEY=your_api_key

# Verify
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

## Troubleshooting

### "Insufficient funds"
- Get more Sepolia ETH from faucets above
- Make sure you're checking the Sepolia network, not mainnet

### "Invalid private key"  
- Remove `0x` prefix from SEPOLIA_PRIVATE_KEY
- Ensure no spaces or quotes around the key
- Check the key is from the wallet with Sepolia ETH

### "Network error"
- Try alternative RPC URLs:
  - `https://ethereum-sepolia.publicnode.com`
  - `https://rpc2.sepolia.org`
  - Get Alchemy RPC: https://www.alchemy.com/

### "Module not found"
- Run `npm install` in the `web3/` directory

## Next Steps

After deployment:

1. **Test the Contract**
   - Create a test challenge
   - Join with test wallet
   - Verify on Etherscan

2. **Set Up Oracle (Optional)**
   - For now, you can manually call functions from your wallet
   - Oracle setup (Lit Protocol) can come later

3. **Integrate with React Native**
   - Use the contract address in your mobile app
   - Install wagmi/viem for Web3 interactions
   - Connect to Sepolia network

## Oracle Setup (Later)

If you want to set up the Lit Protocol oracle:

```bash
# This requires Lit Protocol SDK to be fully configured
npm run deploy-sepolia-oracle
```

For now, you can manually set any address as oracle:
```bash
# Set your own wallet as oracle for testing
npx hardhat console --network sepolia
> const contract = await ethers.getContractAt("ChallengeContract", "YOUR_CONTRACT_ADDRESS")
> await contract.setOracleAddress("YOUR_WALLET_ADDRESS")
```

## Security Checklist

Before going live:
- [ ] `.env` is in `.gitignore` ✅
- [ ] Using test wallet (not main wallet) ✅
- [ ] Private key never committed to Git ✅
- [ ] Sepolia ETH in wallet ✅
- [ ] Contract deployed and verified ✅

---

**Questions?** Check the main README.md or TESTING.md for more information.

