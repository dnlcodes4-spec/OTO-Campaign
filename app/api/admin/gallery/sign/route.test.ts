import { beforeEach, expect, test, vi } from "vitest";

const authorizeAdminRequestMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  authorizeAdminRequest: (request: Request) => authorizeAdminRequestMock(request),
}));

const signUploadMock = vi.fn();
vi.mock("@/lib/cloudinary", () => ({
  signUpload: (folder: string) => signUploadMock(folder),
}));

import { GET } from "./route";

beforeEach(() => {
  authorizeAdminRequestMock.mockReset();
  signUploadMock.mockReset();
});

test("rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await GET(new Request("http://localhost/api/admin/gallery/sign"));
  expect(response.status).toBe(401);
  expect(signUploadMock).not.toHaveBeenCalled();
});

test("signs an upload for the oto-gallery folder", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  signUploadMock.mockReturnValue({
    signature: "sig",
    timestamp: 123,
    folder: "oto-gallery",
    cloudName: "test-cloud",
    apiKey: "test-key",
  });
  const response = await GET(new Request("http://localhost/api/admin/gallery/sign"));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).toEqual({
    signature: "sig",
    timestamp: 123,
    folder: "oto-gallery",
    cloudName: "test-cloud",
    apiKey: "test-key",
  });
  expect(signUploadMock).toHaveBeenCalledWith("oto-gallery");
});
