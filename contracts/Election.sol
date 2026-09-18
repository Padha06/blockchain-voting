// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import { IElection, ElectionCandidate } from "./interfaces/IElection.sol";

/// @title Election — one isolated election (deployed as EIP-1167 clone by ElectionFactory).
/// @notice Votes are on-chain and tamper-evident. Voter identities stay off-chain;
///         only leaf hashes are stored. Designed for a zero-gas app-chain (gasPrice 0),
///         so students vote with in-browser burner wallets and pay nothing.
/// @dev Clones cannot use constructors — state is set via `initialize` (initializer).
contract Election is Initializable, OwnableUpgradeable, IElection {
    // ---- Custom errors (cheaper than strings, better for viva) ----
    error NotInCreatedState();
    error NotActive();
    error AlreadyEnded();
    error AlreadyVoted();
    error NotEligible();
    error BadCandidate();
    error NeedTwoCandidates();
    error ZeroMerkleRoot();
    error ZeroAddress();

    uint8 public constant CREATED = 0;
    uint8 public constant ACTIVE = 1;
    uint8 public constant ENDED = 2;
    uint8 public constant CANCELLED = 3;

    string public title;
    string public description;
    bytes32 public merkleRoot;
    string public censusURI;
    uint8 public state;
    uint256 public totalVotes;
    uint256 public startedAt;
    uint256 public endedAt;
    uint256 public candidateCount;

    mapping(uint256 => ElectionCandidate) private _candidates; // 1-based id
    mapping(bytes32 => bool) public hasVoted; // leaf => voted

    event ElectionInitialized(string title, bytes32 merkleRoot);
    event CandidateAdded(uint256 indexed candidateId, string name);
    event CandidateRemoved(uint256 indexed candidateId);
    event CensusUpdated(bytes32 merkleRoot, string censusURI);
    event ElectionStarted(uint256 timestamp);
    event ElectionEnded(uint256 timestamp, uint256 totalVotes);
    event ElectionCancelled(uint256 timestamp);
    event VoteCast(bytes32 indexed leaf, uint256 indexed candidateId, uint256 timestamp);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address owner_,
        string calldata title_,
        string calldata description_,
        bytes32 merkleRoot_,
        string calldata censusURI_
    ) external initializer {
        if (owner_ == address(0)) revert ZeroAddress();
        __Ownable_init(owner_);
        title = title_;
        description = description_;
        merkleRoot = merkleRoot_;
        censusURI = censusURI_;
        state = CREATED;
        emit ElectionInitialized(title_, merkleRoot_);
    }

    // ---- Admin (onlyOwner, only in Created unless noted) ----

    function addCandidate(
        string calldata name,
        string calldata tagline,
        string calldata imageUrl
    ) external override onlyOwner {
        if (state != CREATED) revert NotInCreatedState();
        candidateCount += 1;
        _candidates[candidateCount] = ElectionCandidate({
            name: name,
            tagline: tagline,
            imageUrl: imageUrl,
            voteCount: 0,
            active: true
        });
        emit CandidateAdded(candidateCount, name);
    }

    function removeCandidate(uint256 candidateId) external override onlyOwner {
        if (state != CREATED) revert NotInCreatedState();
        ElectionCandidate storage c = _candidates[candidateId];
        if (candidateId == 0 || candidateId > candidateCount || !c.active) revert BadCandidate();
        c.active = false;
        emit CandidateRemoved(candidateId);
    }

    function updateCensus(bytes32 newRoot, string calldata newURI) external override onlyOwner {
        if (state != CREATED) revert NotInCreatedState();
        merkleRoot = newRoot;
        censusURI = newURI;
        emit CensusUpdated(newRoot, newURI);
    }

    function startElection() external override onlyOwner {
        if (state != CREATED) revert NotInCreatedState();
        if (merkleRoot == bytes32(0)) revert ZeroMerkleRoot();
        uint256 active = 0;
        for (uint256 i = 1; i <= candidateCount; i++) {
            if (_candidates[i].active) active++;
        }
        if (active < 2) revert NeedTwoCandidates();
        state = ACTIVE;
        startedAt = block.timestamp;
        emit ElectionStarted(block.timestamp);
    }

    function endElection() external override onlyOwner {
        if (state != ACTIVE) revert NotActive();
        state = ENDED;
        endedAt = block.timestamp;
        emit ElectionEnded(block.timestamp, totalVotes);
    }

    function cancelElection() external override onlyOwner {
        if (state == ENDED) revert AlreadyEnded();
        state = CANCELLED;
        endedAt = block.timestamp;
        emit ElectionCancelled(block.timestamp);
    }

    // ---- Voting (gasPrice 0 on app-chain: free for students) ----

    /// @notice Leaf = keccak(keccak(rollNo, salt, election, chainId)) via OZ StandardMerkleTree
    ///         double-hashing. Fresh salt per election gives domain separation; chainId binds
    ///         the proof to this app-chain so a census cannot be replayed on Amoy/Sepolia.
    function castVote(uint256 candidateId, bytes32 leaf, bytes32[] calldata proof) external override {
        if (state != ACTIVE) revert NotActive();
        if (hasVoted[leaf]) revert AlreadyVoted();
        ElectionCandidate storage c = _candidates[candidateId];
        if (candidateId == 0 || candidateId > candidateCount || !c.active) revert BadCandidate();
        if (!MerkleProof.verify(proof, merkleRoot, leaf)) revert NotEligible();
        hasVoted[leaf] = true;
        c.voteCount += 1;
        totalVotes += 1;
        emit VoteCast(leaf, candidateId, block.timestamp);
    }

    // ---- Views ----

    function getCandidates() external view override returns (ElectionCandidate[] memory) {
        ElectionCandidate[] memory out = new ElectionCandidate[](candidateCount);
        for (uint256 i = 1; i <= candidateCount; i++) {
            out[i - 1] = _candidates[i];
        }
        return out;
    }

    function getCandidate(uint256 id) external view returns (ElectionCandidate memory) {
        if (id == 0 || id > candidateCount) revert BadCandidate();
        return _candidates[id];
    }

    function getStats()
        external
        view
        override
        returns (uint8 state_, uint256 totalVotes_, uint256 candidateCount_, uint256 startedAt_, uint256 endedAt_)
    {
        return (state, totalVotes, candidateCount, startedAt, endedAt);
    }

    function isEligible(bytes32 leaf, bytes32[] calldata proof) external view override returns (bool) {
        if (hasVoted[leaf]) return false;
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }
}
