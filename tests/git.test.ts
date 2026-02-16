import { expect, test, describe } from "bun:test";
import { parseConventionalCommit, extractBreakingChange } from "../src/git";

describe("git utilities", () => {
  describe("parseConventionalCommit", () => {
    test("should parse simple feat", () => {
      const result = parseConventionalCommit("feat: add something");
      expect(result.type).toBe("feat");
      expect(result.description).toBe("add something");
      expect(result.scope).toBeUndefined();
      expect(result.isBreaking).toBe(false);
    });

    test("should parse feat with scope", () => {
      const result = parseConventionalCommit("feat(api): add something");
      expect(result.type).toBe("feat");
      expect(result.description).toBe("add something");
      expect(result.scope).toBe("api");
    });

    test("should parse fix", () => {
      const result = parseConventionalCommit("fix: bug");
      expect(result.type).toBe("fix");
    });

    test("should handle unknown types as other", () => {
      const result = parseConventionalCommit("unknown: something");
      expect(result.type).toBe("other");
    });

    test("should handle non-conventional commits as other", () => {
      const result = parseConventionalCommit("just a commit message");
      expect(result.type).toBe("other");
      expect(result.description).toBe("just a commit message");
    });

    test("should detect breaking change marker (!)", () => {
      const result = parseConventionalCommit("feat!: breaking change");
      expect(result.type).toBe("feat");
      expect(result.isBreaking).toBe(true);
      expect(result.description).toBe("breaking change");
    });

    test("should detect breaking change with scope", () => {
      const result = parseConventionalCommit("fix(api)!: breaking fix");
      expect(result.type).toBe("fix");
      expect(result.scope).toBe("api");
      expect(result.isBreaking).toBe(true);
    });
  });

  describe("extractBreakingChange", () => {
    test("should extract BREAKING CHANGE from body", () => {
      const body = "Some description\n\nBREAKING CHANGE: This changes the API";
      const result = extractBreakingChange(body);
      expect(result).toBe("This changes the API");
    });

    test("should extract BREAKING-CHANGE with hyphen", () => {
      const body = "Some description\n\nBREAKING-CHANGE: This changes the API";
      const result = extractBreakingChange(body);
      expect(result).toBe("This changes the API");
    });

    test("should return undefined when no breaking change", () => {
      const body = "Some description\n\nOther info";
      const result = extractBreakingChange(body);
      expect(result).toBeUndefined();
    });

    test("should handle empty body", () => {
      const result = extractBreakingChange("");
      expect(result).toBeUndefined();
    });
  });
});
