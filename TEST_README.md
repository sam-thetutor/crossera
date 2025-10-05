# CrossEra SDK Test Scripts

This directory contains test scripts to verify the published `crossera-sdk` npm package functionality.

## Files

- `test-npm-package.js` - JavaScript test script (CommonJS)
- `test-npm-package.ts` - TypeScript test script (ES Modules)
- `test-package.json` - Package configuration for running tests
- `TEST_README.md` - This file

## Quick Start

### Option 1: Test with JavaScript (Recommended)

```bash
# Install the published package
npm install crossera-sdk

# Run the test script
node test-npm-package.js
```

### Option 2: Test with TypeScript

```bash
# Install the published package and dev dependencies
npm install crossera-sdk ts-node typescript @types/node

# Run the TypeScript test script
npx ts-node test-npm-package.ts
```

### Option 3: Use the test package.json

```bash
# Copy the test package.json
cp test-package.json package.json

# Install dependencies and run tests
npm install
npm run test
```

## What the Tests Do

The test scripts verify:

1. **SDK Initialization** - Ensures the SDK can be imported and instantiated
2. **Network Configuration** - Tests network setup and configuration methods
3. **Input Validation** - Verifies validation of invalid addresses and transaction hashes
4. **Error Handling** - Tests proper error handling for network/server issues
5. **TypeScript Support** - Validates TypeScript types and compilation (TypeScript version only)

## Expected Results

The tests will show:
- ✅ Successful operations (initialization, validation)
- ⚠️ Expected errors (network/server errors when API is unreachable)
- ❌ Unexpected errors (should not occur)

## Test Scenarios

### Validation Tests
- Invalid address format → Should return 400 error
- Invalid transaction hash → Should return 400 error

### Network Tests
- Valid address → Expects network/server error (API unreachable)
- Valid transaction hash → Expects network/server error (API unreachable)
- Different networks → Tests both 'testnet' and 'mainnet' configurations

### TypeScript Tests (TypeScript version only)
- Type checking → Ensures TypeScript types work correctly
- Compilation → Verifies the package compiles without errors

## Troubleshooting

### Common Issues

1. **Package not found**
   ```bash
   npm install crossera-sdk
   ```

2. **TypeScript errors**
   ```bash
   npm install ts-node typescript @types/node
   ```

3. **Permission errors**
   ```bash
   chmod +x test-npm-package.js
   chmod +x test-npm-package.ts
   ```

### Expected Network Errors

The tests are designed to expect network errors when the API endpoints are unreachable. This is normal behavior and indicates the SDK is working correctly.

## Integration with CI/CD

These test scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Test CrossEra SDK
  run: |
    npm install crossera-sdk
    node test-npm-package.js
```

## Contributing

To add new tests:

1. Add test cases to either `test-npm-package.js` or `test-npm-package.ts`
2. Follow the existing pattern of console.log with emojis
3. Test both success and error scenarios
4. Update this README if adding new test categories
