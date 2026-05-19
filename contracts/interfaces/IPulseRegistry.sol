// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPulseRegistry {
    error ProjectAlreadyExists(string repoUrl);
    error ProjectDoesNotExist(uint256 projectId);
    error UnauthorizedCaller();

    event ProjectRegistered(uint256 indexed projectId, string repoUrl, address indexed maintainer, address indexed daoTreasury);
    event ProjectMetadataUpdated(uint256 indexed projectId, string newMetadataCid);
    event OracleStatusUpdated(address indexed oracle, bool indexed status);

    struct Project {
        uint256 id;
        string repoUrl;
        address maintainer;
        address daoTreasury;
        string metadataCid;
        bool isActive;
    }

    function registerProject(string calldata repoUrl, address maintainer, address daoTreasury, string calldata metadataCid) external returns (uint256);
    function updateOracleStatus(address oracle, bool status) external;
    function isOracle(address account) external view returns (bool);
    function getProject(uint256 projectId) external view returns (Project memory);
}
