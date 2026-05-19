// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPulseActionEngine {
    event WellnessStipendPaid(uint256 indexed projectId, address indexed contributor, uint256 amount, uint256 epoch);
    event MilestoneTriggered(uint256 indexed projectId, address indexed treasury, uint256 amount);

    function claimWellnessStipend(uint256 projectId) external;
    function evaluateMilestoneTrigger(uint256 projectId, uint256 targetMilestonePayout) external;
}
