export const queryProfiles = {
  list:    { staleTime: 60_000, gcTime: 10 * 60_000 },
  detail:  { staleTime: 5 * 60_000, gcTime: 30 * 60_000 },
  static:  { staleTime: 60 * 60_000, gcTime: 24 * 60 * 60_000, refetchOnWindowFocus: false, retry: 0 },
  realtime:{ staleTime: 5_000, gcTime: 5 * 60_000, refetchInterval: 5_000, refetchIntervalInBackground: true },
} as const;
export type QueryProfileName = keyof typeof queryProfiles;
