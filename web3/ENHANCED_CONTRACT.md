# Enhanced Contract with Activity Data Events

## Overview

The enhanced ChallengeContract emits detailed Strava activity data in the `TaskCompleted` event, enabling the UI to display participant completion details without requiring a separate database.

## New Event Structure

### TaskCompleted Event

```solidity
event TaskCompleted(
    uint256 indexed challengeId,
    address indexed user,
    uint256 completionTimestamp,
    uint256 distance,
    uint256 duration,
    string stravaActivityId
);
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `challengeId` | uint256 (indexed) | ID of the challenge |
| `user` | address (indexed) | Address of participant who completed |
| `completionTimestamp` | uint256 | Unix timestamp when activity was completed |
| `distance` | uint256 | Actual distance covered in meters |
| `duration` | uint256 | Activity duration in seconds |
| `stravaActivityId` | string | Strava activity ID for linking |

## Updated Function Signature

### markTaskComplete

```solidity
function markTaskComplete(
    uint256 challengeId,
    address userAddress,
    uint256 completionTimestamp,
    uint256 distance,
    uint256 duration,
    string memory stravaActivityId
) external onlyAuthorizedOracle
```

**Authorization**: Only the authorized oracle can call this function

**Parameters**:
- `challengeId`: The challenge ID
- `userAddress`: Address of the participant
- `completionTimestamp`: When the run was completed (Unix timestamp)
- `distance`: Distance in meters (e.g., 5200 for 5.2km)
- `duration`: Duration in seconds (e.g., 1800 for 30 minutes)
- `stravaActivityId`: Strava's activity ID (e.g., "12345678")

## Querying Events from React Native

### Using viem/ethers

```typescript
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY')
});

// Query TaskCompleted events for a specific challenge
const logs = await publicClient.getLogs({
  address: '0xYourContractAddress',
  event: {
    type: 'event',
    name: 'TaskCompleted',
    inputs: [
      { type: 'uint256', indexed: true, name: 'challengeId' },
      { type: 'address', indexed: true, name: 'user' },
      { type: 'uint256', name: 'completionTimestamp' },
      { type: 'uint256', name: 'distance' },
      { type: 'uint256', name: 'duration' },
      { type: 'string', name: 'stravaActivityId' }
    ]
  },
  args: {
    challengeId: BigInt(challengeId)
  },
  fromBlock: startBlock,
  toBlock: 'latest'
});

// Process the logs
logs.forEach(log => {
  const { user, completionTimestamp, distance, duration, stravaActivityId } = log.args;
  console.log(`User ${user} completed at ${new Date(Number(completionTimestamp) * 1000)}`);
  console.log(`Distance: ${distance}m, Duration: ${duration}s`);
  console.log(`Strava: https://www.strava.com/activities/${stravaActivityId}`);
});
```

### Using Alchemy SDK

```typescript
import { Alchemy, Network } from 'alchemy-sdk';

const alchemy = new Alchemy({
  apiKey: 'YOUR_API_KEY',
  network: Network.ETH_SEPOLIA
});

const logs = await alchemy.core.getLogs({
  address: contractAddress,
  topics: [
    // TaskCompleted event signature
    '0x...',
    // challengeId (indexed)
    ethers.utils.hexZeroPad(ethers.utils.hexlify(challengeId), 32)
  ],
  fromBlock: startBlock,
  toBlock: 'latest'
});
```

## Example: Display Participant Details in UI

```typescript
// Fetch completion details for all participants
async function getParticipantDetails(challengeId: number) {
  // Get participants from contract
  const participants = await contract.getChallengeParticipants(challengeId);
  
  // Get TaskCompleted events
  const completionLogs = await publicClient.getLogs({
    address: contractAddress,
    event: taskCompletedEvent,
    args: { challengeId: BigInt(challengeId) }
  });
  
  // Combine data
  return participants.map(address => {
    const completionLog = completionLogs.find(
      log => log.args.user.toLowerCase() === address.toLowerCase()
    );
    
    return {
      address,
      hasCompleted: !!completionLog,
      completionTime: completionLog ? new Date(Number(completionLog.args.completionTimestamp) * 1000) : null,
      distance: completionLog ? Number(completionLog.args.distance) : null,
      duration: completionLog ? Number(completionLog.args.duration) : null,
      stravaUrl: completionLog ? `https://www.strava.com/activities/${completionLog.args.stravaActivityId}` : null,
      pace: completionLog ? (Number(completionLog.args.duration) / 60) / (Number(completionLog.args.distance) / 1000) : null // min/km
    };
  });
}

// Display in React Native
function ParticipantList({ challengeId }) {
  const [participants, setParticipants] = useState([]);
  
  useEffect(() => {
    getParticipantDetails(challengeId).then(setParticipants);
  }, [challengeId]);
  
  return (
    <FlatList
      data={participants}
      renderItem={({ item }) => (
        <View>
          <Text>{item.address}</Text>
          {item.hasCompleted && (
            <>
              <Text>✅ Completed at {item.completionTime.toLocaleString()}</Text>
              <Text>Distance: {item.distance}m in {item.duration}s</Text>
              <Text>Pace: {item.pace.toFixed(2)} min/km</Text>
              <TouchableOpacity onPress={() => Linking.openURL(item.stravaUrl)}>
                <Text style={{ color: 'blue' }}>View on Strava</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    />
  );
}
```

## Future: Envio GraphQL Integration

When Envio indexer is set up, you can query with GraphQL:

```graphql
query GetChallengeWithDetails($challengeId: String!) {
  challenge(id: $challengeId) {
    description
    targetDistance
    participants {
      userAddress
      hasCompleted
      joinedAt
      completionData {
        timestamp
        distance
        duration
        stravaActivityId
      }
    }
  }
}
```

This will be much faster than querying events directly.

## Migration from Old Contract

### If Using Original Contract (0x21854089...)

1. The old contract remains functional
2. For new challenges requiring activity data, use the enhanced contract
3. Update your React Native app to point to the new contract address
4. Backend will automatically use the new function selector from `deployment-enhanced.json`

### Steps to Migrate

1. Deploy enhanced contract: `npm run deploy-enhanced`
2. Note the new contract address from `deployment-enhanced.json`
3. Set oracle: `ENHANCED_CONTRACT_ADDRESS=<new> npm run set-oracle`
4. Test: `npm run test-enhanced`
5. Update React Native:
   ```typescript
   const CONTRACT_ADDRESS = '0xNewEnhancedAddress';
   ```

## Gas Cost Comparison

| Operation | Old Contract | Enhanced Contract | Difference |
|-----------|--------------|-------------------|------------|
| markTaskComplete | ~45,000 gas | ~50,000 gas | +5,000 gas |
| Cost at 1 gwei | ~0.000045 ETH | ~0.00005 ETH | +$0.0001 |

**Impact**: Minimal. The enhanced events add ~5,000 gas per verification, which is negligible on Sepolia testnet and acceptable on mainnet.

## Benefits

✅ **No separate database needed** for basic activity info  
✅ **Decentralized data storage** on blockchain  
✅ **Transparent verification** - anyone can query events  
✅ **Easier UI development** - direct blockchain queries  
✅ **Future-proof** for Envio/The Graph indexing  

## Limitations

⚠️ **Cannot store**: Full route maps, photos, detailed splits  
⚠️ **Event logs** are permanent but can be expensive on mainnet  
⚠️ **Query performance** - direct event queries are slower than indexed data  

**Solution for limitations**: Use Envio indexer (Phase 3) for fast GraphQL queries, or store large data off-chain and reference it via `stravaActivityId`.

## Contract Addresses

| Network | Contract Type | Address |
|---------|---------------|---------|
| Sepolia | Original | 0xbaf067fe68f032d9fdc906c6dcb32299baa2404f       |
| Sepolia | Enhanced | (from deployment-enhanced.json) |

## Support

For issues or questions:
- Check `deployment-enhanced.json` for current contract address
- Verify function selector matches the deployed contract
- Test with `npm run test-enhanced`
- Review Etherscan for event logs

---

**Status**: Ready for hackathon demo and production use! 🚀

