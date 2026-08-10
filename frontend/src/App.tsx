import { useEffect, useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
    useAccount,
    useChainId,
    useReadContract,
    useSwitchChain,
    useWaitForTransactionReceipt,
    useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { zeroAddress, type Address } from "viem";

import {
    MAX_CONTENT_LENGTH,
    type Note,
    chainNotebookAbi,
} from "./contract";
import { notebookAddress } from "./config";
import "./App.css";

function getErrorMessage(error: Error | null | undefined) {
    if (!error) return "";
    return error.message.split("\n")[0];
}

function formatAddress(address: Address | undefined) {
    if (!address) return "";
    return address.slice(0, 6) + "..." + address.slice(-4);
}

function formatDate(timestamp: bigint) {
    return new Date(Number(timestamp) * 1000).toLocaleString("zh-CN");
}

function App() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const {
        writeContract,
        data: transactionHash,
        isPending: isWriting,
        error: writeError,
    } = useWriteContract();
    const [draft, setDraft] = useState("");
    const [editingId, setEditingId] = useState<bigint | null>(null);
    const [feedback, setFeedback] = useState("");

    const readableAddress = notebookAddress ?? zeroAddress;
    const readableOwner = address ?? zeroAddress;
    const {
        data: rawNotes,
        isPending: isReading,
        error: readError,
        refetch,
    } = useReadContract({
        address: readableAddress,
        abi: chainNotebookAbi,
        functionName: "getNotes",
        args: [readableOwner],
        query: {
            enabled: Boolean(notebookAddress && address),
        },
    });
    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
    } = useWaitForTransactionReceipt({
        hash: transactionHash,
    });

    const notes = useMemo(
        () => ((rawNotes ?? []) as Note[]).filter((note) => !note.deleted),
        [rawNotes],
    );
    const isWrongNetwork = isConnected && chainId !== sepolia.id;
    const isBusy = isWriting || isConfirming;

    useEffect(() => {
        if (!isConfirmed) return;

        setDraft("");
        setEditingId(null);
        setFeedback("交易已确认，笔记列表已同步。");
        void refetch();
    }, [isConfirmed, refetch]);

    function submitNote(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!notebookAddress || !address) return;

        const content = draft.trim();
        if (!content) {
            setFeedback("笔记内容不能为空。");
            return;
        }
        if (content.length > MAX_CONTENT_LENGTH) {
            setFeedback("笔记不能超过 " + MAX_CONTENT_LENGTH + " 个字符。");
            return;
        }

        setFeedback("请在钱包中确认交易。");
        if (editingId === null) {
            writeContract({
                address: notebookAddress,
                abi: chainNotebookAbi,
                functionName: "createNote",
                args: [content],
            });
        } else {
            writeContract({
                address: notebookAddress,
                abi: chainNotebookAbi,
                functionName: "updateNote",
                args: [editingId, content],
            });
        }
    }

    function startEditing(note: Note) {
        setEditingId(note.id);
        setDraft(note.content);
        setFeedback("");
    }

    function cancelEditing() {
        setEditingId(null);
        setDraft("");
        setFeedback("");
    }

    function removeNote(noteId: bigint) {
        if (!notebookAddress) return;

        setFeedback("请在钱包中确认删除交易。");
        writeContract({
            address: notebookAddress,
            abi: chainNotebookAbi,
            functionName: "deleteNote",
            args: [noteId],
        });
    }

    return (
        <main className="app-shell">
            <header className="topbar">
                <a className="brand" href="/">
                    <span className="brand-mark">⌁</span>
                    Chain Notebook
                </a>
                <ConnectButton chainStatus="icon" showBalance={false} />
            </header>

            <section className="hero">
                <p className="eyebrow">YOUR FIRST DAPP · SEPOLIA</p>
                <h1>把想法写进区块链。</h1>
                <p className="hero-copy">
                    每一次创建、修改和删除，都是一笔由钱包签名的链上交易。
                    这是一份可以边用边学习的 Web3 记事本。
                </p>
                <div className="hero-meta">
                    <span className="network-pill">● Ethereum Sepolia</span>
                    {address && <span>{formatAddress(address)}</span>}
                </div>
            </section>

            {!notebookAddress && (
                <div className="notice warning">
                    合约地址还没有配置。完成 Sepolia 部署后，把地址填入
                    <code>frontend/.env</code> 的
                    <code>VITE_NOTEBOOK_ADDRESS</code>。
                </div>
            )}

            {!isConnected ? (
                <section className="empty-state">
                    <div className="empty-icon">◎</div>
                    <h2>先连接你的钱包</h2>
                    <p>RainbowKit 会帮你选择钱包并切换到 Sepolia。</p>
                    <ConnectButton />
                </section>
            ) : isWrongNetwork ? (
                <section className="empty-state">
                    <div className="empty-icon">↯</div>
                    <h2>请切换到 Sepolia</h2>
                    <p>当前网络不是本项目使用的 Ethereum Sepolia。</p>
                    <button
                        className="primary-button"
                        type="button"
                        onClick={() => switchChain({ chainId: sepolia.id })}
                    >
                        切换网络
                    </button>
                </section>
            ) : (
                <section className="workspace">
                    <div className="composer-card">
                        <div className="section-heading">
                            <div>
                                <p className="eyebrow">ON-CHAIN ENTRY</p>
                                <h2>{editingId === null ? "写一条新笔记" : "编辑笔记"}</h2>
                            </div>
                            <span className="gas-label">需要 Sepolia ETH</span>
                        </div>
                        <form onSubmit={submitNote}>
                            <textarea
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder="今天学到了什么？"
                                maxLength={MAX_CONTENT_LENGTH}
                                disabled={isBusy || !notebookAddress}
                            />
                            <div className="composer-footer">
                                <span className="char-count">
                                    {draft.length}/{MAX_CONTENT_LENGTH}
                                </span>
                                <div className="button-row">
                                    {editingId !== null && (
                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={cancelEditing}
                                            disabled={isBusy}
                                        >
                                            取消
                                        </button>
                                    )}
                                    <button
                                        className="primary-button"
                                        type="submit"
                                        disabled={isBusy || !notebookAddress}
                                    >
                                        {isBusy
                                            ? "等待交易确认…"
                                            : editingId === null
                                              ? "写入链上"
                                              : "保存修改"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="list-heading">
                        <div>
                            <p className="eyebrow">MY NOTES</p>
                            <h2>我的链上记录</h2>
                        </div>
                        <span className="note-count">{notes.length} 条</span>
                    </div>

                    {isReading ? (
                        <div className="loading-card">正在从 Sepolia 读取…</div>
                    ) : notes.length === 0 ? (
                        <div className="empty-list">
                            <span>✦</span>
                            <p>还没有笔记，写下你的第一条链上记录吧。</p>
                        </div>
                    ) : (
                        <div className="note-grid">
                            {notes.map((note) => (
                                <article className="note-card" key={note.id.toString()}>
                                    <div className="note-card-top">
                                        <span>#{note.id.toString().padStart(2, "0")}</span>
                                        <span>{formatDate(note.updatedAt)}</span>
                                    </div>
                                    <p>{note.content}</p>
                                    <div className="note-actions">
                                        <button
                                            type="button"
                                            onClick={() => startEditing(note)}
                                            disabled={isBusy}
                                        >
                                            编辑
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeNote(note.id)}
                                            disabled={isBusy}
                                        >
                                            删除
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {(feedback || writeError || readError) && (
                        <div className="notice">
                            {feedback ||
                                getErrorMessage(writeError) ||
                                getErrorMessage(readError)}
                        </div>
                    )}

                    {transactionHash && (
                        <a
                            className="transaction-link"
                            href={"https://sepolia.etherscan.io/tx/" + transactionHash}
                            target="_blank"
                            rel="noreferrer"
                        >
                            查看最近交易 ↗
                        </a>
                    )}
                </section>
            )}

            <footer className="footer">
                <span>数据由 ChainNotebook.sol 提供</span>
                <a
                    href="https://sepolia.etherscan.io/"
                    target="_blank"
                    rel="noreferrer"
                >
                    打开 Sepolia Etherscan ↗
                </a>
            </footer>
        </main>
    );
}

export default App;
