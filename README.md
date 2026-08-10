# Chain Notebook：人生第一个 DApp

这是一个适合初学者的链上记事本，目标是把一次完整的 DApp 开发流程跑通：

1. Solidity 合约负责保存笔记；
2. Hardhat 负责编译、测试和部署；
3. Sepolia 负责提供免费的测试环境；
4. Vite + React 负责页面；
5. wagmi + viem 负责前端与合约交互；
6. RainbowKit 负责钱包连接；
7. Etherscan 负责查看交易和验证源码。

## 目录

~~~text
chain-notebook/
├── contract/    # Hardhat 3 + Solidity
└── frontend/    # Vite + React + wagmi + RainbowKit
~~~

本项目没有传统后端服务器。合约就是链上后端，读数据是 RPC 调用，写数据需要钱包签名并支付 Sepolia gas。

## 第 0 步：准备环境

- Node.js 22+
- npm
- 一个只用于测试网的 MetaMask 或其他 EVM 钱包
- Sepolia RPC
- WalletConnect Project ID
- Etherscan API Key（只用于验证源码）

不要使用主网私钥，也不要把私钥、RPC 密钥或 API Key 提交到 Git。

## 第 1 步：学习合约

进入合约目录并安装依赖：

~~~bash
cd contract
npm install
~~~

运行合约测试：

~~~bash
npm test
~~~

测试覆盖：

- 创建和读取笔记；
- 修改自己的笔记；
- 软删除笔记；
- 其他钱包不能修改你的笔记；
- 空内容和超长内容会失败；
- 删除后不能再次修改。

## 第 2 步：部署到本地 Hardhat 网络

~~~bash
npm run deploy:local
~~~

本地网络每次都是模拟链，适合快速学习和调试，不需要水龙头。

## 第 3 步：准备 Sepolia

创建一个专用测试钱包，把钱包地址复制到 Sepolia 水龙头领取测试 ETH。测试 ETH 没有主网价值，只用于支付测试交易 gas。

然后设置 Hardhat 配置变量：

~~~bash
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
npx hardhat keystore set ETHERSCAN_API_KEY
~~~

也可以使用本地环境变量，但不要把变量值写进代码。

## 第 4 步：部署到 Sepolia

~~~bash
npm run deploy:sepolia
~~~

部署成功后记录合约地址，并填入 frontend/.env。

参考 frontend/.env.example：

~~~dotenv
VITE_WALLETCONNECT_PROJECT_ID=你的 WalletConnect Project ID
VITE_SEPOLIA_RPC_URL=你的 Sepolia RPC
VITE_NOTEBOOK_ADDRESS=刚刚部署的合约地址
~~~

## 第 5 步：验证合约源码

本合约没有构造参数，部署成功后执行：

~~~bash
npx hardhat verify --network sepolia 部署后的合约地址
~~~

验证成功后，可以在 [Sepolia Etherscan](https://sepolia.etherscan.io/) 查看源码和 ABI。

## 第 6 步：启动前端

~~~bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
~~~

前端交互流程：

~~~text
连接钱包
  ↓
切换到 Sepolia
  ↓
读取当前地址的笔记
  ↓
创建 / 修改 / 删除
  ↓
钱包确认交易
  ↓
等待 receipt
  ↓
重新读取合约数据
~~~

## 合约接口

~~~solidity
createNote(string content)
getNotes(address owner)
updateNote(uint256 noteId, string content)
deleteNote(uint256 noteId)
~~~

注意：区块链数据公开。删除只是把当前状态标记为 deleted，历史交易和旧数据仍然可能被查看。因此不要把密码和隐私信息写入本项目。

## 验证命令

~~~bash
cd contract
npm run compile
npm test

cd ../frontend
npm run typecheck
npm run build
npm run lint
~~~
