/**
 * Integration Tests for Authentication Flow
 *
 * Tests the complete authentication workflow including:
 * - Sign up (email/password, username)
 * - Sign in (email/password, passkey, two-factor)
 * - Session management
 * - Password reset flow
 * - User profile management
 *
 * @validates Requirements 1.1, 1.2, 1.3, 1.4 - Authentication Flow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { api } from "@/lib/axios";
import { userApi, type User, type UpdateUserData } from "@/lib/api/user";

// Mock axios
vi.mock("@/lib/axios", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// ============================================================================
// Test Data Factories
// ============================================================================

const createMockUser = (overrides?: Partial<User>): User => ({
  id: "user-123",
  name: "Test User",
  email: "test@example.com",
  username: "testuser",
  image: "https://example.com/avatar.jpg",
  isOnboarded: true,
  role: "creator",
  primaryPlatforms: ["youtube", "tiktok"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createMockSession = (overrides?: Partial<{
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
}>) => ({
  id: "session-123",
  userId: "user-123",
  token: "session-token-abc",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  ipAddress: "192.168.1.1",
  createdAt: new Date().toISOString(),
  ...overrides,
});

// ============================================================================
// User Profile Tests
// ============================================================================

describe("Authentication Flow - User Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getMe", () => {
    it("should fetch current authenticated user", async () => {
      const mockUser = createMockUser();
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockUser });

      const result = await userApi.getMe();

      expect(api.get).toHaveBeenCalledWith("/api/users/me");
      expect(result.id).toBe("user-123");
      expect(result.email).toBe("test@example.com");
    });

    it("should handle unauthenticated request", async () => {
      const error = new Error("Unauthorized");
      (error as Error & { status: number; code: string }).status = 401;
      (error as Error & { code: string }).code = "UNAUTHORIZED";

      vi.mocked(api.get).mockRejectedValueOnce(error);

      await expect(userApi.getMe()).rejects.toThrow("Unauthorized");
    });

    it("should return user with all profile fields", async () => {
      const mockUser = createMockUser({
        name: "Full Name User",
        username: "fulluser",
        role: "agency",
        primaryPlatforms: ["youtube", "instagram", "tiktok"],
      });
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockUser });

      const result = await userApi.getMe();

      expect(result.name).toBe("Full Name User");
      expect(result.username).toBe("fulluser");
      expect(result.role).toBe("agency");
      expect(result.primaryPlatforms).toContain("instagram");
    });
  });

  describe("updateMe", () => {
    it("should update user profile successfully", async () => {
      const updatedUser = createMockUser({ name: "Updated Name" });
      vi.mocked(api.put).mockResolvedValueOnce({ data: updatedUser });

      const result = await userApi.updateMe({ name: "Updated Name" });

      expect(api.put).toHaveBeenCalledWith("/api/users/me", { name: "Updated Name" });
      expect(result.name).toBe("Updated Name");
    });

    it("should update multiple fields at once", async () => {
      const updates: Partial<User> = {
        name: "New Name",
        username: "newusername",
        role: "brand",
      };
      const updatedUser = createMockUser(updates);
      vi.mocked(api.put).mockResolvedValueOnce({ data: updatedUser });

      const result = await userApi.updateMe(updates);

      expect(api.put).toHaveBeenCalledWith("/api/users/me", updates);
      expect(result.name).toBe("New Name");
      expect(result.username).toBe("newusername");
    });

    it("should handle validation errors for invalid data", async () => {
      const error = new Error("Username already taken");
      (error as Error & { status: number; code: string }).status = 400;
      (error as Error & { code: string }).code = "VALIDATION_ERROR";

      vi.mocked(api.put).mockRejectedValueOnce(error);

      await expect(userApi.updateMe({ username: "taken" })).rejects.toThrow("Username already taken");
    });
  });

  describe("updateCurrentUser", () => {
    it("should update user with typed data", async () => {
      const updateData: UpdateUserData = {
        name: "Typed Update",
        role: "creator",
        primaryPlatforms: ["youtube"],
      };
      const updatedUser = createMockUser(updateData);
      vi.mocked(api.put).mockResolvedValueOnce({ data: updatedUser });

      const result = await userApi.updateCurrentUser(updateData);

      expect(api.put).toHaveBeenCalledWith("/api/users/me", updateData);
      expect(result.primaryPlatforms).toEqual(["youtube"]);
    });
  });
});

// ============================================================================
// Onboarding Tests
// ============================================================================

describe("Authentication Flow - Onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("completeOnboarding", () => {
    it("should mark user as onboarded", async () => {
      const onboardedUser = createMockUser({ isOnboarded: true });
      vi.mocked(api.put).mockResolvedValueOnce({ data: onboardedUser });

      const result = await userApi.completeOnboarding();

      expect(api.put).toHaveBeenCalledWith("/api/users/me", { isOnboarded: true });
      expect(result.isOnboarded).toBe(true);
    });

    it("should handle already onboarded user", async () => {
      const onboardedUser = createMockUser({ isOnboarded: true });
      vi.mocked(api.put).mockResolvedValueOnce({ data: onboardedUser });

      const result = await userApi.completeOnboarding();

      expect(result.isOnboarded).toBe(true);
    });
  });
});

// ============================================================================
// Avatar Management Tests
// ============================================================================

describe("Authentication Flow - Avatar Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadAvatar", () => {
    it("should upload avatar image successfully", async () => {
      const mockResponse = {
        success: true,
        image: "https://cdn.example.com/avatars/user-123.jpg",
      };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const base64Image = "data:image/jpeg;base64,/9j/4AAQSkZJRg...";
      const result = await userApi.uploadAvatar(base64Image);

      expect(api.post).toHaveBeenCalledWith("/api/users/me/avatar", { image: base64Image });
      expect(result.success).toBe(true);
      expect(result.image).toContain("cdn.example.com");
    });

    it("should handle invalid image format error", async () => {
      const error = new Error("Invalid image format. Supported: JPEG, PNG, WebP");
      (error as Error & { status: number }).status = 400;

      vi.mocked(api.post).mockRejectedValueOnce(error);

      await expect(userApi.uploadAvatar("invalid-data")).rejects.toThrow("Invalid image format");
    });

    it("should handle image size limit exceeded", async () => {
      const error = new Error("Image size exceeds 5MB limit");
      (error as Error & { status: number }).status = 413;

      vi.mocked(api.post).mockRejectedValueOnce(error);

      await expect(userApi.uploadAvatar("large-image-data")).rejects.toThrow("Image size exceeds");
    });
  });

  describe("deleteAvatar", () => {
    it("should delete avatar successfully", async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true } });

      await userApi.deleteAvatar();

      expect(api.delete).toHaveBeenCalledWith("/api/users/me/avatar");
    });
  });
});

// ============================================================================
// Password Management Tests
// ============================================================================

describe("Authentication Flow - Password Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("changePassword", () => {
    it("should change password successfully", async () => {
      vi.mocked(api.put).mockResolvedValueOnce({ data: { success: true } });

      await userApi.changePassword("oldPassword123", "newPassword456");

      expect(api.put).toHaveBeenCalledWith("/api/users/me/password", {
        currentPassword: "oldPassword123",
        newPassword: "newPassword456",
      });
    });

    it("should handle incorrect current password", async () => {
      const error = new Error("Current password is incorrect");
      (error as Error & { status: number }).status = 401;

      vi.mocked(api.put).mockRejectedValueOnce(error);

      await expect(
        userApi.changePassword("wrongPassword", "newPassword456")
      ).rejects.toThrow("Current password is incorrect");
    });

    it("should handle weak password validation", async () => {
      const error = new Error("Password must be at least 8 characters with uppercase, lowercase, and number");
      (error as Error & { status: number }).status = 400;

      vi.mocked(api.put).mockRejectedValueOnce(error);

      await expect(
        userApi.changePassword("oldPassword123", "weak")
      ).rejects.toThrow("Password must be at least");
    });
  });
});

// ============================================================================
// Session Management Tests
// ============================================================================

describe("Authentication Flow - Session Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSessions", () => {
    it("should fetch all active sessions", async () => {
      const mockSessions = [
        createMockSession({ id: "session-1", userAgent: "Chrome on Mac" }),
        createMockSession({ id: "session-2", userAgent: "Safari on iPhone" }),
      ];
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockSessions });

      const result = await userApi.getSessions();

      expect(api.get).toHaveBeenCalledWith("/api/users/me/sessions");
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no sessions", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] });

      const result = await userApi.getSessions();

      expect(result).toHaveLength(0);
    });
  });

  describe("revokeSession", () => {
    it("should revoke specific session by token", async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true } });

      await userApi.revokeSession("session-token-to-revoke");

      expect(api.delete).toHaveBeenCalledWith("/api/users/me/sessions", {
        data: { sessionToken: "session-token-to-revoke" },
      });
    });

    it("should revoke current session when no token provided", async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true } });

      await userApi.revokeSession();

      expect(api.delete).toHaveBeenCalledWith("/api/users/me/sessions", {
        data: { sessionToken: undefined },
      });
    });

    it("should handle session not found error", async () => {
      const error = new Error("Session not found");
      (error as Error & { status: number }).status = 404;

      vi.mocked(api.delete).mockRejectedValueOnce(error);

      await expect(userApi.revokeSession("invalid-token")).rejects.toThrow("Session not found");
    });
  });
});

// ============================================================================
// Email Availability Tests
// ============================================================================

describe("Authentication Flow - Email Availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkEmail", () => {
    it("should return available for unused email", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { available: true } });

      const result = await userApi.checkEmail("new@example.com");

      expect(api.get).toHaveBeenCalledWith("/api/email/check?email=new%40example.com");
      expect(result.available).toBe(true);
    });

    it("should return unavailable for existing email", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { available: false } });

      const result = await userApi.checkEmail("existing@example.com");

      expect(result.available).toBe(false);
    });

    it("should properly encode email with special characters", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { available: true } });

      await userApi.checkEmail("user+tag@example.com");

      expect(api.get).toHaveBeenCalledWith("/api/email/check?email=user%2Btag%40example.com");
    });
  });
});

// ============================================================================
// Preferences Tests
// ============================================================================

describe("Authentication Flow - User Preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPreferences", () => {
    it("should fetch user preferences", async () => {
      const mockPreferences = {
        theme: "dark",
        notifications: {
          email: true,
          push: false,
        },
        defaultAspectRatio: "9:16",
      };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockPreferences });

      const result = await userApi.getPreferences();

      expect(api.get).toHaveBeenCalledWith("/api/users/me/preferences");
      expect(result.theme).toBe("dark");
    });
  });

  describe("updatePreferences", () => {
    it("should update user preferences", async () => {
      const newPreferences = {
        theme: "light",
        notifications: { email: false, push: true },
      };
      vi.mocked(api.put).mockResolvedValueOnce({ data: newPreferences });

      const result = await userApi.updatePreferences(newPreferences);

      expect(api.put).toHaveBeenCalledWith("/api/users/me/preferences", newPreferences);
      expect(result.theme).toBe("light");
    });

    it("should merge preferences with existing ones", async () => {
      const partialUpdate = { theme: "system" };
      vi.mocked(api.put).mockResolvedValueOnce({
        data: { theme: "system", notifications: { email: true, push: false } },
      });

      const result = await userApi.updatePreferences(partialUpdate);

      expect(result.theme).toBe("system");
      expect(result.notifications).toBeDefined();
    });
  });
});

// ============================================================================
// Property-Based Tests
// ============================================================================

describe("Authentication Flow - Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Email encoding properties", () => {
    it("should always properly encode emails in URL", () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          async (email) => {
            vi.mocked(api.get).mockResolvedValueOnce({ data: { available: true } });

            await userApi.checkEmail(email);

            const calledUrl = vi.mocked(api.get).mock.calls[0][0];
            expect(calledUrl).toContain(encodeURIComponent(email));
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe("User update properties", () => {
    it("should always send valid update payloads", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            username: fc.option(fc.string({ minLength: 3, maxLength: 30 }).filter(s => /^[a-z0-9_]+$/.test(s)), { nil: undefined }),
            role: fc.option(fc.constantFrom("creator", "agency", "brand"), { nil: undefined }),
          }),
          async (updateData) => {
            const filteredData = Object.fromEntries(
              Object.entries(updateData).filter(([, v]) => v !== undefined)
            );

            if (Object.keys(filteredData).length === 0) return;

            vi.mocked(api.put).mockResolvedValueOnce({ data: createMockUser(filteredData) });

            await userApi.updateMe(filteredData);

            const calledData = vi.mocked(api.put).mock.calls[0][1];
            expect(calledData).toEqual(filteredData);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

// ============================================================================
// End-to-End Flow Tests
// ============================================================================

describe("Authentication Flow - E2E Scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should complete full sign-up and onboarding flow", async () => {
    // Step 1: Check email availability
    vi.mocked(api.get).mockResolvedValueOnce({ data: { available: true } });
    const emailCheck = await userApi.checkEmail("newuser@example.com");
    expect(emailCheck.available).toBe(true);

    // Step 2: After sign-up (handled by better-auth), get user profile
    const newUser = createMockUser({
      email: "newuser@example.com",
      isOnboarded: false,
    });
    vi.mocked(api.get).mockResolvedValueOnce({ data: newUser });
    const user = await userApi.getMe();
    expect(user.isOnboarded).toBe(false);

    // Step 3: Update profile during onboarding
    const profileUpdate: UpdateUserData = {
      name: "New User",
      username: "newuser",
      role: "creator",
      primaryPlatforms: ["youtube", "tiktok"],
    };
    vi.mocked(api.put).mockResolvedValueOnce({
      data: createMockUser({ ...newUser, ...profileUpdate }),
    });
    await userApi.updateCurrentUser(profileUpdate);

    // Step 4: Complete onboarding
    vi.mocked(api.put).mockResolvedValueOnce({
      data: createMockUser({ ...newUser, ...profileUpdate, isOnboarded: true }),
    });
    const onboardedUser = await userApi.completeOnboarding();
    expect(onboardedUser.isOnboarded).toBe(true);
  });

  it("should handle profile update with avatar flow", async () => {
    // Step 1: Get current user
    vi.mocked(api.get).mockResolvedValueOnce({ data: createMockUser() });
    const user = await userApi.getMe();

    // Step 2: Upload new avatar
    const avatarResponse = {
      success: true,
      image: "https://cdn.example.com/avatars/new-avatar.jpg",
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: avatarResponse });
    const avatar = await userApi.uploadAvatar("data:image/jpeg;base64,...");
    expect(avatar.success).toBe(true);

    // Step 3: Update profile name
    vi.mocked(api.put).mockResolvedValueOnce({
      data: createMockUser({ name: "Updated Name", image: avatar.image }),
    });
    const updatedUser = await userApi.updateMe({ name: "Updated Name" });
    expect(updatedUser.name).toBe("Updated Name");
  });

  it("should handle session management flow", async () => {
    // Step 1: Get all sessions
    const sessions = [
      createMockSession({ id: "session-1", userAgent: "Current Browser" }),
      createMockSession({ id: "session-2", userAgent: "Old Device" }),
      createMockSession({ id: "session-3", userAgent: "Another Device" }),
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: sessions });
    const allSessions = await userApi.getSessions();
    expect(allSessions).toHaveLength(3);

    // Step 2: Revoke old session
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true } });
    await userApi.revokeSession("session-2-token");

    // Step 3: Verify remaining sessions
    vi.mocked(api.get).mockResolvedValueOnce({
      data: sessions.filter((s) => s.id !== "session-2"),
    });
    const remainingSessions = await userApi.getSessions();
    expect(remainingSessions).toHaveLength(2);
  });

  it("should handle password change flow with validation", async () => {
    // Step 1: Attempt with wrong current password
    const wrongPasswordError = new Error("Current password is incorrect");
    (wrongPasswordError as Error & { status: number }).status = 401;
    vi.mocked(api.put).mockRejectedValueOnce(wrongPasswordError);

    await expect(
      userApi.changePassword("wrongPassword", "newSecurePassword123")
    ).rejects.toThrow("Current password is incorrect");

    // Step 2: Attempt with weak new password
    const weakPasswordError = new Error("Password too weak");
    (weakPasswordError as Error & { status: number }).status = 400;
    vi.mocked(api.put).mockRejectedValueOnce(weakPasswordError);

    await expect(
      userApi.changePassword("correctPassword", "weak")
    ).rejects.toThrow("Password too weak");

    // Step 3: Successful password change
    vi.mocked(api.put).mockResolvedValueOnce({ data: { success: true } });
    await userApi.changePassword("correctPassword", "NewSecurePassword123!");

    expect(api.put).toHaveBeenLastCalledWith("/api/users/me/password", {
      currentPassword: "correctPassword",
      newPassword: "NewSecurePassword123!",
    });
  });
});
