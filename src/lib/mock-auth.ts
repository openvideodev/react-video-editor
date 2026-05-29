// Mock authentication system that generates a unique browser-based user ID
// No database or real authentication required

import { nanoid } from "nanoid";

const USER_ID_KEY = "ov_editor_user_id";
const USER_NAME_KEY = "ov_editor_user_name";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface MockSession {
  user: MockUser;
}

// Generate or retrieve a unique user ID for this browser
function getOrCreateUserId(): string {
  if (typeof window === "undefined") {
    return "server-user-" + nanoid(8);
  }

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = "user-" + nanoid(10);
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

// Get or create user name
function getOrCreateUserName(): string {
  if (typeof window === "undefined") {
    return "Anonymous";
  }

  let userName = localStorage.getItem(USER_NAME_KEY);
  if (!userName) {
    userName = "User " + Math.floor(Math.random() * 10000);
    localStorage.setItem(USER_NAME_KEY, userName);
  }
  return userName;
}

// Get the current mock user
export function getMockUser(): MockUser {
  const id = getOrCreateUserId();
  const name = getOrCreateUserName();

  return {
    id,
    name,
    email: `${id}@local.dev`,
    image: null,
  };
}

// Get the current mock session (always returns a valid session)
export function getMockSession(): MockSession {
  return {
    user: getMockUser(),
  };
}

// Mock auth API for server-side usage
export const mockAuthApi = {
  getSession: async () => {
    return getMockSession();
  },
  signOut: async () => {
    // No-op: can't really sign out with mock auth
    return { success: true };
  },
  updateUser: async ({ body }: { body: Partial<MockUser> }) => {
    if (typeof window !== "undefined") {
      if (body.name) {
        localStorage.setItem(USER_NAME_KEY, body.name);
      }
    }
    return getMockUser();
  },
  listUserAccounts: async () => {
    return [];
  },
  unlinkAccount: async () => {
    return { success: true };
  },
};

// Server-side function to get mock session (for API routes)
export async function getServerMockSession(): Promise<MockSession> {
  return getMockSession();
}

// Hardcoded user ID for uploads and other operations requiring a user ID
export function getUserId(): string {
  return getOrCreateUserId();
}
