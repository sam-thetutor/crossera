# 🦊 MetaMask Network Setup - CrossFi Testnet

## Issue: Wrong Network in MetaMask

If you see "MetaMask prompting for wrong network" or transaction fails, you need to add CrossFi Testnet to MetaMask.

---

## ✅ Automatic Network Switch (Built-In)

**Good news!** The application will automatically prompt you to switch networks when you try to register a project.

### **What Happens:**
1. You click "Submit & Register" in the registration form
2. App detects you're on wrong network
3. MetaMask prompts to switch to CrossFi Testnet
4. You approve the switch
5. Transaction proceeds on correct network

---

## 🔧 Manual Setup (If Needed)

### **Option 1: Add via Application**
The app will automatically add the network when you try to register a project. Just approve the MetaMask prompts.

### **Option 2: Add Manually**

1. **Open MetaMask**
2. Click network dropdown (top left)
3. Click "Add Network" or "Add a network manually"
4. Enter these details:

```
Network Name: CrossFi Testnet
RPC URL: https://rpc.testnet.ms/
Chain ID: 4157
Currency Symbol: XFI
Block Explorer: https://scan.testnet.crossfi.org
```

5. Click "Save"
6. Switch to "CrossFi Testnet"

---

## 🔍 How to Check Current Network

1. Open MetaMask
2. Look at the top - should say "CrossFi Testnet"
3. If it says anything else (Ethereum, Polygon, etc.), you need to switch

---

## 🚨 Common Issues & Solutions

### **Issue 1: "User rejected action"**
**Cause:** Wrong network selected in MetaMask

**Solution:**
```
1. The app will prompt to switch networks
2. Approve the network switch in MetaMask
3. Try registration again
```

### **Issue 2: "Network not found"**
**Cause:** CrossFi network not added to MetaMask

**Solution:**
```
1. When registering, approve "Add Network" prompt
2. Then approve "Switch Network" prompt
3. Transaction will proceed
```

### **Issue 3: "Insufficient funds"**
**Cause:** No XFI on CrossFi Testnet

**Solution:**
```
1. Make sure you have XFI on CrossFi Testnet (not Ethereum or other chains)
2. Get testnet XFI from CrossFi faucet
3. Check balance shows XFI (not ETH)
```

---

## 📋 Network Details Reference

### **CrossFi Testnet:**
- **Chain ID:** 4157 (0x103D in hex)
- **RPC URL:** https://rpc.testnet.ms/
- **Currency:** XFI
- **Explorer:** https://scan.testnet.crossfi.org
- **Faucet:** (Check CrossFi docs for testnet faucet)

### **CrossFi Mainnet:**
- **Chain ID:** 4158 (0x103E in hex)
- **RPC URL:** https://rpc.crossfi.org
- **Currency:** XFI
- **Explorer:** https://scan.crossfi.org

---

## ✅ Verification Steps

### **1. Check Network is Added**
```
MetaMask → Networks → Should see "CrossFi Testnet"
```

### **2. Check You're Connected**
```
MetaMask → Top bar should show "CrossFi Testnet"
```

### **3. Check Balance**
```
MetaMask → Should show "X.XX XFI" (not ETH or other)
```

### **4. Try Registration**
```
CrossEra App → Register Project → Should work without errors
```

---

## 🎯 Quick Fix Guide

**If registration fails with network error:**

1. **Check MetaMask Network**
   - Is it on "CrossFi Testnet"? ✅
   - If not, click network dropdown and select "CrossFi Testnet"

2. **If CrossFi Testnet Not in List**
   - Try registration again
   - Approve "Add Network" when prompted
   - Approve "Switch Network" when prompted

3. **Refresh Page and Try Again**
   - Sometimes MetaMask needs a refresh
   - Reconnect wallet
   - Try registration again

---

## 🔄 Expected Flow

```
1. Fill registration form
   ↓
2. Click "Submit & Register"
   ↓
3. Save to database ✓
   ↓
4. MetaMask prompts: "Switch to CrossFi Testnet?"
   ↓
5. You click "Switch Network" ✓
   ↓
6. MetaMask prompts: "Confirm Transaction"
   ↓
7. You click "Confirm" ✓
   ↓
8. Transaction sent to blockchain
   ↓
9. Wait for confirmation (~30 seconds)
   ↓
10. Success! ✓
```

---

## 💡 Pro Tips

1. **Always check network** before any blockchain action
2. **Bookmark CrossFi Testnet** in MetaMask for quick access
3. **Keep some XFI** in your testnet wallet for gas
4. **Double-check the network icon** (top of MetaMask)
5. **If in doubt**, switch networks manually before using the app

---

## 📞 Still Having Issues?

### **Error Messages:**

**"User rejected action"**
→ You declined the transaction. Try again and approve it.

**"Network not supported"**
→ CrossFi network not added. Approve the "Add Network" prompt.

**"Insufficient funds"**
→ Get more XFI from testnet faucet.

**"Transaction failed"**
→ Check gas limit and try again.

---

## ✅ Success Indicators

You're on the right network when:
- ✅ MetaMask shows "CrossFi Testnet" at the top
- ✅ Balance shows "XFI" (not ETH)
- ✅ Chain ID is 4157
- ✅ Registration succeeds without network errors

---

## 🎉 Once Setup is Complete

After adding CrossFi Testnet to MetaMask:
- ✅ Registration will work smoothly
- ✅ No more network errors
- ✅ Transactions go through
- ✅ You can interact with the app

**The app will handle network switching automatically!** 🚀

