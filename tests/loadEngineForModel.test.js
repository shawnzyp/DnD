import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function extractFunctionSource(source, functionName) {
  const declaration = `const ${functionName} =`;
  const start = source.indexOf(declaration);
  if (start === -1) {
    throw new Error(`Function ${functionName} not found`);
  }
  let cursor = start + declaration.length;
  const arrowIndex = source.indexOf("=>", cursor);
  if (arrowIndex === -1) {
    throw new Error(`Arrow for ${functionName} not found`);
  }
  const bodyStart = source.indexOf("{", arrowIndex);
  if (bodyStart === -1) {
    throw new Error(`Body for ${functionName} not found`);
  }
  let depth = 0;
  let end = bodyStart;
  while (end < source.length) {
    const char = source[end];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end += 1;
        break;
      }
    }
    end += 1;
  }
  const statement = source.slice(start, end);
  return statement;
}

describe("loadEngineForModel", () => {
  it("reports a failure when the engine self-test rejects", async () => {
    const htmlPath = join(__dirname, "..", "index.html");
    const html = readFileSync(htmlPath, "utf8");
    const functionSource = extractFunctionSource(html, "loadEngineForModel");
    const expressionSource = functionSource
      .replace(/^const\s+loadEngineForModel\s*=\s*/, "")
      .trim()
      .replace(/;$/, "");

    const context = {
      queuedModelId: null,
      pendingModelReload: null,
      engineInitializing: false,
      engineInitFailed: false,
      loadingModelId: null,
      sendBtn: { disabled: false },
      modelSelect: null,
      updateModelMetadata: vi.fn(),
      updateStatus: vi.fn(),
      disposeEngine: vi.fn(async () => {
        context.engine = null;
      }),
      activeModelId: null,
      ensureWebLLMModule: vi.fn(async () => ({
        CreateMLCEngine: vi.fn(async () => {
          context.engine = context.mockEngine;
          return context.mockEngine;
        })
      })),
      engine: null,
      findFallbackModel: vi.fn(() => null),
      availableModels: [],
      safeStorage: { set: vi.fn() },
      STORAGE_KEYS: { model: "model" },
      appendMessage: vi.fn(),
      getModelDisplayName: (model) => model.display_name ?? model.model_id ?? "Model",
      reportEngineFailure: vi.fn(),
      console,
      setTimeout,
      clearTimeout
    };

    context.mockEngine = {
      chat: {
        completions: {
          create: vi.fn(() => Promise.reject(new Error("health-check")))
        }
      }
    };

    vm.createContext(context);
    vm.runInContext(`loadEngineForModel = ${expressionSource}`, context);

    const model = { model_id: "test", display_name: "Test Model" };
    const result = await context.loadEngineForModel(model, { userInitiated: true });

    expect(result).toBe(false);
    expect(context.disposeEngine.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(context.reportEngineFailure).toHaveBeenCalledTimes(1);
    const [statusText, logText] = context.reportEngineFailure.mock.calls[0];
    expect(statusText).toMatch(/health check failed/i);
    expect(logText).toMatch(/health check/i);
    expect(context.mockEngine.chat.completions.create).toHaveBeenCalledTimes(1);
  });
});
