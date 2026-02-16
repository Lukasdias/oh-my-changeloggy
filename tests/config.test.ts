import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { loadConfig, mergeWithConfig } from "../src/config";

describe("config utilities", () => {
  const configPath = ".changeloggy.json";

  beforeEach(() => {
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  });

  afterEach(() => {
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  });

  describe("loadConfig", () => {
    test("should return empty object when config file does not exist", () => {
      const config = loadConfig();
      expect(Object.keys(config)).toHaveLength(0);
    });

    test("should load valid config file", () => {
      const configData = {
        output: "CHANGELOG.md",
        format: "markdown",
        includeInternal: false,
        scopes: ["api", "ui"],
      };
      writeFileSync(configPath, JSON.stringify(configData));

      const config = loadConfig();
      expect(config.output).toBe("CHANGELOG.md");
      expect(config.format).toBe("markdown");
      expect(config.includeInternal).toBe(false);
      expect(config.scopeFilter).toEqual(["api", "ui"]);
    });

    test("should handle partial config", () => {
      const configData = { output: "HISTORY.md" };
      writeFileSync(configPath, JSON.stringify(configData));

      const config = loadConfig();
      expect(config.output).toBe("HISTORY.md");
      expect(config.format).toBeUndefined();
    });

    test("should return empty object for invalid JSON", () => {
      writeFileSync(configPath, "not valid json");
      const config = loadConfig();
      expect(Object.keys(config)).toHaveLength(0);
    });
  });

  describe("mergeWithConfig", () => {
    test("should use defaults when no config or options provided", () => {
      const options = mergeWithConfig({});
      expect(options.dryRun).toBe(false);
      expect(options.format).toBe("markdown");
      expect(options.includeInternal).toBe(false);
      expect(options.interactive).toBe(true);
      expect(options.prepend).toBe(false);
    });

    test("should merge config file values", () => {
      const configData = { output: "CHANGELOG.md", format: "json" as const };
      writeFileSync(configPath, JSON.stringify(configData));

      const options = mergeWithConfig({});
      expect(options.output).toBe("CHANGELOG.md");
      expect(options.format).toBe("json");
    });

    test("should prefer CLI options over config file", () => {
      const configData = { output: "CHANGELOG.md", format: "json" as const };
      writeFileSync(configPath, JSON.stringify(configData));

      const options = mergeWithConfig({ output: "HISTORY.md", format: "markdown" as const });
      expect(options.output).toBe("HISTORY.md");
      expect(options.format).toBe("markdown");
    });

    test("should convert scopes to scopeFilter", () => {
      const configData = { scopes: ["api", "core"] };
      writeFileSync(configPath, JSON.stringify(configData));

      const options = mergeWithConfig({});
      expect(options.scopeFilter).toEqual(["api", "core"]);
    });
  });
});
