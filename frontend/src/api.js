const API = import.meta.env.VITE_API_URL || "https://reliancelab-api.onrender.com";
async function request(path, options = {}) {
  const response = await fetch(API + path, {
    headers: { "Content-Type": "application/json" }, ...options
  });
  if (!response.ok) {
    let message = "Request failed";
    try { message = (await response.json()).detail || message; } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}
export const api = {
  scenarios: () => request("/api/scenarios"),
  createSession: () => request("/api/sessions", { method: "POST", body: JSON.stringify({ consent: true }) }),
  decide: (id, payload) => request("/api/sessions/" + id + "/decisions", { method: "POST", body: JSON.stringify(payload) }),
  report: id => request("/api/sessions/" + id + "/report"),
  deleteSession: id => request("/api/sessions/" + id, { method: "DELETE" })
};
