import type { Metadata } from "next";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = routeMetadata("my-list");

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
