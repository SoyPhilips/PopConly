import type { Metadata } from "next";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = routeMetadata("series");

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
