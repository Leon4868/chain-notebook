# Chain Notebook 前端

这是 Vite + React + TypeScript + wagmi + RainbowKit 前端。

~~~bash
npm install
cp .env.example .env
npm run dev
~~~

部署合约后，把合约地址写入 VITE_NOTEBOOK_ADDRESS，再连接钱包并切换到 Sepolia。

主要学习入口：

- src/config.ts：wagmi、RainbowKit 和 Sepolia 配置；
- src/contract.ts：合约 ABI；
- src/App.tsx：读取、写入、等待交易和刷新数据；
- src/main.tsx：React、wagmi、Query 和 RainbowKit Provider。
