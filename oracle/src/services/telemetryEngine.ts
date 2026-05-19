import { RawTelemetryMetrics } from './githubIndexer';

export interface FinalizedEcosystemTelemetry {
  prVelocity: number;
  issueHealthScore: number;
  avgResponseTimeHours: number;
  repoGrowthRate: number;
  contributors: string[];
  contributorData: { commitsCount: number; burnoutRiskScore: number }[];
}

export class TelemetryEngine {
  public processMetrics(raw: RawTelemetryMetrics): FinalizedEcosystemTelemetry {
    const contributors = Object.keys(raw.contributorCommits);
    const contributorData = contributors.map((addr) => {
      const commits = raw.contributorCommits[addr];
      const weekendRatio = raw.weekendWorkRatios[addr] || 0;
      const burnoutRiskScore = Math.min(100, Math.floor((commits * 0.4) + (weekendRatio * 0.6)));
      return { commitsCount: commits, burnoutRiskScore };
    });

    return {
      prVelocity: raw.prVelocity,
      issueHealthScore: raw.issueHealthScore,
      avgResponseTimeHours: raw.avgResponseTimeHours,
      repoGrowthRate: raw.repoGrowthRate,
      contributors,
      contributorData
    };
  }
}
