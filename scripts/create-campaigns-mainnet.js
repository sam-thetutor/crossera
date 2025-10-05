const { ethers } = require('ethers');
require('dotenv').config({ path: '.env' });

async function main() {
  const rpcUrl = "https://rpc.mainnet.ms";
  const contractAddress = "0x73062e6e527a517c2b53b93C7BF02E308270AEF0";

  console.log("🎯 Creating campaigns on MAINNET contract...\n");
  console.log("RPC URL:", rpcUrl);
  console.log("Contract:", contractAddress);
  console.log("");

  // Create provider
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Create wallet from deployer private key
  const deployerPrivateKey = process.env.PRIVATE_KEY;
  if (!deployerPrivateKey) {
    console.error("❌ PRIVATE_KEY not found in .env");
    return;
  }
  
  const deployerWallet = new ethers.Wallet(deployerPrivateKey, provider);
  console.log("Deployer (creating from):", deployerWallet.address);
  console.log("");

  // Contract ABI for createCampaign
  const contractABI = [
    "function createCampaign(uint64 startDate, uint64 endDate) payable returns (uint32)",
    "function campaigns(uint256 id) view returns (uint256 campaignId, string memory name, string memory description, uint256 totalPool, uint256 distributedRewards, bool isActive, address createdBy, uint256 startDate, uint256 endDate)",
    "function totalCampaigns() view returns (uint256)"
  ];

  const contract = new ethers.Contract(contractAddress, contractABI, deployerWallet);

  try {
    // Check current campaign count
    const currentCount = await contract.totalCampaigns();
    console.log("📊 Current campaigns on contract:", currentCount.toString());
    console.log("");

    // Campaign data from database
    const campaigns = [
      {
        id: 1,
        name: "Hello World campaign",
        startDate: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        endDate: Math.floor(Date.now() / 1000) + (30 * 24 * 3600), // 30 days
        pool: "0.3" // 0.3 XFI
      },
      {
        id: 2,
        name: "Summer camp",
        startDate: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        endDate: Math.floor(Date.now() / 1000) + (30 * 24 * 3600), // 30 days
        pool: "0.3" // 0.3 XFI
      },
      {
        id: 3,
        name: "test campaign",
        startDate: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        endDate: Math.floor(Date.now() / 1000) + (30 * 24 * 3600), // 30 days
        pool: "0.3" // 0.3 XFI
      }
    ];

    for (const campaign of campaigns) {
      console.log(`🎯 Creating campaign: ${campaign.name}`);
      console.log(`   Start: ${new Date(campaign.startDate * 1000).toLocaleString()}`);
      console.log(`   End: ${new Date(campaign.endDate * 1000).toLocaleString()}`);
      console.log(`   Pool: ${campaign.pool} XFI`);
      
      try {
        const tx = await contract.createCampaign(
          campaign.startDate,
          campaign.endDate,
          { value: ethers.parseEther(campaign.pool) }
        );
        
        console.log(`   Transaction hash: ${tx.hash}`);
        console.log(`   ⏳ Waiting for confirmation...`);
        
        const receipt = await tx.wait();
        console.log(`   ✅ Campaign created! Block: ${receipt.blockNumber}`);
        console.log("");
        
      } catch (error) {
        console.log(`   ❌ Error creating campaign: ${error.message}`);
        console.log("");
      }
    }

    // Check final campaign count
    const finalCount = await contract.totalCampaigns();
    console.log("📊 Final campaigns on contract:", finalCount.toString());
    
    if (parseInt(finalCount) > parseInt(currentCount)) {
      console.log("🎉 Successfully created campaigns on mainnet!");
    } else {
      console.log("❌ No campaigns were created");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
