// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PulseRegistry.sol";
import "./PulseTelemetry.sol";

contract PulseActionEngine is ReentrancyGuard {
    PulseRegistry public immutable registry;
    PulseTelemetry public immutable telemetry;
    IERC20 public immutable paymentToken;

    uint32 public constant CRITICAL_BURNOUT_THRESHOLD = 80;
    uint256 public constant WELLNESS_STIPEND_AMOUNT = 1000 * 10**6;

    mapping(uint256 => mapping(address => uint256)) public lastClaimedEpoch;
    mapping(uint256 => uint256) public milestoneFundingReleased;

    event WellnessStipendPaid(uint256 indexed projectId, address indexed contributor, uint256 amount, uint256 epoch);
    event MilestoneTriggered(uint256 indexed projectId, address indexed treasury, uint256 amount);

    constructor(address _registry, address _telemetry, address _paymentToken) {
        registry = PulseRegistry(_registry);
        telemetry = PulseTelemetry(_telemetry);
        paymentToken = IERC20(_paymentToken);
    }

    function claimWellnessStipend(uint256 projectId) external nonReentrant {
        uint256 activeEpoch = telemetry.latestEpochs(projectId);
        require(activeEpoch != 0, "No active telemetry data");
        require(lastClaimedEpoch[projectId][msg.sender] < activeEpoch, "Stipend already claimed for epoch");

        TelemetryTypes.ContributorSnapshot memory snapshot = telemetry.getContributorSnapshot(projectId, activeEpoch, msg.sender);
        require(snapshot.burnoutRiskScore >= CRITICAL_BURNOUT_THRESHOLD, "Burnout index below threshold");

        lastClaimedEpoch[projectId][msg.sender] = activeEpoch;
        require(paymentToken.transfer(msg.sender, WELLNESS_STIPEND_AMOUNT), "Transfer failed");

        emit WellnessStipendPaid(projectId, msg.sender, WELLNESS_STIPEND_AMOUNT, activeEpoch);
    }

    function evaluateMilestoneTrigger(uint256 projectId, uint256 targetMilestonePayout) external nonReentrant {
        uint256 activeEpoch = telemetry.latestEpochs(projectId);
        TelemetryTypes.RepoSnapshot memory repo = telemetry.getRepoSnapshot(projectId, activeEpoch);
        PulseRegistry.Project memory metadata = registry.getProject(projectId);

        if (repo.prVelocity >= 15 && repo.issueHealthScore >= 85 && repo.avgResponseTimeHours <= 12) {
            if (milestoneFundingReleased[projectId] == 0) {
                milestoneFundingReleased[projectId] = targetMilestonePayout;
                require(paymentToken.transfer(metadata.daoTreasury, targetMilestonePayout), "Ecosystem distribution failed");
                emit MilestoneTriggered(projectId, metadata.daoTreasury, targetMilestonePayout);
            }
        }
    }
}
