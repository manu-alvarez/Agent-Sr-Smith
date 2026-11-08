export function parseMarkdownSections(markdown: string): Array<{ heading: string; body: string }> {
  const sections: Array<{ heading: string; body: string }> = [];
  let heading = "intro";
  let lines: string[] = [];
  const flush = () => {
    const body = lines.join("\n").trim();
    if (body) sections.push({ heading, body });
    lines = [];
  };
  for (const line of markdown.split("\n")) {
    if (line.startsWith("#")) {
      flush();
      heading = line.replace(/^#+\s*/, "").trim() || heading;
    } else lines.push(line);
  }
  flush();
  return sections;
}
