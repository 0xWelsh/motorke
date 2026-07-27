function renderBlock(block, index) {
  const text = block.trim();
  if (!text) return null;

  if (text.startsWith("## ")) {
    return (
      <h2
        key={index}
        className="text-xl sm:text-2xl font-bold text-white mt-10 mb-4"
      >
        {text.slice(3)}
      </h2>
    );
  }

  if (text.startsWith("### ")) {
    return (
      <h3
        key={index}
        className="text-lg font-bold text-white mt-8 mb-3"
      >
        {text.slice(4)}
      </h3>
    );
  }

  if (text.split("\n").every((line) => line.trim().startsWith("- "))) {
    return (
      <ul key={index} className="list-disc pl-5 space-y-2 text-zinc-300 my-4">
        {text.split("\n").map((line) => (
          <li key={line}>{line.replace(/^-\s*/, "")}</li>
        ))}
      </ul>
    );
  }

  return (
    <p key={index} className="text-zinc-300 leading-relaxed my-4">
      {text}
    </p>
  );
}

export default function SeoArticleBody({ body }) {
  if (!body) return null;
  const blocks = String(body).split(/\n\n+/);
  return <div className="max-w-3xl">{blocks.map(renderBlock)}</div>;
}
