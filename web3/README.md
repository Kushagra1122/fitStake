# FitStake Web3 - Phase 1 Complete

A Web3 mobile application that merges real-world running activities with crypto staking and betting mechanics, powered by decentralized smart contracts.

## Phase 1 Status: ✅ COMPLETE

This phase establishes the core smart contract infrastructure for fitness challenges with ETH staking.

### What's Implemented

- **ChallengeContract.sol**: Complete smart contract for managing fitness challenges
- **Comprehensive Test Suite**: Full test coverage using Hardhat 3's native test runner with viem
- **Deployment Infrastructure**: Hardhat Ignition deployment module
- **Envio Indexer Setup**: Basic indexer structure with GraphQL schema

### Contract Features

- **Challenge Creation**: Users can create running challenges with specific distance targets and stake amounts
- **ETH Staking**: Participants stake ETH to join challenges
- **Oracle Verification**: Placeholder for Lit Protocol integration (Phase 2)
- **Automatic Distribution**: Failed participants' stakes are distributed to successful completers
- **Binary Challenge System**: Complete or fail - no partial completion

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

### Installation

```bash
cd web3
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/ChallengeContract.ts

# Run with coverage
npx hardhat coverage
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

### Testnet Deployment

```bash
# Deploy to Sepolia (requires SEPOLIA_PRIVATE_KEY environment variable)
npx hardhat ignition deploy --network sepolia ignition/modules/ChallengeContract.ts
```

## Contract Events

The contract emits the following events for indexing:

- `ChallengeCreated` - When a new challenge is created
- `UserJoined` - When a user joins a challenge
- `TaskCompleted` - When oracle marks a user as completed
- `ChallengeFinalized` - When challenge ends and winnings are calculated
- `WinningsDistributed` - When winners withdraw their winnings

## Envio Indexer

Basic indexer setup is included in `/envio` directory:

- **Schema**: GraphQL schema defining Challenge and Participant entities
- **Config**: YAML configuration for event indexing
- **Package**: Separate package.json for indexer dependencies

To initialize the full Envio indexer:

```bash
cd envio
pnpx envio init
```

## Security Features

- **Access Control**: Owner and oracle-only functions properly protected
- **Reentrancy Protection**: Safe withdrawal patterns implemented
- **Input Validation**: All inputs validated with appropriate error messages
- **Time-based Logic**: Challenge timing properly enforced

## Phase 2 Status: ✅ COMPLETE

This phase adds Lit Protocol integration for decentralized Strava verification oracle.

### What's Implemented

- **Lit Protocol Integration**: Complete oracle system using PKPs and Lit Actions
- **Mock Strava Server**: Local testing infrastructure with realistic data
- **PKP Management**: Automated minting, funding, and configuration
- **Comprehensive Testing**: Local, Hardhat, and Sepolia testnet tests
- **Deployment Scripts**: Automated Sepolia deployment with oracle linking

### Oracle Architecture

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

### Key Features

- **Decentralized Oracle**: PKP-controlled verification system
- **Automatic Verification**: Lit Actions validate Strava activities
- **Mock Data Support**: Complete testing without real API calls
- **Sepolia Deployment**: Production-ready testnet deployment
- **Comprehensive Tests**: 25+ test cases covering all scenarios

### Usage

#### Local Testing
```bash
# Start mock Strava server
npm run mock-strava

# Test Lit Action locally
npm run test-lit-local

# Test Hardhat integration
npm run test-lit-hardhat
```

#### Sepolia Deployment
```bash
# Mint PKP and deploy to Sepolia
npm run deploy-sepolia-oracle

# Run E2E test on Sepolia
npm run test-lit-sepolia
```

#### Integration Tests
```bash
# Run comprehensive test suite
npm test test/LitOracleIntegration.ts
```

### Documentation

- **[Lit Protocol Guide](docs/LIT_PROTOCOL_GUIDE.md)** - Complete integration guide
- **[Deployment Guide](DEPLOYMENT.md)** - Sepolia deployment instructions

## Next Phases

- **Phase 3**: Complete Envio indexer implementation
- **Phase 4**: Betting contract and user statistics  
- **Phase 5**: Testnet deployment and finalization

## Development Notes

- Uses Hardhat 3 with viem for modern Ethereum development
- Native Node.js test runner for optimal performance
- TypeScript throughout for type safety
- Follows Solidity best practices and security patterns

## License

MIT License - see LICENSE file for details
