// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ChallengeContract
 * @dev Smart contract for managing fitness challenges with ETH staking
 * @author FitStake Team
 */
contract ChallengeContract {
    // ============ STRUCTS ============
    
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

    // ============ STATE VARIABLES ============
    
    uint256 public nextChallengeId;
    address public authorizedOracle;
    address public owner;

    mapping(uint256 => ChallengeDetails) public challenges;
    mapping(uint256 => mapping(address => Participant)) public participants;
    mapping(uint256 => address[]) public challengeParticipants;

    // ============ EVENTS ============
    
    event ChallengeCreated(
        uint256 indexed challengeId,
        address indexed creator,
        string description,
        uint256 stakeAmount,
        uint256 startTime,
        uint256 endTime,
        uint256 targetDistance
    );
    
    event UserJoined(
        uint256 indexed challengeId,
        address indexed user,
        uint256 stakedAmount
    );
    
    event TaskCompleted(
        uint256 indexed challengeId,
        address indexed user,
        uint256 completionTimestamp,
        uint256 distance,
        uint256 duration,
        string stravaActivityId
    );
    
    event ChallengeFinalized(
        uint256 indexed challengeId,
        uint256 totalWinners,
        uint256 totalLosers
    );
    
    event WinningsDistributed(
        uint256 indexed challengeId,
        address indexed winner,
        uint256 amount
    );

    // ============ MODIFIERS ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorizedOracle() {
        require(msg.sender == authorizedOracle, "Only authorized oracle can call this function");
        _;
    }

    modifier challengeExists(uint256 challengeId) {
        require(challenges[challengeId].creator != address(0), "Challenge does not exist");
        _;
    }

    modifier challengeActive(uint256 challengeId) {
        require(
            block.timestamp >= challenges[challengeId].startTime && 
            block.timestamp <= challenges[challengeId].endTime,
            "Challenge is not active"
        );
        _;
    }

    // ============ CONSTRUCTOR ============
    
    constructor() {
        owner = msg.sender;
        nextChallengeId = 1;
    }

    // ============ CORE FUNCTIONS ============

    /**
     * @dev Create a new fitness challenge
     * @param description Description of the challenge
     * @param targetDistance Target distance in meters
     * @param stakeAmount Required ETH stake amount
     * @param duration Duration of the challenge in seconds
     */
    function createChallenge(
        string memory description,
        uint256 targetDistance,
        uint256 stakeAmount,
        uint256 duration
    ) external {
        require(targetDistance > 0, "Target distance must be greater than 0");
        require(stakeAmount > 0, "Stake amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");

        uint256 challengeId = nextChallengeId;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;

        challenges[challengeId] = ChallengeDetails({
            challengeId: challengeId,
            creator: msg.sender,
            description: description,
            targetDistance: targetDistance,
            stakeAmount: stakeAmount,
            startTime: startTime,
            endTime: endTime,
            totalStaked: 0,
            participantCount: 0,
            finalized: false
        });

        nextChallengeId++;

        emit ChallengeCreated(
            challengeId,
            msg.sender,
            description,
            stakeAmount,
            startTime,
            endTime,
            targetDistance
        );
    }

    /**
     * @dev Join a challenge by staking ETH
     * @param challengeId ID of the challenge to join
     */
    function joinChallenge(uint256 challengeId) 
        external 
        payable 
        challengeExists(challengeId)
        challengeActive(challengeId)
    {
        ChallengeDetails storage challenge = challenges[challengeId];
        
        require(msg.value == challenge.stakeAmount, "Incorrect stake amount");
        require(participants[challengeId][msg.sender].userAddress == address(0), "Already joined this challenge");

        participants[challengeId][msg.sender] = Participant({
            userAddress: msg.sender,
            hasCompleted: false,
            hasWithdrawn: false,
            stakedAmount: msg.value
        });

        challengeParticipants[challengeId].push(msg.sender);
        challenge.totalStaked += msg.value;
        challenge.participantCount++;

        emit UserJoined(challengeId, msg.sender, msg.value);
    }

    /**
     * @dev Mark a participant as having completed the challenge (oracle only)
     * @param challengeId ID of the challenge
     * @param userAddress Address of the user who completed the challenge
     * @param completionTimestamp Unix timestamp when the activity was completed
     * @param distance Distance covered in meters
     * @param duration Duration of activity in seconds
     * @param stravaActivityId Strava activity ID for reference
     */
    function markTaskComplete(
        uint256 challengeId,
        address userAddress,
        uint256 completionTimestamp,
        uint256 distance,
        uint256 duration,
        string memory stravaActivityId
    )
        external
        onlyAuthorizedOracle
        challengeExists(challengeId)
    {
        require(participants[challengeId][userAddress].userAddress != address(0), "User not a participant");
        require(!participants[challengeId][userAddress].hasCompleted, "User already marked as completed");

        participants[challengeId][userAddress].hasCompleted = true;

        emit TaskCompleted(
            challengeId,
            userAddress,
            completionTimestamp,
            distance,
            duration,
            stravaActivityId
        );
    }

    /**
     * @dev Finalize a challenge and calculate winnings distribution
     * @param challengeId ID of the challenge to finalize
     */
    function finalizeChallenge(uint256 challengeId)
        external
        challengeExists(challengeId)
    {
        ChallengeDetails storage challenge = challenges[challengeId];
        
        require(block.timestamp > challenge.endTime, "Challenge has not ended yet");
        require(!challenge.finalized, "Challenge already finalized");

        challenge.finalized = true;

        // Count winners and losers
        uint256 winnerCount = 0;
        uint256 loserCount = 0;
        uint256 totalLoserStakes = 0;

        for (uint256 i = 0; i < challengeParticipants[challengeId].length; i++) {
            address participant = challengeParticipants[challengeId][i];
            Participant storage participantData = participants[challengeId][participant];
            
            if (participantData.hasCompleted) {
                winnerCount++;
            } else {
                loserCount++;
                totalLoserStakes += participantData.stakedAmount;
            }
        }

        emit ChallengeFinalized(challengeId, winnerCount, loserCount);

        // If there are winners, distribute the loser stakes among them
        if (winnerCount > 0 && totalLoserStakes > 0) {
            uint256 winningsPerWinner = totalLoserStakes / winnerCount;
            
            for (uint256 i = 0; i < challengeParticipants[challengeId].length; i++) {
                address participant = challengeParticipants[challengeId][i];
                Participant storage participantData = participants[challengeId][participant];
                
                if (participantData.hasCompleted) {
                    participantData.stakedAmount += winningsPerWinner;
                }
            }
        }
    }

    /**
     * @dev Withdraw winnings after challenge finalization
     * @param challengeId ID of the challenge
     */
    function withdrawWinnings(uint256 challengeId)
        external
        challengeExists(challengeId)
    {
        ChallengeDetails storage challenge = challenges[challengeId];
        Participant storage participantData = participants[challengeId][msg.sender];
        
        require(challenge.finalized, "Challenge not finalized yet");
        require(participantData.userAddress != address(0), "Not a participant");
        require(!participantData.hasWithdrawn, "Already withdrawn");

        participantData.hasWithdrawn = true;
        
        uint256 amount = participantData.stakedAmount;
        require(amount > 0, "No winnings to withdraw");

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit WinningsDistributed(challengeId, msg.sender, amount);
    }

    /**
     * @dev Set the authorized oracle address (owner only)
     * @param oracleAddress Address of the oracle
     */
    function setOracleAddress(address oracleAddress) external onlyOwner {
        require(oracleAddress != address(0), "Oracle address cannot be zero");
        authorizedOracle = oracleAddress;
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get challenge details
     * @param challengeId ID of the challenge
     * @return ChallengeDetails struct
     */
    function getChallenge(uint256 challengeId) external view returns (ChallengeDetails memory) {
        require(challenges[challengeId].creator != address(0), "Challenge does not exist");
        return challenges[challengeId];
    }

    /**
     * @dev Get participant details
     * @param challengeId ID of the challenge
     * @param userAddress Address of the participant
     * @return Participant struct
     */
    function getParticipant(uint256 challengeId, address userAddress) external view returns (Participant memory) {
        require(participants[challengeId][userAddress].userAddress != address(0), "Not a participant");
        return participants[challengeId][userAddress];
    }

    /**
     * @dev Get all participants of a challenge
     * @param challengeId ID of the challenge
     * @return Array of participant addresses
     */
    function getChallengeParticipants(uint256 challengeId) external view returns (address[] memory) {
        require(challenges[challengeId].creator != address(0), "Challenge does not exist");
        return challengeParticipants[challengeId];
    }

    /**
     * @dev Check if a user is a participant in a challenge
     * @param challengeId ID of the challenge
     * @param userAddress Address to check
     * @return True if user is a participant
     */
    function isParticipant(uint256 challengeId, address userAddress) external view returns (bool) {
        return participants[challengeId][userAddress].userAddress != address(0);
    }
}
