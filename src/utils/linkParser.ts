export function parseBidirectionalLinks(text: string): { parsedText: string; links: string[] } {
  // Regex to match [[Anything Inside]]
  const regex = /\[\[(.*?)\]\]/g;
  const links: string[] = [];
  
  // Replace [[Link]] with an anchor tag or custom data attribute for React to hook into,
  // but since we render markdown, we can just replace it with a standard markdown link or HTML span.
  // We'll use a semantic custom tag structure: <span data-link="LinkName" class="internal-link">LinkName</span>
  const parsedText = text.replace(regex, (match, p1) => {
    links.push(p1);
    return `<a href="#" data-internal-link="${p1}" class="internal-link">${p1}</a>`;
  });

  return { parsedText, links };
}
