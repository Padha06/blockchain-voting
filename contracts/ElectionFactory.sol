// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";
import { Election } from "./Election.sol";

/// @title ElectionFactory — cheap multi-election deployment via EIP-1167 minimal proxies.
/// @notice A clone costs ~45k gas vs ~1.5M for a full deploy, so one organiser can run
///         school/college/society/district elections from the same factory. Each clone
///         is isolated with its own owner. On the zero-gas app-chain deployment is free.
contract ElectionFactory {
    address public immutable implementation;
    address[] private _elections;
    mapping(address => address[]) private _electionsByOwner;

    event ElectionCreated(address indexed election, address indexed owner, string title);

    error ZeroAddress();

    constructor(address implementation_) {
        if (implementation_ == address(0)) revert ZeroAddress();
        implementation = implementation_;
    }

    function createElection(
        string calldata title,
        string calldata description,
        bytes32 merkleRoot,
        string calldata censusURI
    ) external returns (address election) {
        election = Clones.clone(implementation);
        Election(election).initialize(msg.sender, title, description, merkleRoot, censusURI);
        _elections.push(election);
        _electionsByOwner[msg.sender].push(election);
        emit ElectionCreated(election, msg.sender, title);
    }

    function getElections() external view returns (address[] memory) {
        return _elections;
    }

    function getElectionsByOwner(address owner) external view returns (address[] memory) {
        return _electionsByOwner[owner];
    }

    function electionCount() external view returns (uint256) {
        return _elections.length;
    }
}
