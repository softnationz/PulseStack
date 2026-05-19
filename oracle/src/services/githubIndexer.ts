import { CONFIG } from '../config/environment';

export interface RawTelemetryMetrics {
  prVelocity: number;
  issueHealthScore: number;
  avgResponseTimeHours: number;
  repoGrowthRate: number;
  contributorCommits: Record<string, number>;
  weekendWorkRatios: Record<string, number>;
}

export class GitHubIndexer {
  public async fetchTelemetryData(_repoUrl: string): Promise<RawTelemetryMetrics> {
    if (!CONFIG.GITHUB_TOKEN) {
      return this.generateMockMetrics();
    }
    return this.generateMockMetrics();
  }

  private generateMockMetrics(): RawTelemetryMetrics {
    return {
      prVelocity: 18,
      issueHealthScore: 88,
      avgResponseTimeHours: 6,
      repoGrowthRate: 12,
      contributorCommits: {
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": 42
      },
      weekendWorkRatios: {
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": 85
      }
    };
  }
}
