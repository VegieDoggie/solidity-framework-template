[中文](https://github.com/VegieDoggie/solidity-framework-template/blob/main/README.md) / English

# Universal Solidity Development and Testing Framework

Core Operations:

1. **Compilation**:
    - `npx hardhat compile`
    - `forge compile` | `forge build`

2. **Testing**:
    - `npx hardhat test`
    - `forge test`

3. **Local Node Network [Recommended to use `hardhat`]**:
    - `npx hardhat node`

4. **Run TypeScript (TS) script on a specified blockchain network (e.g., deployment)**:
    - `npx hardhat --network <networkName> run <scriptPath>`

5. Refresh the hardhat networks (automatically selects the best network):

    - `sol networks` // refresh all
    - `sol networks mainnet` // only refresh mainnet network
