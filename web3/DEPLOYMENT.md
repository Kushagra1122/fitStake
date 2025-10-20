# FitStake Sepolia Deployment Guide

## Prerequisites

1. **Get Sepolia ETH**: Visit [Sepolia Faucet](https://sepoliafaucet.com/) and get free test ETH
2. **Get your private key**: Export from MetaMask or your wallet
3. **Get RPC URL**: Use public `https://rpc.sepolia.org` or sign up for Alchemy/Infura

## Deployment Steps

### Method 1: Environment Variables (PowerShell)
```powershell
# Set environment variables
$env:SEPOLIA_RPC_URL="https://rpc.sepolia.org"
$env:SEPOLIA_PRIVATE_KEY="your_private_key_here"

# Deploy
npx hardhat ignition deploy ignition/modules/ChallengeContract.ts --network sepolia
```

### Method 2: Environment Variables (Command Prompt)
```cmd
set SEPOLIA_RPC_URL=https://rpc.sepolia.org
set SEPOLIA_PRIVATE_KEY=your_private_key_here
npx hardhat ignition deploy ignition/modules/ChallengeContract.ts --network sepolia
```

### Method 3: Hardhat Keystore (Most Secure)
```bash
# Set up keystore (will prompt for password)
npx hardhat keystore set SEPOLIA_PRIVATE_KEY

# Set RPC URL
npx hardhat keystore set SEPOLIA_RPC_URL

# Deploy
npx hardhat ignition deploy ignition/modules/ChallengeContract.ts --network sepolia
```

## Testing the Deployment

After deployment, you'll get:
- Contract address
- Transaction hash
- Deployment details

### Verify on Etherscan
1. Go to [Sepolia Etherscan](https://sepolia.etherscan.io/)
2. Search for your contract address
3. Verify the contract source code

### Test Contract Functions
You can interact with your deployed contract using:
- Etherscan's "Contract" tab
- Hardhat console
- Custom scripts

## Example Deployment Output
```
Hardhat Ignition starting for [ ChallengeContractModule ]...

Deploying ChallengeContract...
✅ ChallengeContract deployed at: 0x1234567890abcdef...

Deployment completed successfully!
```

## Troubleshooting

- **Insufficient funds**: Get more Sepolia ETH from faucets
- **RPC errors**: Try a different RPC URL
- **Private key issues**: Ensure it starts with 0x and is 64 characters long
