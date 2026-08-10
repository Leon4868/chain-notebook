export const chainNotebookAbi = [
    {
        type: "function",
        name: "getNotes",
        stateMutability: "view",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [
            {
                name: "",
                type: "tuple[]",
                components: [
                    { name: "id", type: "uint256" },
                    { name: "content", type: "string" },
                    { name: "createdAt", type: "uint64" },
                    { name: "updatedAt", type: "uint64" },
                    { name: "deleted", type: "bool" },
                ],
            },
        ],
    },
    {
        type: "function",
        name: "createNote",
        stateMutability: "nonpayable",
        inputs: [{ name: "content", type: "string" }],
        outputs: [{ name: "noteId", type: "uint256" }],
    },
    {
        type: "function",
        name: "updateNote",
        stateMutability: "nonpayable",
        inputs: [
            { name: "noteId", type: "uint256" },
            { name: "content", type: "string" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "deleteNote",
        stateMutability: "nonpayable",
        inputs: [{ name: "noteId", type: "uint256" }],
        outputs: [],
    },
] as const;

export const MAX_CONTENT_LENGTH = 500;

export type Note = {
    id: bigint;
    content: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
};
