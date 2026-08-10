import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("ChainNotebook", async function () {
    const { viem } = await network.create();
    const publicClient = await viem.getPublicClient();
    const [owner, other] = await viem.getWalletClients();

    it("creates and reads a note for the connected wallet", async function () {
        const notebook = await viem.deployContract("ChainNotebook");

        await viem.assertions.emit(
            notebook.write.createNote(["learn Solidity"]),
            notebook,
            "NoteCreated",
        );

        const notes = await notebook.read.getNotes([owner.account.address]);

        assert.equal(notes.length, 1);
        assert.equal(notes[0].id, 0n);
        assert.equal(notes[0].content, "learn Solidity");
        assert.equal(notes[0].deleted, false);
    });

    it("updates and soft-deletes the owner's note", async function () {
        const notebook = await viem.deployContract("ChainNotebook");

        await notebook.write.createNote(["first version"]);
        await notebook.write.updateNote([0n, "updated version"]);

        let notes = await notebook.read.getNotes([owner.account.address]);
        assert.equal(notes[0].content, "updated version");

        await notebook.write.deleteNote([0n]);
        notes = await notebook.read.getNotes([owner.account.address]);

        assert.equal(notes[0].deleted, true);
        assert.equal(notes[0].content, "");
    });

    it("prevents another wallet from changing the note", async function () {
        const notebook = await viem.deployContract("ChainNotebook");

        await notebook.write.createNote(["owner only"]);

        await assert.rejects(() =>
            other.writeContract({
                address: notebook.address,
                abi: notebook.abi,
                functionName: "updateNote",
                args: [0n, "not yours"],
            }),
        );
    });

    it("rejects empty and overlong content", async function () {
        const notebook = await viem.deployContract("ChainNotebook");
        const tooLong = "a".repeat(501);

        await assert.rejects(() => notebook.write.createNote([""]));
        await assert.rejects(() => notebook.write.createNote([tooLong]));
    });

    it("rejects updates after a note is deleted", async function () {
        const notebook = await viem.deployContract("ChainNotebook");

        await notebook.write.createNote(["temporary"]);
        await notebook.write.deleteNote([0n]);

        await assert.rejects(() =>
            notebook.write.updateNote([0n, "should fail"]),
        );

        const blockNumber = await publicClient.getBlockNumber();
        assert.equal(typeof blockNumber, "bigint");
    });
});
