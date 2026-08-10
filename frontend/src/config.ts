import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { isAddress, type Address } from "viem";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

const walletConnectProjectId =
    import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
    "replace-with-your-walletconnect-project-id";

export const config = getDefaultConfig({
    appName: "Chain Notebook",
    projectId: walletConnectProjectId,
    chains: [sepolia],
    transports: {
        [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL || undefined),
    },
});

const configuredAddress = import.meta.env.VITE_NOTEBOOK_ADDRESS;

export const notebookAddress: Address | undefined =
    configuredAddress && isAddress(configuredAddress)
        ? configuredAddress
        : undefined;
