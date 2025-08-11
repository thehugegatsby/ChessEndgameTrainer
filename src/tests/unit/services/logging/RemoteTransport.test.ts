/**
 * Tests for RemoteTransport flush() method
 *
 * Tests cover:
 * - Successful flush with buffer clearing
 * - Network error with log restoration
 * - HTTP error handling
 * - Concurrent flush prevention
 * - Early return conditions
 */

import { RemoteTransport } from "@shared/services/logging/Logger";
import { LogLevel, type LogEntry } from "@shared/services/logging/types";

// Helper to create log entries for tests
/**
 *
 * @param message
 * @param level
 */
const createLogEntry = (
  message: string,
  level: LogLevel = LogLevel.INFO,
): LogEntry => ({
  timestamp: new Date(),
  level,
  message,
});

describe("RemoteTransport.flush", () => {
  const ENDPOINT = "https://api.logs.com/v1/ingest";

  // Mock console.error to verify it's called on failure and keep test output clean
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock the global fetch function before each test
    global.fetch = jest.fn();
    // Reset console.error spy for each test
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Clear mock calls after each test
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    // Restore original console.error implementation after all tests
    consoleErrorSpy.mockRestore();
  });

  it("should send logs to the endpoint and clear the buffer on success", async () => {
    // Arrange
    const transport = new RemoteTransport(ENDPOINT);
    const log1 = createLogEntry("first log");
    const log2 = createLogEntry("second log");

    // Access private buffer for testing
    (transport as any).buffer.push(log1, log2);

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      /**
       *
       */
      json: () => Promise.resolve({}),
    });

    // Act
    await transport.flush();

    // Assert
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: [log1, log2] }),
    });

    // The buffer should be empty after a successful flush
    expect((transport as any).buffer.length).toBe(0);
  });

  it("should restore logs to the buffer on a network error", async () => {
    // Arrange
    const transport = new RemoteTransport(ENDPOINT);
    const log1 = createLogEntry("failed log 1");
    const log2 = createLogEntry("failed log 2");
    const originalLogs = [log1, log2];
    (transport as any).buffer.push(...originalLogs);

    const networkError = new Error("Network connection failed");
    (fetch as jest.Mock).mockRejectedValueOnce(networkError);

    // Act
    await transport.flush();

    // Assert
    // The logs should be put back into the buffer
    expect((transport as any).buffer).toEqual(originalLogs);
    // Verify fallback logging was called
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to send logs to remote:",
      networkError,
    );
  });

  it("should restore logs to the buffer on an HTTP error (e.g., 500)", async () => {
    // Arrange
    const transport = new RemoteTransport(ENDPOINT);
    const log1 = createLogEntry("failed log 1");
    const originalLogs = [log1];
    (transport as any).buffer.push(...originalLogs);

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    // Act
    await transport.flush();

    // Assert
    expect((transport as any).buffer).toEqual(originalLogs);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to send logs to remote:",
      new Error("Server responded with status 500"),
    );
  });

  it("should preserve chronological order by unshifting failed logs back to the buffer", async () => {
    // Arrange: Initial logs that will fail
    const transport = new RemoteTransport(ENDPOINT);
    const failedLog1 = createLogEntry("failed log 1");
    const failedLog2 = createLogEntry("failed log 2");
    (transport as any).buffer.push(failedLog1, failedLog2);

    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network failure"));

    // Act 1: First flush fails
    await transport.flush();

    // Arrange 2: A new log is added after the failure
    const newLog = createLogEntry("new log after failure");
    (transport as any).buffer.push(newLog);

    // The buffer should now be [failedLog1, failedLog2, newLog]
    // confirming chronological order preservation
    expect((transport as any).buffer).toEqual([failedLog1, failedLog2, newLog]);

    // Act 2: Second flush succeeds
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
    await transport.flush();

    // Assert 2: Fetch was called with all three logs in the correct order
    const sentBody = JSON.parse((fetch as jest.Mock).mock.calls[1][1].body);
    expect(sentBody.logs).toHaveLength(3);
    expect(sentBody.logs[0].message).toBe("failed log 1");
    expect(sentBody.logs[1].message).toBe("failed log 2");
    expect(sentBody.logs[2].message).toBe("new log after failure");
    expect((transport as any).buffer.length).toBe(0);
  });

  it("should prevent concurrent flushes using the isFlushing flag", async () => {
    // Arrange
    const transport = new RemoteTransport(ENDPOINT);
    (transport as any).buffer.push(createLogEntry("some log"));

    // Create a promise that we can resolve manually to simulate a long-running fetch
    let resolveFetch: (value: { ok: boolean }) => void;
    const fetchPromise = new Promise<{ ok: boolean }>((resolve) => {
      resolveFetch = resolve;
    });
    (fetch as jest.Mock).mockReturnValue(fetchPromise);

    // Act
    // Start the first flush, but don't wait for it to complete
    const firstFlushPromise = transport.flush();

    // While the first flush is "in-flight", call flush again
    // This should hit the guard clause and return early
    await transport.flush();

    // Assert
    // fetch should have only been called once by the first flush()
    expect(fetch).toHaveBeenCalledTimes(1);

    // Now, complete the first fetch call and wait for the promise to resolve
    resolveFetch!({ ok: true });
    await firstFlushPromise;

    // The buffer should now be empty, and the lock released
    expect((transport as any).buffer.length).toBe(0);
    expect((transport as any).isFlushing).toBe(false);
  });

  describe("Early return conditions", () => {
    it("should not call fetch if the buffer is empty", async () => {
      const transport = new RemoteTransport(ENDPOINT);
      await transport.flush();
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should not call fetch if the endpoint is not configured", async () => {
      // Pass an empty string for the endpoint
      const transport = new RemoteTransport("");
      (transport as any).buffer.push(createLogEntry("test log"));
      await transport.flush();
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
