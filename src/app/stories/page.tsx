import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "../get-query-client";
import StoryList from "./StoryList";
import { buildPublicStoriesListQuery } from "@/features/stories/hooks";

export default async function StoriesPage() {
  const qc = getQueryClient();
  await qc.prefetchQuery(buildPublicStoriesListQuery());

  return (
    <main style={{ padding: 24 }}>
      <h2>Stories</h2>
      <HydrationBoundary state={dehydrate(qc)}>
        <StoryList />
      </HydrationBoundary>
    </main>
  );
}

