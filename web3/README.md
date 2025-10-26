# FitStake Web3 - Phase 2 Complete

A Web3 mobile application that merges real-world running activities with crypto staking and betting mechanics, powered by decentralized smart contracts and Lit Protocol oracles.

## Phase Status

### Phase 1: ✅ COMPLETE
Core smart contract infrastructure with ETH staking

### Phase 2: ✅ COMPLETE
Decentralized oracle integration with Lit Protocol

**Test Status**: 39/39 tests passing (100%)

### What's Implemented

- **ChallengeContract.sol**: Complete smart contract with oracle integration
- **Lit Action**: Strava activity verification logic (`verifyStravaActivity.js`)
- **PKP Setup**: Programmable Key Pair wallet integration
- **Oracle Backend**: Express.js service to trigger Lit Actions (`backend/lit-oracle-service.ts`)
- **Mock Infrastructure**: Mock Strava server for testing
- **Comprehensive Test Suite**: 39 tests covering all functionality
- **Deployment Scripts**: Sepolia testnet deployment with oracle configuration
- **Setup Scripts**: PKP minting, oracle configuration, and E2E testing
- **Envio Indexer**: Preparatory structure for Phase 3+ (not active)

### Contract Versions

**Original Contract** (Sepolia: `0xe38d8f585936c60ecb7bfae7297457f6a35058bb      `):
- Basic TaskCompleted events
- Functional for staking and verification
- Deployed and tested

**Enhanced Contract** (see `deployment-enhanced.json`):
- Emits detailed activity data in events (timestamp, distance, duration, Strava ID)
- Enables UI to display participant details without separate database
- Same core functionality plus rich event data
- See [ENHANCED_CONTRACT.md](./ENHANCED_CONTRACT.md) for details

### Contract Features

- **Challenge Creation**: Users can create running challenges with specific distance targets and stake amounts
- **ETH Staking**: Participants stake ETH to join challenges
- **Oracle Verification**: ✅ Lit Protocol integration with PKP wallets
- **Strava Activity Verification**: ✅ Real-time activity verification via Lit Actions
- **Activity Data Events**: ✅ Enhanced contract emits completion timestamp, distance, duration, and Strava activity ID
- **Automatic Distribution**: Failed participants' stakes are distributed to successful completers
- **Binary Challenge System**: Complete or fail - no partial completion
- **Secure Authorization**: Only authorized PKP oracle can mark tasks complete

### Smart Contract Architecture

```solidity
// Core structs
struct ChallengeDetails {
    uint256 challengeId;
    address creator;
    string description;
    uint256 targetDistance; // in meters
    uint256 stakeAmount;
    uint256 startTime;
    uint256 endTime;
    uint256 totalStaked;
    uint256 participantCount;
    bool finalized;
}

struct Participant {
    address userAddress;
    bool hasCompleted;
    bool hasWithdrawn;
    uint256 stakedAmount;
}
```

### Key Functions

- `createChallenge()` - Create new fitness challenges
- `joinChallenge()` - Payable function to join with exact stake amount
- `markTaskComplete()` - Oracle-only function to mark completion
- `finalizeChallenge()` - Calculate and distribute winnings
- `withdrawWinnings()` - Allow winners to withdraw their share
- `setOracleAddress()` - Owner-only oracle management

## Usage

### Prerequisites

- Node.js 18+
- Hardhat 3.0+
- TypeScript
- Sepolia ETH (for deployment and PKP funding)

### Installation

```bash
cd web3
npm install
```

### Lit Protocol Oracle Setup

**📚 See [LIT_ORACLE_GUIDE.md](./LIT_ORACLE_GUIDE.md) for complete setup instructions**

Quick start:
```bash
# 1. Mint PKP (Programmable Key Pair)
npm run mint-pkp

# 2. Fund PKP with 0.1-0.2 Sepolia ETH (see guide for faucets)

# 3. Set PKP as authorized oracle
npm run set-oracle

# 4. Start oracle backend service
npm run backend

# 5. Test end-to-end flow
npm run test-lit-e2e
```

### Running Tests

```bash
# Run all tests (39 tests)
npm test

# Run specific test suites
npx hardhat test test/ChallengeContract.ts          # 25 tests
npx hardhat test test/LitOracleIntegration.ts       # 14 tests

# Test Lit Action locally
npm run test-lit-local

# Test on Sepolia with deployed contract
npm run test-lit-e2e

# Start mock Strava server (for development)
npm run mock-strava
```

### Compilation

```bash
npm run compile
```

### Local Deployment

```bash
# Start local Hardhat node
npm run node

# In another terminal, deploy contracts
npm run deploy
```

## Project Structure

```
web3/
├── contracts/              # Smart contracts
│   └── ChallengeContract.sol
├── lit-actions/           # Lit Protocol integration
│   ├── verifyStravaActivity.js  # Main verification logic
│   ├── helpers.js
│   ├── validation.js
│   └── types/
│       └── strava.ts
├── scripts/               # Deployment & testing scripts
│   ├── deploy-sepolia-with-oracle.ts
│   ├── mint-pkp.ts
│   ├── mock-strava-server.ts
│   ├── test-lit-action-local.ts
│   └── e2e-sepolia-test.ts
├── test/                  # Test suites
│   ├── ChallengeContract.ts       # 25 tests
│   └── LitOracleIntegration.ts    # 14 tests
├── envio/                 # ⚠️ Phase 3+ - NOT ACTIVE
│   ├── README.md          # See this for details
│   ├── config.yaml
│   └── schema.graphql
├── TESTING.md             # Comprehensive testing guide
└── README.md              # This file
```

### About the `envio/` Folder

The `envio/` directory contains **preparatory work for Phase 3+** (Frontend/Mobile Integration). It's a blockchain indexer configuration that will provide a GraphQL API for the mobile app to query challenge data efficiently.

**Current Status**: Not active, not part of Phase 2
**See**: `envio/README.md` for details

### Testnet Deployment

```bash
# Deploy original contract to Sepolia
npx hardhat ignition deploy --network sepolia ignition/modules/ChallengeContract.ts

# Or use simplified deployment script
npm run deploy-sepolia

# Deploy ENHANCED contract with activity data events
npm run deploy-enhanced
```

**Enhanced Contract**: Emits detailed Strava activity data (timestamp, distance, duration, activity ID) in events. After deployment:
- Configuration saved to `deployment-enhanced.json`
- Backend auto-loads enhanced config
- Set oracle: `ENHANCED_CONTRACT_ADDRESS=<address> npm run set-oracle`
- Test: `npm run test-enhanced`
- Full guide: [ENHANCED_CONTRACT.md](./ENHANCED_CONTRACT.md)

## Contract Events

The contract emits the following events for indexing:

- `ChallengeCreated` - When a new challenge is created
- `UserJoined` - When a user joins a challenge
- `TaskCompleted` - When oracle marks a user as completed
- `ChallengeFinalized` - When challenge ends and winnings are calculated
- `WinningsDistributed` - When winners withdraw their winnings


## Security Features

- **Access Control**: Owner and oracle-only functions properly protected
- **Reentrancy Protection**: Safe withdrawal patterns implemented
- **Input Validation**: All inputs validated with appropriate error messages
- **Time-based Logic**: Challenge timing properly enforced

## Oracle Architecture (Phase 2)

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   User       │     │ Lit Action  │     │  Contract    │
│  Completes   │────▶│  (datil-    │────▶│  (Sepolia)   │
│  Run         │     │   test)     │     │              │
└──────────────┘     └─────────────┘     └──────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ Strava API  │
                    │   (Mock)    │
                    └─────────────┘
```

**Oracle Flow**:
1. User completes run and syncs to Strava
2. Lit Action fetches activity data from Strava API
3. Validates distance, type, and timestamp
4. Signs transaction with PKP wallet
5. Calls `markTaskComplete()` on contract

## Phase 2: Lit Protocol Integration

### Available Scripts

```bash
# Phase 2 Testing
npm run mock-strava           # Start mock Strava server
npm run test-lit-local        # Test Lit Action locally
npm run mint-pkp              # Mint PKP for oracle
npm run deploy-sepolia-oracle # Deploy with oracle setup
npm run test-lit-sepolia      # E2E test on Sepolia
```

### Documentation

- **[Testing Guide](TESTING.md)** - Comprehensive testing documentation
- **[Lit Protocol Guide](docs/LIT_PROTOCOL_GUIDE.md)** - Oracle integration details
- **[Deployment Guide](DEPLOYMENT.md)** - Sepolia deployment instructions

## Next Phases

- **Phase 3**: Frontend/Mobile App with Envio indexer
- **Phase 4**: Enhanced features and analytics
- **Phase 5**: Mainnet preparation

## Development Notes

- Uses Hardhat 3 with viem for modern Ethereum development
- Native Node.js test runner for optimal performance
- TypeScript throughout for type safety
- Follows Solidity best practices and security patterns

## License

MIT License - see LICENSE file for details
