import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ChainNotebookModule", (m) => {
    const notebook = m.contract("ChainNotebook");

    return { notebook };
});
