"use client";
import dynamic from "next/dynamic";

const HeroGridShowcase = dynamic(() => import("@/components/HeroGridShowcase"), { ssr: false });

export default function LazyHeroGridShowcase(props) {
  return <HeroGridShowcase {...props} />;
}
