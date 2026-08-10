// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ChainNotebook
/// @notice Stores short notes owned by the wallet that created them.
contract ChainNotebook {
    uint256 public constant MAX_CONTENT_LENGTH = 500;

    struct Note {
        uint256 id;
        string content;
        uint64 createdAt;
        uint64 updatedAt;
        bool deleted;
    }

    error ContentEmpty();
    error ContentTooLong(uint256 actualLength, uint256 maxLength);
    error NoteNotFound();
    error NoteAlreadyDeleted();

    mapping(address owner => Note[] notes) private _notes;

    event NoteCreated(
        address indexed owner,
        uint256 indexed noteId,
        uint64 createdAt
    );
    event NoteUpdated(
        address indexed owner,
        uint256 indexed noteId,
        uint64 updatedAt
    );
    event NoteDeleted(
        address indexed owner,
        uint256 indexed noteId,
        uint64 deletedAt
    );

    /// @notice Creates a note for the connected wallet.
    /// @param content The note text. It is limited to 500 bytes.
    /// @return noteId The new note's id for this wallet.
    function createNote(string calldata content)
        external
        returns (uint256 noteId)
    {
        _validateContent(content);

        uint64 timestamp = uint64(block.timestamp);
        noteId = _notes[msg.sender].length;
        _notes[msg.sender].push(
            Note({
                id: noteId,
                content: content,
                createdAt: timestamp,
                updatedAt: timestamp,
                deleted: false
            })
        );

        emit NoteCreated(msg.sender, noteId, timestamp);
    }

    /// @notice Reads notes for any wallet address. Blockchain state is public.
    /// @param owner The wallet whose notes should be returned.
    function getNotes(address owner)
        external
        view
        returns (Note[] memory)
    {
        return _notes[owner];
    }

    /// @notice Updates a note owned by the connected wallet.
    /// @param noteId The note id returned when the note was created.
    /// @param content The replacement note text.
    function updateNote(uint256 noteId, string calldata content) external {
        _validateContent(content);

        Note storage note = _getActiveNote(msg.sender, noteId);
        note.content = content;
        note.updatedAt = uint64(block.timestamp);

        emit NoteUpdated(msg.sender, noteId, note.updatedAt);
    }

    /// @notice Soft-deletes a note owned by the connected wallet.
    /// @dev Deleting current state does not erase historical blockchain data.
    /// @param noteId The note id to delete.
    function deleteNote(uint256 noteId) external {
        Note storage note = _getActiveNote(msg.sender, noteId);
        note.deleted = true;
        note.content = "";
        note.updatedAt = uint64(block.timestamp);

        emit NoteDeleted(msg.sender, noteId, note.updatedAt);
    }

    function _validateContent(string calldata content) private pure {
        uint256 length = bytes(content).length;
        if (length == 0) revert ContentEmpty();
        if (length > MAX_CONTENT_LENGTH) {
            revert ContentTooLong(length, MAX_CONTENT_LENGTH);
        }
    }

    function _getActiveNote(address owner, uint256 noteId)
        private
        view
        returns (Note storage note)
    {
        if (noteId >= _notes[owner].length) revert NoteNotFound();

        note = _notes[owner][noteId];
        if (note.deleted) revert NoteAlreadyDeleted();
    }
}
