[中文](https://github.com/VegieDoggie/solidity-framework-template/blob/main/README.md) / English

# Universal Solidity Development and Testing Framework

> setup: `npm i` + `git submodule update --remote --init --recursive`

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


# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts


npx hardhat test test/diamond.ts
```
