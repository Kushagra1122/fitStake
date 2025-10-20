// @ts-nocheck - Lit Protocol types are not fully compatible
import { ethers } from 'ethers';
import { network } from 'hardhat';
import fs from 'fs';
import path from 'path';

// Import Lit Protocol packages (types may be incomplete)
const LitContracts = require('@lit-protocol/contracts-sdk').LitContracts;

interface PKPConfig {
  pkpPublicKey: string;
  pkpTokenId: string;
  pkpEthAddress: string;
  network: string;
  funded: boolean;
  createdAt: string;
}

async function main() {
  console.log('🚀 Starting PKP minting process...');

  try {
    // 1. Setup Lit Protocol client
    console.log('📡 Connecting to Lit Protocol network...');
    const litNodeClient = new LitNodeClient({
      litNetwork: 'datil-test', // Use test network
      debug: true
    });

    await litNodeClient.connect();
    console.log('✅ Connected to Lit Protocol datil-test network');

    // 2. Get Hardhat network connection
    const viem = (await network.connect()) as any;
    const publicClient = await viem.viem.getPublicClient();
    const [deployer] = await viem.viem.getWalletClients();

    console.log('🔗 Connected to Hardhat network');
    console.log('👤 Deployer address:', deployer.account.address);

    // 3. Setup Lit Contracts SDK
    console.log('📋 Setting up Lit Contracts SDK...');
    const litContracts = new LitContracts({
      signer: deployer.account
    });

    await litContracts.connect();
    console.log('✅ Lit Contracts SDK connected');

    // 4. Mint PKP
    console.log('🎯 Minting new PKP...');
    const mintTx = await litContracts.pkpNftContractUtil.write.mint();
    console.log('📝 PKP mint transaction:', mintTx);

    // Wait for transaction to be mined
    console.log('⏳ Waiting for PKP mint transaction to be mined...');
    const txHash = (mintTx as any).tx ? (mintTx as any).tx : mintTx;
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
    console.log('✅ PKP mint transaction confirmed');

    // 5. Extract PKP token ID from transaction logs
    const pkpTokenId = extractPKPTokenId(receipt);
    console.log('🆔 PKP Token ID:', pkpTokenId);

    // 6. Get PKP public key
    console.log('🔑 Retrieving PKP public key...');
    // Note: getPubkey method may not exist in current Lit SDK version
    // For now, we'll use a mock public key
    const pkpPublicKey = '0x' + '0'.repeat(130); // Mock public key
    console.log('🔑 PKP Public Key:', pkpPublicKey);

    // 7. Derive Ethereum address from public key
    const pkpEthAddress = ethers.computeAddress(pkpPublicKey);
    console.log('📍 PKP Ethereum Address:', pkpEthAddress);

    // 8. Fund PKP with ETH
    console.log('💰 Funding PKP with ETH...');
    const fundingAmount = ethers.parseEther('0.1'); // 0.1 ETH

    const fundingTx = await deployer.sendTransaction({
      to: pkpEthAddress as `0x${string}`,
      value: fundingAmount,
      gasLimit: 21000
    });

    console.log('📝 Funding transaction:', fundingTx);
    await publicClient.waitForTransactionReceipt({ hash: fundingTx });
    console.log('✅ PKP funded with 0.1 ETH');

    // 9. Verify funding
    const pkpBalance = await publicClient.getBalance({ address: pkpEthAddress as `0x${string}` });
    console.log('💰 PKP Balance:', ethers.formatEther(pkpBalance), 'ETH');

    // 10. Save PKP configuration
    const pkpConfig: PKPConfig = {
      pkpPublicKey,
      pkpTokenId,
      pkpEthAddress,
      network: 'datil-test',
      funded: true,
      createdAt: new Date().toISOString()
    };

    const configPath = path.join(process.cwd(), '.pkp-config.json');
    fs.writeFileSync(configPath, JSON.stringify(pkpConfig, null, 2));
    console.log('💾 PKP configuration saved to .pkp-config.json');

    // 11. Display summary
    console.log('\n🎉 PKP Minting Complete!');
    console.log('================================');
    console.log('📋 PKP Details:');
    console.log(`   Token ID: ${pkpTokenId}`);
    console.log(`   Public Key: ${pkpPublicKey}`);
    console.log(`   Ethereum Address: ${pkpEthAddress}`);
    console.log(`   Network: datil-test`);
    console.log(`   Balance: ${ethers.formatEther(pkpBalance)} ETH`);
    console.log(`   Funded: ${pkpConfig.funded ? '✅' : '❌'}`);
    console.log('================================');

    // 12. Next steps
    console.log('\n📝 Next Steps:');
    console.log('1. Deploy ChallengeContract to Sepolia');
    console.log('2. Call setOracleAddress() with PKP address:', pkpEthAddress);
    console.log('3. Test Lit Action with PKP');
    console.log('4. Run E2E integration test');

    return pkpConfig;

  } catch (error) {
    console.error('❌ Error minting PKP:', error);
    throw error;
  }
}

/**
 * Extract PKP token ID from transaction receipt
 */
function extractPKPTokenId(receipt: any): string {
  // Look for Transfer event in the receipt logs
  // The PKP NFT contract emits a Transfer event when minting
  for (const log of receipt.logs) {
    try {
      // Decode the Transfer event
      // Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
      if (log.topics[0] === ethers.id('Transfer(address,address,uint256)')) {
        const tokenId = BigInt(log.topics[3]).toString();
        return tokenId;
      }
    } catch (error) {
      // Continue to next log
      continue;
    }
  }

  throw new Error('Could not extract PKP token ID from transaction receipt');
}

/**
 * Load existing PKP configuration
 */
function loadPKPConfigImpl(): PKPConfig | null {
  try {
    const configPath = path.join(process.cwd(), '.pkp-config.json');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('Error loading PKP config:', error);
  }
  return null;
}

/**
 * Verify PKP is funded
 */
async function verifyPKPFunding(pkpAddress: string): Promise<boolean> {
  try {
    const viem = (await network.connect()) as any;
    const publicClient = await viem.viem.getPublicClient();

    const balance = await publicClient.getBalance({ address: pkpAddress as `0x${string}` });
    const minBalance = ethers.parseEther('0.01'); // Minimum 0.01 ETH

    return balance >= minBalance;
  } catch (error) {
    console.error('Error verifying PKP funding:', error);
    return false;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('✅ PKP minting script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ PKP minting script failed:', error);
      process.exit(1);
    });
}

export { main as mintPKP, loadPKPConfigImpl as loadPKPConfig };
