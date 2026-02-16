import { expect, test, describe } from "bun:test";
import { detectVersionBump, incrementVersion, generateStats, formatStats } from "../src/version";
import { Commit } from "../src/types";

describe("version utilities", () => {
  describe("detectVersionBump", () => {
    test("should suggest major for breaking changes", () => {
      const commits: Commit[] = [
        { hash: "abc1234", subject: "add feature", body: "", author: "Lukas", date: "2024-01-01", type: "feat", breaking: "API changed" },
      ];
      const result = detectVersionBump(commits);
      expect(result.type).toBe("major");
      expect(result.reason).toBe("Breaking changes detected");
    });

    test("should suggest minor for features", () => {
      const commits: Commit[] = [
        { hash: "abc1234", subject: "add feature", body: "", author: "Lukas", date: "2024-01-01", type: "feat" },
      ];
      const result = detectVersionBump(commits);
      expect(result.type).toBe("minor");
      expect(result.reason).toBe("New features detected");
    });

    test("should suggest patch for fixes only", () => {
      const commits: Commit[] = [
        { hash: "abc1234", subject: "fix bug", body: "", author: "Lukas", date: "2024-01-01", type: "fix" },
      ];
      const result = detectVersionBump(commits);
      expect(result.type).toBe("patch");
      expect(result.reason).toBe("Bug fixes detected");
    });

    test("should suggest patch for maintenance", () => {
      const commits: Commit[] = [
        { hash: "abc1234", subject: "update docs", body: "", author: "Lukas", date: "2024-01-01", type: "docs" },
      ];
      const result = detectVersionBump(commits);
      expect(result.type).toBe("patch");
      expect(result.reason).toBe("Maintenance changes");
    });

    test("should prioritize breaking over features", () => {
      const commits: Commit[] = [
        { hash: "abc1234", subject: "add feature", body: "", author: "Lukas", date: "2024-01-01", type: "feat" },
        { hash: "def5678", subject: "breaking", body: "", author: "Lukas", date: "2024-01-01", type: "fix", breaking: "Broke something" },
      ];
      const result = detectVersionBump(commits);
      expect(result.type).toBe("major");
    });
  });

  describe("incrementVersion", () => {
    test("should increment patch", () => {
      expect(incrementVersion("1.2.3", "patch")).toBe("1.2.4");
    });

    test("should increment minor", () => {
      expect(incrementVersion("1.2.3", "minor")).toBe("1.3.0");
    });

    test("should increment major", () => {
      expect(incrementVersion("1.2.3", "major")).toBe("2.0.0");
    });

    test("should handle prerelease versions", () => {
      expect(incrementVersion("1.2.3-beta.1", "patch")).toBe("1.2.4-beta.1");
    });

    test("should return original for invalid versions", () => {
      expect(incrementVersion("invalid", "patch")).toBe("invalid");
    });
  });

  describe("generateStats", () => {
    test("should count commit types correctly", () => {
      const commits: Commit[] = [
        { hash: "a", subject: "feat", body: "", author: "Lukas", date: "2024-01-01", type: "feat" },
        { hash: "b", subject: "feat2", body: "", author: "Lukas", date: "2024-01-01", type: "feat" },
        { hash: "c", subject: "fix", body: "", author: "Lukas", date: "2024-01-01", type: "fix" },
        { hash: "d", subject: "chore", body: "", author: "Lukas", date: "2024-01-01", type: "chore" },
        { hash: "e", subject: "breaking", body: "", author: "Lukas", date: "2024-01-01", type: "feat", breaking: "API" },
      ];
      const stats = generateStats(commits, true);
      expect(stats.total).toBe(5);
      expect(stats.feat).toBe(3);
      expect(stats.fix).toBe(1);
      expect(stats.internal).toBe(1);
      expect(stats.breaking).toBe(1);
    });

    test("should handle empty commits", () => {
      const stats = generateStats([], false);
      expect(stats.total).toBe(0);
      expect(stats.feat).toBe(0);
      expect(stats.fix).toBe(0);
    });
  });

  describe("formatStats", () => {
    test("should format stats correctly", () => {
      const stats = {
        total: 10,
        breaking: 1,
        feat: 3,
        fix: 2,
        internal: 4,
        other: 0,
      };
      const result = formatStats(stats, true);
      expect(result).toContain("10 commits");
      expect(result).toContain("1 breaking");
      expect(result).toContain("3 feat");
      expect(result).toContain("2 fix");
    });

    test("should skip zero counts", () => {
      const stats = {
        total: 1,
        breaking: 0,
        feat: 1,
        fix: 0,
        internal: 0,
        other: 0,
      };
      const result = formatStats(stats, false);
      expect(result).toContain("1 commits");
      expect(result).toContain("1 feat");
      expect(result).not.toContain("breaking");
      expect(result).not.toContain("fix");
    });

    test("should show internal filtered when not including internal", () => {
      const stats = {
        total: 5,
        breaking: 0,
        feat: 2,
        fix: 1,
        internal: 2,
        other: 0,
      };
      const result = formatStats(stats, false);
      expect(result).toContain("2 internal (filtered)");
    });
  });
});
