/**
 * Format actual output for display
 * @param output Raw output from execution
 * @returns Formatted output
 */
export function formatActualOutput(output: any): string {
  if (
    output &&
    typeof output === "object" &&
    output.exceptionType &&
    output.exceptionMessage
  ) {
    return `Exception: ${output.exceptionType}\nMessage: ${output.exceptionMessage}`;
  }
  if (output && typeof output === "object") {
    // Instead of dumping raw JSON, show key-value pairs in a readable way
    return Object.entries(output)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join("\n");
  }
  return String(output);
}
