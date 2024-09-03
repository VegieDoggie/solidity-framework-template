中文 / [English](https://github.com/VegieDoggie/solidity-framework-template/blob/main/README.en.md)
# 通用Solidity开发测试框架

> setup: `npm i` + `git submodule update --remote --init --recursive`

核心操作:

1. **编译**:
  - `npx hardhat compile`
  - `forge compile` | `forge build`
2. **测试**
  - `npx hardhat test`
  - `forge test`
3. **本地节点网络[推荐`hardhat`]**
  - `npx hardhat node`
4. **在指定的区块链网络上运行TS脚本(比如部署)**
  - `npx hardhat --network <网络名> run <脚本路径>`

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
