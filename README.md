# FitStake 🏃‍♂️💎

A decentralized fitness challenge platform that combines Web3 technology with fitness tracking to create incentivized workout challenges.

![FitStake Banner](https://via.placeholder.com/800x200/EC4899/ffffff?text=FitStake+-+Decentralized+Fitness+Challenges)

## 🌟 Overview

FitStake is a React Native mobile application that allows users to create and join fitness challenges with cryptocurrency stakes. Users can set fitness goals, stake ETH, and earn rewards upon successful completion of their challenges, with activity verification through Strava integration.

## ✨ Features

### 🎯 Core Functionality
- **Create Challenges**: Set custom fitness goals with duration and stake amount
- **Join Challenges**: Participate in existing challenges with ETH stakes
- **Progress Tracking**: Monitor your challenge progress in real-time
- **Smart Contract Integration**: Secure, transparent challenge management on blockchain
- **Strava Integration**: Automatic activity verification and progress tracking

### 🏆 Challenge Types
- **Running** 🏃‍♂️ - Distance-based running challenges
- **Cycling** 🚴 - Cycling distance targets
- **Walking** 🚶 - Step count or distance goals
- **Swimming** 🏊 - Swimming distance challenges

### 💰 Staking & Rewards
- **ETH Staking**: Lock cryptocurrency as commitment to goals
- **Reward Distribution**: Automated payout upon challenge completion
- **Failed Challenge Handling**: Fair distribution of stakes for incomplete challenges
- **Transparent Transactions**: All transactions visible on blockchain

## 🛠 Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and build tools
- **Tailwind CSS** - Utility-first styling with `nativewind`
- **React Navigation** - Navigation and routing
- **Animated API** - Smooth animations and transitions

### Blockchain & Web3
- **Ethereum** - Blockchain network
- **Solidity** - Smart contract development
- **ethers.js** - Blockchain interaction
- **WalletConnect** - Web3 wallet integration
- **MetaMask** - Crypto wallet support

### Backend & Services
- **Envio** - Blockchain indexing and data service
- **Strava API** - Fitness activity data and verification
- **Smart Contracts** - Challenge logic and fund management

## 📱 Screens

### Main Application Flow
1. **Home** - Dashboard with active challenges and quick actions
2. **Join Challenge** - Browse and join available fitness challenges
3. **Create Challenge** - Set up new challenges with custom parameters
4. **My Challenges** - Track your ongoing and completed challenges
5. **Challenge Details** - Detailed view of specific challenge progress

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- MetaMask mobile wallet
- Strava account (for activity tracking)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kushagra1122/fitStake.git
   cd fitStake
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Configure the following variables:
   - `WALLET_CONNECT_PROJECT_ID`
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
   - `ENVIO_API_KEY`

4. **Start the development server**
   ```bash
   npx expo start
   ```

### Smart Contract Deployment

The project includes Solidity smart contracts for challenge management:

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat deploy --network <network-name>
```

## 🏗 Project Structure

```
fitStake/
├── app/                    # Main application code
│   ├── components/        # Reusable UI components
│   ├── context/          # React context providers
│   ├── services/         # API and blockchain services
│   └── utils/            # Helper functions and utilities
├── assets/               # Images, fonts, and static files
├── contracts/            # Solidity smart contracts
├── docs/                 # Documentation
└── tests/                # Test files
```

## 🔧 Configuration

### Wallet Setup
1. Install MetaMask mobile app
2. Connect to supported network (Sepolia testnet recommended for testing)
3. Ensure you have test ETH for staking

### Strava Integration
1. Create Strava developer application
2. Configure OAuth redirect URIs
3. Connect Strava account in app settings

## 🎨 UI/UX Features

- **Modern Design**: Clean, fitness-focused interface
- **Smooth Animations**: Engaging user interactions
- **Responsive Layout**: Optimized for mobile devices
- **Consistent Theme**: Pink and white color scheme
- **Intuitive Navigation**: Easy-to-use challenge flows

## 🔒 Security

- **Non-custodial**: Users maintain control of their funds
- **Smart Contract Audits**: Regular security reviews
- **Transparent Operations**: All transactions on blockchain
- **Secure Wallet Integration**: WalletConnect with proper authentication

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Detailed description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## 💬 Community

Join our community channels:
- [Discord](https://discord.gg/fitstake)
- [Twitter](https://twitter.com/fitstake)
- [Telegram](https://t.me/fitstake)

## 🙏 Acknowledgments

- Strava for fitness API integration
- Envio for blockchain data indexing
- Expo team for excellent React Native tooling
- Web3 community for blockchain infrastructure

## 📊 Roadmap

### Phase 1 ✅
- Basic challenge creation and joining
- ETH staking functionality
- Strava integration
- Mobile app development

### Phase 2 🚧
- Multi-chain support
- Advanced challenge types
- Social features
- NFT rewards

### Phase 3 📅
- Governance token
- DAO structure
- Cross-platform expansion
- Enterprise solutions

---

**Built with ❤️ for the Web3 and fitness communities**

For more information, visit our [website](https://fitstake.xyz) or check out our [documentation](https://docs.fitstake.xyz).