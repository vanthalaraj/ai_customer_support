// Tiny, safe renderer for the formatting models commonly return:
// **bold**, "- " / "* " bullet lists, "1. " numbered lists and line breaks.
// Nothing is injected as HTML, so message text can never run scripts.

function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.length > 4 && part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

export default function RichText({ text }) {
  const blocks = [];
  let list = null;

  text.split("\n").forEach((line) => {
    const item = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (item) {
      const ordered = /^\s*\d+[.)]/.test(line);
      if (!list || list.ordered !== ordered) {
        list = { ordered, items: [] };
        blocks.push(list);
      }
      list.items.push(item[1]);
    } else {
      list = null;
      if (line.trim()) blocks.push({ paragraph: line });
    }
  });

  return (
    <>
      {blocks.map((block, i) => {
        if (block.items) {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag key={i}>
              {block.items.map((it, j) => (
                <li key={j}>{inline(it)}</li>
              ))}
            </Tag>
          );
        }
        return <p key={i}>{inline(block.paragraph)}</p>;
      })}
    </>
  );
}
