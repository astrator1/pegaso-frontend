// Cliente que sustituye al SDK de Base44 (@base44/sdk).
// Habla con nuestro propio backend (Deno + MongoDB) en vez de con app.base44.com.
// Mantiene la misma forma (db.auth.*, db.entities.X.*) que usaban ya las páginas de la app,
// para no tener que tocar el resto del código.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TOKEN_KEY = "auth_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // sin cuerpo JSON
  }

  if (!res.ok) {
    const error = new Error(data?.message || `Error ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

const auth = {
  isAuthenticated: async () => {
    if (!getToken()) return false;
    try {
      await request("/api/auth/me");
      return true;
    } catch {
      return false;
    }
  },
  me: async () => request("/api/auth/me"),
  loginViaEmailPassword: async (email, password) => {
    const data = await request("/api/auth/login", { method: "POST", body: { email, password } });
    setToken(data.access_token);
    return data;
  },
  register: async ({ email, password, full_name }) => {
    const data = await request("/api/auth/register", { method: "POST", body: { email, password, full_name } });
    setToken(data.access_token);
    return data;
  },
  resetPasswordRequest: async (email) => request("/api/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: async ({ resetToken, newPassword }) =>
    request("/api/auth/reset-password", { method: "POST", body: { resetToken, newPassword } }),
  changePassword: async (currentPassword, newPassword) =>
    request("/api/auth/change-password", { method: "POST", body: { currentPassword, newPassword } }),
  logout: (redirectTo) => {
    setToken(null);
    if (redirectTo) window.location.href = "/login";
  },
  setToken,
};

function entityClient(name) {
  return {
    list: async (sort, limit) => {
      const params = new URLSearchParams();
      if (sort) params.set("sort", sort);
      if (limit) params.set("limit", String(limit));
      const qs = params.toString();
      return request(`/api/entities/${name}${qs ? `?${qs}` : ""}`);
    },
    filter: async (query, sort, limit) =>
      request(`/api/entities/${name}/filter`, { method: "POST", body: { query, sort, limit } }),
    get: async (id) => request(`/api/entities/${name}/${id}`),
    create: async (data) => request(`/api/entities/${name}`, { method: "POST", body: data }),
    update: async (id, data) => request(`/api/entities/${name}/${id}`, { method: "PUT", body: data }),
    delete: async (id) => request(`/api/entities/${name}/${id}`, { method: "DELETE" }),
    bulkCreate: async (items) => request(`/api/entities/${name}/bulk-create`, { method: "POST", body: items }),
    bulkUpdate: async (items) => request(`/api/entities/${name}/bulk-update`, { method: "POST", body: items }),
  };
}

const ENTITY_NAMES = [
  "Aeronave",
  "Bateria",
  "BateriaMantenimiento",
  "Mantenimiento",
  "Material",
  "Mision",
  "Modificaciones",
  "Piloto",
  "PlanVuelo",
  "Vuelo",
];

const entities = Object.fromEntries(ENTITY_NAMES.map((name) => [name, entityClient(name)]));

const admin = {
  listUsers: async () => request("/api/admin/users"),
  approveUser: async (id) => request(`/api/admin/users/${id}/approve`, { method: "POST" }),
  resetPassword: async (id, newPassword) =>
    request(`/api/admin/users/${id}/reset-password`, { method: "POST", body: { newPassword } }),
  setRole: async (id, role) => request(`/api/admin/users/${id}/role`, { method: "POST", body: { role } }),
  deleteUser: async (id) => request(`/api/admin/users/${id}`, { method: "DELETE" }),
};

const planVuelo = {
  decidir: async (id, estado, comentario) =>
    request(`/api/planes-vuelo/${id}/decidir`, { method: "POST", body: { estado, comentario } }),
};

const vueloRevision = {
  decidir: async (id, estado, comentario) =>
    request(`/api/vuelos/${id}/decidir`, { method: "POST", body: { estado, comentario } }),
};

const db = { auth, entities, admin, planVuelo, vueloRevision };
export { db, auth, entities, admin, planVuelo, vueloRevision };
export default db;
