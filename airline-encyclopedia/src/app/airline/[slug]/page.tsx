import { notFound } from "next/navigation";
import { getAirlineBySlug, getAllAirlineSlugs } from "@/data/airlines";
import AirlinePageClient from "./AirlinePageClient";

export function generateStaticParams() {
  return getAllAirlineSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const airline = getAirlineBySlug(slug);
  if (!airline) return { title: "Airline Not Found" };
  return {
    title: `${airline.name} — SkyAtlas`,
    description: `Explore ${airline.name}'s fleet, route map, and history. Founded in ${airline.founded}, headquartered in ${airline.headquarters}.`,
  };
}

export default async function AirlinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const airline = getAirlineBySlug(slug);
  if (!airline) notFound();
  return <AirlinePageClient airline={airline} />;
}
