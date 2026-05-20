import { buildDutyCalculatorJsonLd } from "@/lib/seo-duty";

export default function DutyJsonLd({ vehicle = null, pathname = "/duty" }) {
  const blocks = buildDutyCalculatorJsonLd({ vehicle, pathname });
  return (
    <>
      {blocks.map((block, i) => (
        <script
          // eslint-disable-next-line react/no-array-index-key
          key={`duty-ld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
