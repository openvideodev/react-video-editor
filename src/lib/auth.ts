import {
  mockAuthApi,
  getMockSession,
  getMockUser,
  type MockSession,
  type MockUser,
} from "./mock-auth";

// Mock auth for server-side usage
// No database or real authentication required

export const auth = {
  api: mockAuthApi,
};

export { getMockSession, getMockUser, type MockSession, type MockUser };
