# Envio Indexer - Future Phase

> ⚠️ **NOTE**: This is preparatory work for **Phase 3+** (Frontend/Mobile Integration). It is NOT part of Phase 2 and is not currently active.

## What is This?

This folder contains configuration for an **Envio blockchain indexer** that will:
- Index all ChallengeContract events (ChallengeCreated, UserJoined, TaskCompleted, etc.)
- Provide a GraphQL API for efficient querying
- Enable fast data retrieval for the mobile app

## Why Not Active Now?

Phase 2 focuses on the **oracle integration** between Lit Protocol and the smart contract. The indexer is useful for frontend applications but isn't needed for core oracle functionality.

## When Will This Be Used?

**Phase 3+**: Mobile App Integration
- When the React Native app needs to query challenges
- To display user activity history
- To show leaderboards and statistics

## Setup (Future)

When ready to use:

```bash
cd envio
npm install
npm run codegen
npm run dev
```

## Current Status

- ✅ Schema defined (`schema.graphql`)
- ✅ Event handlers configured (`config.yaml`)
- ❌ Not installed or running
- ❌ Not tested
- ❌ Not part of Phase 2 deliverables

## Integration Plan

1. Deploy ChallengeContract to target network
2. Update `config.yaml` with correct contract address
3. Install Envio dependencies
4. Run codegen to generate TypeScript types
5. Implement event handlers
6. Deploy indexer
7. Connect mobile app to GraphQL endpoint

---

**For Phase 2**: Ignore this folder. Focus on the oracle integration in `lit-actions/` and `scripts/`.

