# Lit Protocol Integration Guide

## Overview

This guide explains how FitStake integrates with Lit Protocol to create a decentralized oracle for verifying Strava running activities. The oracle automatically marks challenge completions on-chain when users complete their runs.

## What is Lit Protocol?

Lit Protocol is a decentralized network that provides programmable key pairs (PKPs) and Lit Actions for building decentralized applications. It enables:

- **Programmable Key Pairs (PKPs)**: Cryptographic keys that can be controlled by arbitrary logic
- **Lit Actions**: JavaScript functions that run on the Lit network and can sign transactions
- **Decentralized Oracle**: Trustless verification of off-chain data

## How FitStake Uses Lit Protocol

### Architecture Overview

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   User       │     │ Lit Action  │     │  Contract    │
│  Completes   │────▶│  (datil-    │────▶│  (Sepolia)   │
│  Run         │     │   test)     │     │              │
└──────────────┘     └─────────────┘     └──────────────┘
                           │
                           ▼
                     ┌─────────────┐
                     │ Mock Strava │
                     │   Server    │
                     └─────────────┘
```

### Flow Description

1. **User completes run** → Strava records the activity
2. **Lit Action triggers** → Fetches activity data from Strava API
3. **Validation occurs** → Checks distance, type, and timestamp
4. **Transaction prepared** → Encodes `markTaskComplete()` call
5. **PKP signs transaction** → Uses Lit Protocol's signing mechanism
6. **Transaction submitted** → Sent to Sepolia contract
7. **Challenge updated** → User marked as completed

## PKP (Programmable Key Pair) Explained

### What is a PKP?

A PKP is a cryptographic key pair that can be controlled by arbitrary logic rather than a single private key. In FitStake:

- **Public Key**: Used to derive an Ethereum address
- **Private Key**: Controlled by Lit Protocol network
- **Control Logic**: Lit Action determines when the key can sign

### PKP Lifecycle

1. **Minting**: PKP is created on Lit network
2. **Funding**: PKP address is funded with ETH for gas
3. **Authorization**: PKP is set as oracle in smart contract
4. **Execution**: Lit Action uses PKP to sign transactions

### Security Model

- **Decentralized Control**: No single entity controls the PKP
- **Logic-Based**: Only authorized Lit Actions can use the PKP
- **Transparent**: All actions are verifiable on-chain
- **Fault Tolerant**: Network redundancy prevents single points of failure

## Lit Action Implementation

### Core Components

#### 1. Main Action (`verifyStravaActivity.js`)

```javascript
const verifyStravaActivity = async () => {
  // 1. Get input parameters
  const { challengeId, userAddress, contractAddress, mockActivityData } = Lit.Actions.getParams();
  
  // 2. Fetch challenge details from contract
  const challenge = await fetchChallengeDetails(contractAddress, challengeId);
  
  // 3. Validate activity against challenge criteria
  const isValid = validateActivity(mockActivityData, challenge);
  
  if (!isValid) {
    return { success: false, reason: "Activity doesn't meet requirements" };
  }
  
  // 4. Encode markTaskComplete transaction
  const txData = encodeMarkTaskComplete(challengeId, userAddress);
  
  // 5. Sign with PKP
  const signature = await Lit.Actions.signEcdsa({
    toSign: txHash,
    publicKey,
    sigName: "stravaVerificationSig"
  });
  
  return { success: true, signature, txData };
};
```

#### 2. Validation Logic (`validation.js`)

```javascript
function validateActivity(activity, challenge) {
  // Check activity type is "Run"
  if (activity.type !== "Run") return false;
  
  // Check distance meets requirement (meters)
  if (activity.distance < challenge.targetDistance) return false;
  
  // Check timestamp within challenge window
  if (activity.start_date < challenge.startTime) return false;
  if (activity.start_date > challenge.endTime) return false;
  
  return true;
}
```

#### 3. Helper Functions (`helpers.js`)

- `fetchChallengeDetails()` - Read contract state
- `validateActivity()` - Check distance/type/time
- `encodeMarkTaskComplete()` - ABI encoding
- `formatResponse()` - Standardized output

## Testing Locally

### Prerequisites

1. **Node.js 18+** installed
2. **Hardhat** configured
3. **Sepolia ETH** for testing
4. **Lit Protocol dependencies** installed

### Setup Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp env.template .env
   # Edit .env with your values
   ```

3. **Start mock Strava server**:
   ```bash
   npm run mock-strava
   ```

4. **Run local tests**:
   ```bash
   npm run test-lit-local
   ```

5. **Run Hardhat integration tests**:
   ```bash
   npm run test-lit-hardhat
   ```

### Test Scenarios

#### Valid Activity Test
- **Input**: 5.2km run within challenge window
- **Expected**: Validation passes, transaction signed
- **Result**: User marked as completed

#### Invalid Distance Test
- **Input**: 2km run (below 5km requirement)
- **Expected**: Validation fails
- **Result**: No transaction signed

#### Wrong Activity Type Test
- **Input**: Walk activity (not Run)
- **Expected**: Validation fails
- **Result**: No transaction signed

#### Timestamp Test
- **Input**: Run completed before challenge start
- **Expected**: Validation fails
- **Result**: No transaction signed

## Deploying to Sepolia

### Prerequisites

1. **Sepolia ETH** in deployer wallet
2. **RPC URL** for Sepolia network
3. **Private key** configured securely

### Deployment Steps

1. **Mint PKP**:
   ```bash
   npm run mint-pkp
   ```

2. **Deploy contract and link oracle**:
   ```bash
   npm run deploy-sepolia-oracle
   ```

3. **Verify on Etherscan**:
   - Go to contract address on Sepolia Etherscan
   - Click "Contract" tab
   - Click "Verify and Publish"
   - Follow verification steps

4. **Run E2E test**:
   ```bash
   npm run test-lit-sepolia
   ```

### Deployment Verification

After deployment, verify:

- [ ] Contract deployed successfully
- [ ] PKP minted and funded
- [ ] Oracle address set correctly
- [ ] Contract verified on Etherscan
- [ ] E2E test passes
- [ ] Mock Strava server responding

## Security Considerations

### PKP Security

- **Never share PKP private key** - it's controlled by Lit Protocol
- **Use testnet for development** - `datil-test` network
- **Monitor PKP balance** - ensure sufficient ETH for gas
- **Backup PKP configuration** - save `.pkp-config.json` securely

### Contract Security

- **Oracle-only functions** - protected by `onlyAuthorizedOracle` modifier
- **Input validation** - all parameters validated
- **Reentrancy protection** - safe withdrawal patterns
- **Access control** - owner functions protected

### Network Security

- **Use HTTPS** - for all API calls
- **Validate responses** - check Strava API responses
- **Handle errors gracefully** - don't expose sensitive data
- **Rate limiting** - prevent abuse

## Troubleshooting

### Common Issues

#### 1. PKP Not Funded
**Error**: `Insufficient funds for gas`
**Solution**: Fund PKP with more ETH
```bash
# Check PKP balance
npm run check-pkp-balance

# Fund PKP
npm run fund-pkp
```

#### 2. Oracle Not Set
**Error**: `Only authorized oracle can call this function`
**Solution**: Set PKP as oracle
```bash
npm run set-oracle
```

#### 3. Mock Server Not Running
**Error**: `Connection refused`
**Solution**: Start mock Strava server
```bash
npm run mock-strava
```

#### 4. Validation Failing
**Error**: `Activity doesn't meet requirements`
**Solution**: Check activity data
- Verify distance ≥ target
- Check activity type is "Run"
- Ensure timestamp within window

### Debug Mode

Enable debug logging:
```bash
DEBUG=true npm run test-lit-local
```

### Log Analysis

Check logs for:
- **Validation results** - success/failure reasons
- **Transaction data** - encoded function calls
- **Signature generation** - PKP signing process
- **Network errors** - connection issues

## Performance Optimization

### Lit Action Optimization

1. **Minimize API calls** - cache challenge data
2. **Optimize validation** - early returns for invalid data
3. **Batch operations** - process multiple activities
4. **Error handling** - graceful failure modes

### Network Optimization

1. **Use CDN** - for static assets
2. **Compress responses** - reduce bandwidth
3. **Connection pooling** - reuse connections
4. **Timeout handling** - prevent hanging requests

## Monitoring and Maintenance

### Health Checks

1. **PKP balance monitoring** - alert when low
2. **Contract state verification** - regular checks
3. **Lit Action execution** - success rate monitoring
4. **Network connectivity** - uptime monitoring

### Maintenance Tasks

1. **Update dependencies** - regular security updates
2. **Monitor gas prices** - optimize transaction costs
3. **Backup configurations** - PKP and deployment info
4. **Performance tuning** - optimize based on usage

## Future Enhancements

### Phase 3 Improvements

1. **Real Strava API** - replace mock server
2. **OAuth integration** - secure user authentication
3. **Automatic triggers** - webhook-based verification
4. **Enhanced validation** - more sophisticated criteria

### Advanced Features

1. **Multi-chain support** - deploy on multiple networks
2. **Custom validation rules** - user-defined criteria
3. **Analytics dashboard** - usage and performance metrics
4. **Mobile app integration** - React Native support

## Resources

### Documentation

- [Lit Protocol Docs](https://developer.litprotocol.com/)
- [PKP Guide](https://developer.litprotocol.com/coreconcepts/pkps)
- [Lit Actions Guide](https://developer.litprotocol.com/coreconcepts/litactions)
- [Hardhat Documentation](https://hardhat.org/docs)

### Community

- [Lit Protocol Discord](https://discord.gg/litprotocol)
- [Hardhat Discord](https://discord.gg/hardhat)
- [FitStake GitHub](https://github.com/fitstake)

### Support

For technical support:
1. Check this guide first
2. Search existing issues
3. Create new issue with details
4. Join Discord for real-time help

---

**Last Updated**: October 2024  
**Version**: Phase 2  
**Status**: Complete ✅
