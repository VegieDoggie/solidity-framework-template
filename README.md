中文 / [English](https://github.com/VegieDoggie/solidity-framework-template/blob/main/README.en.md)
# 通用Solidity开发测试框架

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

5. 刷新hardhat网络配置(自动选择最佳网络):
   
  - `sol networks` // 刷新所有网络
  - `sol networks mainnet` // 仅刷新以太坊主网
