/** Skip URL-only stubs that contain no analyzable statement text. */
export function isAnalyzableStatementContent(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.length < 30) return false;

  const urlOnly =
    /^(RT:\s*)?https?:\/\/\S+$/i.test(trimmed) ||
    (/^RT:\s*https?:\/\//i.test(trimmed) && trimmed.length < 150);

  return !urlOnly;
}
