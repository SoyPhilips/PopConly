"use client";

import { useEffect, useState } from "react";
import BrowseHeader from "@/components/BrowseHeader";
import BrowseFooter from "@/components/BrowseFooter";
import SearchResults from "@/components/SearchResults";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#0D0D11] text-[#e4e1e7]">
      <BrowseHeader query={query} onQueryChange={setQuery} />

      <main className="w-full px-4 md:px-8 lg:px-14 pt-24 pb-10 max-w-[1800px] mx-auto">
        <SearchResults query={query} onQueryChange={setQuery} />
      </main>

      <BrowseFooter />
    </div>
  );
}
