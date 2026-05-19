# PulseStack Protocol

**A decentralized protocol for measuring open-source ecosystem health and automating contributor wellness incentives.**

PulseStack combines on-chain telemetry verification with off-chain data indexing to create a transparent, oracle-driven system that rewards healthy development practices and prevents contributor burnout in Web3 projects.

---

## 🎯 Overview

PulseStack is a blockchain-based protocol that:

- **Tracks ecosystem health metrics** (PR velocity, issue response times, repository growth)
- **Monitors contributor burnout risk** using commit patterns and weekend work ratios
- **Automates wellness stipends** for at-risk contributors
- **Triggers milestone-based funding** when projects meet health thresholds
- **Ensures data integrity** through multi-oracle consensus and EIP-712 signatures

The protocol bridges off-chain GitHub data with on-chain smart contracts, enabling DAOs and project treasuries to programmatically respond to developer health signals.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Off-Chain Layer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────────┐                    │
│  │   GitHub     │─────▶│  Oracle Engine   │                    │
│  │   Webhooks   │      │  (Fastify API)   │                    │
│  └──────────────┘      └────────┬─────────┘                    │
│                                  │                               │
│                         ┌────────▼─────────┐                    │
│                         │  Queue Workers   │                    │
│                         │    (BullMQ)      │                    │
│                         └────────┬─────────┘                    │
│                                  │                               │
│                    ┌─────────────▼──────────────┐               │
│                    │   GitHub Indexer Service   │               │
│                    │  (Fetch commits, PRs, etc) │               │
│                    └─────────────┬──────────────┘               │
│                                  │                               │
│                    ┌─────────────▼──────────────┐               │
│                    │   Telemetry Engine         │               │
│                    │  (Process & aggregate)     │               │
│                    └─────────────┬──────────────┘               │
│                                  │                               │
│                    ┌─────────────▼──────────────┐               │
│                    │   Signer Service           │               │
│                    │  (EIP-712 signatures)      │               │
│                    └─────────────┬──────────────┘               │
│                                  │                               │
└──────────────────────────────────┼───────────────────────────────┘
                                   │
                                   │ Multi-oracle consensus
                                   │
┌──────────────────────────────────▼───────────────────────────────┐
│                         On-Chain Layer                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    PulseRegistry                            │ │
│  │  • Project registration & metadata                         │ │
│  │  • Oracle whitelist management                             │ │
│  │  • Access control (governance roles)                       │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
│                         │                                         │
│  ┌──────────────────────▼─────────────────────────────────────┐ │
│  │                   PulseTelemetry                            │ │
│  │  • EIP-712 signature verification                          │ │
│  │  • Multi-oracle quorum validation                          │ │
│  │  • Epoch-based telemetry storage                           │ │
│  │  • Contributor & repo snapshot history                     │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
│                         │                                         │
│  ┌──────────────────────▼─────────────────────────────────────┐ │
│  │                 PulseActionEngine                           │ │
│  │  • Wellness stipend distribution                           │ │
│  │  • Milestone-based treasury releases                       │ │
│  │  • Burnout threshold enforcement                           │ │
│  │  • ERC20 payment handling                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### **Smart Contracts (On-Chain)**

1. **PulseRegistry** - Central registry for projects and oracle management
   - Registers open-source projects with maintainer and DAO treasury addresses
   - Manages oracle whitelist for telemetry submission
   - Role-based access control (governance, admin)

2. **PulseTelemetry** - Cryptographically verified telemetry storage
   - Validates EIP-712 signed payloads from multiple oracles
   - Enforces quorum requirements for data commits
   - Stores epoch-based snapshots (repo health + contributor metrics)
   - Prevents replay attacks with nonce tracking

3. **PulseActionEngine** - Automated incentive distribution
   - Distributes wellness stipends to high-burnout contributors
   - Triggers milestone funding when health thresholds are met
   - Integrates with ERC20 tokens for payments

#### **Oracle Services (Off-Chain)**

1. **Oracle Engine** - Fastify-based API server
   - Receives GitHub webhook events
   - Queues telemetry processing jobs

2. **GitHub Indexer** - Data collection service
   - Fetches commits, PRs, issues, and contributor activity
   - Calculates weekend work ratios and commit patterns

3. **Telemetry Engine** - Metrics processor
   - Aggregates raw GitHub data into health scores
   - Computes burnout risk scores (commit frequency + weekend work)
   - Generates finalized telemetry payloads

4. **Signer Service** - Cryptographic signing
   - Creates EIP-712 signatures for telemetry data
   - Enables multi-oracle consensus verification

---

## 📊 Key Metrics

### Repository Health Metrics
- **PR Velocity** - Number of merged pull requests per epoch
- **Issue Health Score** - Ratio of closed vs. open issues (0-100)
- **Avg Response Time** - Mean time to first response on issues (hours)
- **Repo Growth Rate** - Star/fork growth percentage

### Contributor Wellness Metrics
- **Commit Count** - Total commits per contributor per epoch
- **Burnout Risk Score** - Weighted score (0-100) based on:
  - Commit frequency (40% weight)
  - Weekend work ratio (60% weight)
  - Threshold: ≥80 triggers wellness stipend eligibility

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- pnpm or npm
- Hardhat
- Docker (for Redis/PostgreSQL)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pulsestack.git
cd pulsestack

# Install dependencies
pnpm install

# Install oracle dependencies
cd oracle
pnpm install
cd ..
```

### Compile Contracts

```bash
pnpm run build
```

### Run Tests

```bash
pnpm run test
```

### Deploy Contracts (Local)

```bash
# Start local Hardhat node
pnpm run node

# In another terminal, deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

### Start Oracle Engine

```bash
# Start Redis and PostgreSQL
docker-compose up -d

# Configure environment
cd oracle
cp .env.example .env
# Edit .env with your configuration

# Start oracle server
pnpm run dev
```

---

## 💻 Usage Examples

### Registering a Project

```solidity
// Register a new open-source project
uint256 projectId = pulseRegistry.registerProject(
    "github.com/ethereum/solidity",
    0x1234...5678, // maintainer address
    0xabcd...ef00, // DAO treasury address
    "QmX..." // IPFS metadata CID
);
```

### Committing Telemetry (Oracle)

```solidity
// Prepare telemetry data
TelemetryTypes.RepoSnapshot memory repoData = TelemetryTypes.RepoSnapshot({
    epoch: 1234,
    timestamp: block.timestamp,
    prVelocity: 25,
    issueHealthScore: 92,
    avgResponseTimeHours: 8,
    repoGrowthRate: 15
});

TelemetryTypes.ContributorSnapshot[] memory contributorData = new TelemetryTypes.ContributorSnapshot[](2);
contributorData[0] = TelemetryTypes.ContributorSnapshot({
    epoch: 1234,
    timestamp: block.timestamp,
    commitsCount: 45,
    burnoutRiskScore: 85 // High burnout risk!
});

// Create EIP-712 payload
TelemetryTypes.EIP712Payload memory payload = TelemetryTypes.EIP712Payload({
    projectId: 1,
    epoch: 1234,
    repoSnapshotHash: keccak256(abi.encode(repoData)),
    contributorSnapshotHash: keccak256(abi.encode(contributorData)),
    contributors: [0xContributor1, 0xContributor2],
    nonce: 98765,
    expiry: block.timestamp + 1 hours
});

// Submit with multi-oracle signatures
bytes[] memory signatures = new bytes[](3); // Quorum of 3
signatures[0] = oracle1Signature;
signatures[1] = oracle2Signature;
signatures[2] = oracle3Signature;

pulseTelemetry.commitTelemetry(payload, repoData, contributorData, signatures);
```

### Claiming Wellness Stipend (Contributor)

```solidity
// Contributor with burnout score ≥80 can claim stipend
pulseActionEngine.claimWellnessStipend(projectId);
// Receives 1000 PUSD tokens
```

### Triggering Milestone Funding

```solidity
// Anyone can trigger milestone evaluation
// Releases funds if: prVelocity ≥15, issueHealthScore ≥85, avgResponseTime ≤12h
pulseActionEngine.evaluateMilestoneTrigger(
    projectId,
    50000 * 10**6 // 50,000 PUSD milestone payout
);
```

---

## 🔐 Security Features

- **EIP-712 Typed Data Signing** - Prevents signature replay across chains
- **Multi-Oracle Consensus** - Requires quorum of trusted oracles
- **Nonce Tracking** - Prevents replay attacks
- **Signature Expiry** - Time-bound telemetry submissions
- **Reentrancy Guards** - Protects payment functions
- **Role-Based Access Control** - Governance and admin separation
- **Sorted Signer Validation** - Ensures unique oracle signatures

---

## 🧪 Testing

Run the full test suite:

```bash
pnpm run test
```

Simulate burnout scenarios:

```bash
npx hardhat run scripts/simulateBurnout.js --network localhost
```

Seed test telemetry data:

```bash
npx hardhat run scripts/seedTelemetry.js --network localhost
```

---

## 📁 Project Structure

```
PulseStack/
├── contracts/
│   ├── interfaces/
│   │   ├── IPulseActionEngine.sol
│   │   ├── IPulseRegistry.sol
│   │   └── IPulseTelemetry.sol
│   ├── libraries/
│   │   └── TelemetryTypes.sol
│   ├── PulseActionEngine.sol
│   ├── PulseRegistry.sol
│   └── PulseTelemetry.sol
├── oracle/
│   ├── src/
│   │   ├── config/
│   │   │   └── environment.ts
│   │   ├── services/
│   │   │   ├── githubIndexer.ts
│   │   │   ├── signerService.ts
│   │   │   └── telemetryEngine.ts
│   │   ├── workers/
│   │   │   └── queueWorkers.ts
│   │   └── server.ts
│   └── package.json
├── scripts/
│   ├── deploy.js
│   ├── seedTelemetry.js
│   └── simulateBurnout.js
├── test/
│   ├── helpers/
│   │   └── eip712.ts
│   └── protocol.test.ts
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml
├── Dockerfile.oracle
├── hardhat.config.ts
└── package.json
```

---

## 🛠️ Technology Stack

**Smart Contracts:**
- Solidity 0.8.24
- OpenZeppelin Contracts (AccessControl, EIP712, ReentrancyGuard)
- Hardhat development environment

**Oracle Services:**
- TypeScript
- Fastify (API framework)
- BullMQ (job queue)
- Redis (queue backend)
- PostgreSQL (data persistence)
- Ethers.js (blockchain interaction)

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🔗 Links

- **Documentation:** [docs.pulsestack.io](https://docs.pulsestack.io)
- **Discord:** [discord.gg/pulsestack](https://discord.gg/pulsestack)
- **Twitter:** [@PulseStackHQ](https://twitter.com/PulseStackHQ)

---

## 🙏 Acknowledgments

Built with ❤️ for the open-source community. Special thanks to all contributors working to make Web3 development more sustainable and healthy.

---

**⚠️ Disclaimer:** This protocol is experimental software. Use at your own risk. Always audit smart contracts before deploying to production.
