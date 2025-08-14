"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  buildPublicStoriesListQuery,
  useCreatePublicStory,
} from "@/features/stories/hooks";

export default function StoryList() {
  const { data, isPending, isError, error } = useQuery(
    buildPublicStoriesListQuery()
  );
  const createStory = useCreatePublicStory();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  if (isPending) return <p>Loading stories...</p>;
  if (isError)
    return (
      <p style={{ color: "red" }}>Error: {(error as Error).message}</p>
    );

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createStory.mutate(
            {
              title,
              content,
              storyType: "custom",
              difficulty: "beginner",
            },
            {
              onSuccess: () => {
                setTitle("");
                setContent("");
              },
            }
          );
        }}
        style={{ display: "grid", gap: 8, maxWidth: 400 }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
          required
          rows={4}
        />
        <button type="submit" disabled={createStory.isPending}>
          {createStory.isPending ? "Creating..." : "Add Story"}
        </button>
      </form>

      <ul style={{ display: "grid", gap: 8 }}>
        {data?.map((s) => (
          <li
            key={s.id}
            style={{
              padding: 8,
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          >
            <h4 style={{ margin: "0 0 4px" }}>{s.title}</h4>
            <p style={{ margin: 0, fontSize: 14 }}>{s.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

