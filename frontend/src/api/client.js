const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not configured");
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof data === "object" && data?.detail
      ? Array.isArray(data.detail)
        ? data.detail.map((item) => item.msg).join(", ")
        : data.detail
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function apiRequest(path, { token, headers, ...options } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...options,
  });

  return parseResponse(response);
}

export function registerUser(payload) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser({ email, password }) {
  const formData = new URLSearchParams();
  formData.set("username", email);
  formData.set("password", password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  return parseResponse(response);
}

export function createTransactions(token, transactions) {
  return apiRequest("/transactions", {
    method: "POST",
    token,
    body: JSON.stringify({ transactions }),
  });
}

export function getMonthlyInsights(token) {
  return apiRequest("/insights/monthly", { token });
}

export function getAnomalies(token) {
  return apiRequest("/insights/anomalies", { token });
}
