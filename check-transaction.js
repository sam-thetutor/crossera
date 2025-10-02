const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env' });

async function main() {
  const contractAddress = "0x6342e9382A422697D8B4DB77A1c3cc0ACE7327F7";
  const txHash = process.argv[2] || "0xf07727eb76a47f5bc10a0e29065f5635973fb9fcf47fefa01cb9752836ee5af5";

  console.log("🔍 Checking Transaction...\n");
  console.log("Transaction Hash:", txHash);
  console.log("Contract:", contractAddress);
  console.log("");

  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.ms/');
  
  try {
    // Get transaction
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      console.log("❌ Transaction not found");
      return;
    }

    console.log("✅ Transaction found");
    console.log("From:", tx.from);
    console.log("To:", tx.to);
    console.log("Value:", ethers.formatEther(tx.value), "XFI");
    console.log("");

    // Get receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      console.log("⏳ Transaction not confirmed yet");
      return;
    }

    console.log("Status:", receipt.status === 1 ? "✅ Success" : "❌ Failed");
    console.log("Block:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());
    console.log("");

    // Check if it was to our contract
    if (tx.to?.toLowerCase() === contractAddress.toLowerCase()) {
      console.log("✅ Transaction was sent to CrossEra contract");
      
      // Try to decode the function call
      const contract = await ethers.getContractAt("CrossEraRewardSystem", contractAddress);
      const iface = contract.interface;
      
      try {
        const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
        console.log("Function called:", decoded.name);
        
        if (decoded.name === "registerApp") {
          console.log("\n🎯 registerApp() was called!");
          console.log("App ID:", decoded.args[0]);
          console.log("");
          
          // Check if app is now registered
          const isRegistered = await contract.registeredApps(decoded.args[0]);
          const owner = await contract.appOwners(decoded.args[0]);
          
          if (isRegistered) {
            console.log("✅ App IS registered on-chain");
            console.log("Owner:", owner);
          } else {
            console.log("❌ App is NOT registered (transaction may have failed)");
          }
        } else {
          console.log("Arguments:", decoded.args);
        }
      } catch (err) {
        console.log("Could not decode function call");
      }
    } else {
      console.log("⚠️  Transaction was NOT sent to CrossEra contract");
      console.log("It was sent to:", tx.to);
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

