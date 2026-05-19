// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IPulseRegistry.sol";

contract PulseRegistry is IPulseRegistry, AccessControl {
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");

    uint256 private _projectIds;
    mapping(uint256 => Project) private _projects;
    mapping(bytes32 => bool) private _registeredHashes;
    mapping(address => bool) private _oracles;

    constructor(address rootGovernance) {
        _grantRole(DEFAULT_ADMIN_ROLE, rootGovernance);
        _grantRole(GOVERNANCE_ROLE, rootGovernance);
        _grantRole(REGISTRY_ADMIN_ROLE, rootGovernance);
    }

    function registerProject(
        string calldata repoUrl,
        address maintainer,
        address daoTreasury,
        string calldata metadataCid
    ) external onlyRole(REGISTRY_ADMIN_ROLE) returns (uint256) {
        bytes32 repoHash = keccak256(abi.encodePacked(repoUrl));
        if (_registeredHashes[repoHash]) revert ProjectAlreadyExists(repoUrl);

        _projectIds++;
        uint256 newId = _projectIds;

        _projects[newId] = Project({
            id: newId,
            repoUrl: repoUrl,
            maintainer: maintainer,
            daoTreasury: daoTreasury,
            metadataCid: metadataCid,
            isActive: true
        });

        _registeredHashes[repoHash] = true;
        emit ProjectRegistered(newId, repoUrl, maintainer, daoTreasury);
        return newId;
    }

    function updateOracleStatus(address oracle, bool status) external onlyRole(GOVERNANCE_ROLE) {
        _oracles[oracle] = status;
        emit OracleStatusUpdated(oracle, status);
    }

    function isOracle(address account) external view returns (bool) {
        return _oracles[account];
    }

    function getProject(uint256 projectId) external view returns (Project memory) {
        Project memory proj = _projects[projectId];
        if (proj.id == 0) revert ProjectDoesNotExist(projectId);
        return proj;
    }
}
