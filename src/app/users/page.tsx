import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "../get-query-client";
import UserList from "./UserList";
import { buildUsersListQuery } from "@/features/users/hooks";

export default async function UsersPage() {
  const qc = getQueryClient();
  await qc.prefetchQuery(buildUsersListQuery({ search: "" }));

  return (
    <main style={{ padding: 24 }}>
      <h2>Users</h2>
      <HydrationBoundary state={dehydrate(qc)}>
        <UserList />
      </HydrationBoundary>
    </main>
  );
}
