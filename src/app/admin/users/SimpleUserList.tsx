"use client";
import { logger } from '@/lib/logger';

import { useQuery } from "@tanstack/react-query";
import { buildUsersListQuery, User } from "@/features/users/hooks";

export default function SimpleUserList() {
  logger.info('🔄 [CLIENT] SimpleUserList component rendering...');
  
  const startTime = Date.now();
  const q = useQuery(buildUsersListQuery({ search: "" }));
  const queryTime = Date.now() - startTime;
  
  // Query hook now handles API response extraction internally
  const users = q.data || [];
  
  logger.info('⚡ [CLIENT] useQuery hook took', { queryTimeMs: queryTime });
  logger.info('📊 [CLIENT] Query state:', { 
    isLoading: q.isLoading, 
    isFetching: q.isFetching, 
    isError: q.isError,
    usersCount: users.length,
    dataType: Array.isArray(users) ? 'array' : typeof users
  });

  if (q.isLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>⏳ Loading users...</p>
      </div>
    );
  }

  if (q.isError) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red" }}>
        <p>❌ Error loading users: {q.error?.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h2>👥 Simple User List (Performance Test)</h2>
      <p>Found {users.length} users ✅</p>
      
      <div style={{ 
        backgroundColor: "white", 
        border: "1px solid #e2e8f0", 
        borderRadius: 8,
        marginTop: 16 
      }}>
        {users.map((user: User) => (
          <div
            key={user.id}
            style={{
              padding: 16,
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <strong>{user.name}</strong>
              <br />
              <span style={{ color: "#6b7280", fontSize: 14 }}>
                {user.email}
              </span>
            </div>
            <span style={{
              padding: "4px 8px",
              backgroundColor: "#f3f4f6",
              borderRadius: 4,
              fontSize: 12
            }}>
              {user.role}
            </span>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: 16, fontSize: 12, color: "#6b7280" }}>
        🔧 Performance: Query took {queryTime}ms
      </div>
    </div>
  );
}
