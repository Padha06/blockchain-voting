// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

struct ElectionCandidate {
    string name;
    string tagline;
    string imageUrl;
    uint256 voteCount;
    bool active;
}

interface IElection {
    function initialize(
        address owner_,
        string calldata title_,
        string calldata description_,
        bytes32 merkleRoot_,
        string calldata censusURI_
    ) external;

    function addCandidate(string calldata name, string calldata tagline, string calldata imageUrl) external;
    function removeCandidate(uint256 candidateId) external;
    function updateCensus(bytes32 newRoot, string calldata newURI) external;
    function startElection() external;
    function endElection() external;
    function cancelElection() external;
    function castVote(uint256 candidateId, bytes32 leaf, bytes32[] calldata proof) external;
    function getCandidates() external view returns (ElectionCandidate[] memory);
    function getStats()
        external
        view
        returns (uint8 state_, uint256 totalVotes_, uint256 candidateCount_, uint256 startedAt_, uint256 endedAt_);
    function isEligible(bytes32 leaf, bytes32[] calldata proof) external view returns (bool);
}
