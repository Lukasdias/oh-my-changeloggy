import { expect, test, describe } from "bun:test";
import { categorizeCommits, formatMarkdown } from "../src/formatter";
import { Commit } from "../src/types";

describe("formatter utilities", () => {
  const mockCommits: Commit[] = [
    {
      hash: "abc1234",
      subject: "add feature",
      body: "",
      author: "Lukas",
      date: "2024-01-01",
      type: "feat",
      scope: "ui"
    },
    {
      hash: "def5678",
      subject: "fix bug",
      body: "",
      author: "Lukas",
      date: "2024-01-01",
      type: "fix"
    },
    {
      hash: "ghi9012",
      subject: "update deps",
      body: "",
      author: "Lukas",
      date: "2024-01-01",
      type: "chore"
    }
  ];

  describe("categorizeCommits", () => {
    test("should categorize commits by type", () => {
      const categories = categorizeCommits(mockCommits, true);
      expect(categories.get("feat")).toHaveLength(1);
      expect(categories.get("fix")).toHaveLength(1);
      expect(categories.get("chore")).toHaveLength(1);
    });

    test("should filter internal types if includeInternal is false", () => {
      const categories = categorizeCommits(mockCommits, false);
      expect(categories.get("feat")).toHaveLength(1);
      expect(categories.get("fix")).toHaveLength(1);
      expect(categories.has("chore")).toBe(false);
    });
  });

  describe("formatMarkdown", () => {
    test("should format commits correctly", () => {
      const categories = categorizeCommits(mockCommits, false);
      const markdown = formatMarkdown(categories, "v1.0.0");
      
      expect(markdown).toContain("## v1.0.0");
      expect(markdown).toContain("### ✨ New Features");
      expect(markdown).toContain("- **ui**: add feature");
      expect(markdown).toContain("### 🐛 Bug Fixes");
      expect(markdown).toContain("- fix bug");
    });
  });
});
