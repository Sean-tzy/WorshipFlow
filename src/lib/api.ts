import { API_URL } from "./utils";

type ApiResponse<T> = {
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

export async function api<T>(path: string, options: RequestInit = {}) {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Cannot reach the WorshipFlow API. Start the backend with `npm run api`, then try again.");
  }

  const payload = (await response.json().catch(() => ({
    message: response.statusText || "API request failed",
    data: null,
  }))) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(payload.message || "API request failed");
  }

  return payload;
}
