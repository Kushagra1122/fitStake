import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

/**
 * Simple PKP Setup for Hackathon Demo
 * 
 * Creates a wallet that acts as the "oracle" for demonstration purposes.
 * For a hackathon, the concept of decentralized verification is what matters.
 */

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   🔐 Simple Oracle Wallet Setup               ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // Create a new random wallet
    console.log('🎲 Generating new oracle wallet...');
    const wallet = ethers.Wallet.createRandom();
    
    console.log('✅ Oracle wallet created!');
    console.log('   Address:', wallet.address);
    console.log('   Public Key:', wallet.publicKey);

    // Save configuration
    const config = {
      pkpPublicKey: wallet.publicKey,
      pkpTokenId: 'demo-' + Date.now(), // Mock token ID for demo
      pkpEthAddress: wallet.address,
      privateKey: wallet.privateKey, // IMPORTANT: Only for hackathon demo!
      network: 'sepolia',
      funded: false,
      createdAt: new Date().toISOString(),
      note: 'Demo oracle wallet for hackathon - in production, use real Lit Protocol PKP'
    };

    const configPath = path.join(process.cwd(), '.pkp-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log('\n✅ Configuration saved to .pkp-config.json');
    
    // Display funding instructions
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   💰 IMPORTANT: Fund the Oracle Wallet       ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n📍 Oracle Address:', wallet.address);
    console.log('\n🚰 Get Sepolia ETH from faucets:');
    console.log('   1. https://sepoliafaucet.com/');
    console.log('   2. https://www.alchemy.com/faucets/ethereum-sepolia');
    console.log('\n💵 Send 0.1-0.2 Sepolia ETH to the address above');
    console.log('\n✅ After funding, run: npm run set-oracle');

    // Security warning
    console.log('\n⚠️  SECURITY NOTE:');
    console.log('   This is a demo wallet for hackathon purposes.');
    console.log('   In production, use real Lit Protocol PKP (no private key exposure).');
    console.log('   Private key is saved locally - DO NOT commit to git!');

    return config;

  } catch (error) {
    console.error('\n❌ Error creating oracle wallet:', error);
    throw error;
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Setup completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });

export { main };

