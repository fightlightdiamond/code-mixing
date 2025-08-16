import LogRocket from 'logrocket';

const LOGROCKET_ID = process.env.NEXT_PUBLIC_LOGROCKET_ID;
export const isLogRocketEnabled =
  !!LOGROCKET_ID && typeof window !== 'undefined' && process.env.NODE_ENV !== 'development';

if (isLogRocketEnabled) {
  LogRocket.init(LOGROCKET_ID!);
}

export default LogRocket;
