// src/components/detail/CarWikiBlock.js
// Streams the model wiki / buyer notes block after the listing shell.
import { resolveModelWikiForCar } from "@/lib/seo-model-wiki";
import CarModelWiki from "@/components/CarModelWiki";

export default async function CarWikiBlock({ car }) {
  const wiki = await resolveModelWikiForCar(car);
  return <CarModelWiki car={car} wiki={wiki} />;
}