import { getMockUser, getMockSession, type MockUser, type MockSession } from "./mock-auth";
import { useState, useEffect } from "react";

// Mock auth client that doesn't require any backend authentication
// Generates a unique browser-based user ID

export interface AuthClient {
  useSession: () => { data: MockSession | null; isPending: boolean };
  signIn: {
    social: (options: { provider: string; callbackURL: string }) => Promise<void>;
    magicLink: (
      options: { email: string; callbackURL: string },
      callbacks?: { onSuccess?: (ctx: any) => void; onError?: (ctx: any) => void },
    ) => Promise<void>;
  };
  signOut: (options?: { fetchOptions?: { onSuccess?: () => void } }) => Promise<void>;
}

// Hook for using session in React components
function useMockSession() {
  const [session, setSession] = useState<MockSession | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    // Simulate a brief loading state then return mock session
    const timer = setTimeout(() => {
      setSession(getMockSession());
      setIsPending(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return { data: session, isPending };
}

export const authClient: AuthClient = {
  useSession: useMockSession,
  signIn: {
    social: async () => {
      // No-op: social sign-in not needed with mock auth
      console.log("Mock social sign-in (no-op)");
    },
    magicLink: async (_options, callbacks) => {
      // Simulate magic link success
      setTimeout(() => {
        callbacks?.onSuccess?.({});
      }, 100);
    },
  },
  signOut: async (options) => {
    // No-op: can't really sign out with mock auth
    options?.fetchOptions?.onSuccess?.();
  },
};
