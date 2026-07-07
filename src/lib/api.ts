import { API_URL } from "./utils";

type ApiResponse<T> = {
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

export async function api<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(payload.message || "API request failed");
  }

  return payload;
}
