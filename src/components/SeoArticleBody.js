import Link from "next/link";

function renderInline(text) {
  const parts = [];
  let remaining = text;
  let key = 0;
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  let lastIndex = 0;
  while ((match = regex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index));
    }
    const label = match[1];
    const href = match[2];
    if (href.startsWith("/") || href.startsWith("#")) {
      parts.push(
        <Link key={key++} href={href} className="text-emerald-700 hover:underline font-medium">
          {label}
        </Link>
      );
    } else {
      parts.push(
        <a key={key++} href={href} className="text-emerald-700 hover:underline font-medium" target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

function renderBlock(block, index) {
  const text = block.trim();
  if (!text) return null;

  if (text.startsWith("## ")) {
    return (
      <h2
        key={index}
        className="text-xl sm:text-2xl font-bold text-slate-900 mt-10 mb-4"
      >
        {renderInline(text.slice(3))}
      </h2>
    );
  }

  if (text.startsWith("### ")) {
    return (
      <h3
        key={index}
        className="text-lg font-bold text-slate-900 mt-8 mb-3"
      >
        {renderInline(text.slice(4))}
      </h3>
    );
  }

  if (text.split("\n").every((line) => line.trim().startsWith("- "))) {
    return (
      <ul key={index} className="list-disc pl-5 space-y-2 text-slate-500 my-4">
        {text.split("\n").map((line, i) => (
          <li key={i}>{renderInline(line.replace(/^-\s*/, ""))}</li>
        ))}
      </ul>
    );
  }

  return (
    <p key={index} className="text-slate-500 leading-relaxed my-4">
      {renderInline(text)}
    </p>
  );
}

export default function SeoArticleBody({ body }) {
  if (!body) return null;
  const blocks = String(body).split(/\n\n+/);
  return <div className="max-w-3xl">{blocks.map(renderBlock)}</div>;
}
