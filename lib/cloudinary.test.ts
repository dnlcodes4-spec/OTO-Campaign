import { beforeEach, expect, test, vi } from "vitest";

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    utils: { api_sign_request: vi.fn(() => "test-signature") },
  },
}));

import { buildPosterUrl, signUpload } from "./cloudinary";

beforeEach(() => {
  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "test-key";
  process.env.CLOUDINARY_API_SECRET = "test-secret";
});

test("buildPosterUrl builds a poster frame URL from a public id", () => {
  expect(buildPosterUrl("oto-gallery/my-video")).toBe(
    "https://res.cloudinary.com/test-cloud/video/upload/so_0,w_800,c_fill,q_auto,f_jpg/oto-gallery/my-video.jpg"
  );
});

test("signUpload returns a signature, timestamp, folder, cloud name, and api key", () => {
  const result = signUpload("oto-gallery");
  expect(result.folder).toBe("oto-gallery");
  expect(result.signature).toBe("test-signature");
  expect(result.cloudName).toBe("test-cloud");
  expect(result.apiKey).toBe("test-key");
  expect(typeof result.timestamp).toBe("number");
});
