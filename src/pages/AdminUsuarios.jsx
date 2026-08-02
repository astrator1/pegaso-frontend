import db from "@/api/base44Client";

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check, Trash2, Loader2, ShieldAlert, KeyRound } from "lucide-react";

const ROLE_LABEL = { superadmin: "Superusuario", admin: "Admin", user: "User" };

export default function AdminUsuarios() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const isAdminLevel = user && (user.role === "admin" || user.role === "superadmin");
  const isSuperadmin = user && user.role === "superadmin";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await db.admin.listUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || "No se pudo cargar la lista de usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Solo un admin o el superusuario pueden ver esta pantalla.
  if (user && !isAdminLevel) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">No tienes permiso para ver esta página.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await db.admin.approveUser(id);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo aprobar el usuario");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta cuenta? No se puede deshacer.")) return;
    setBusyId(id);
    try {
      await db.admin.deleteUser(id);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el usuario");
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (id, email) => {
    const newPassword = window.prompt(`Nueva contraseña para ${email} (mínimo 8 caracteres):`);
    if (!newPassword) return;
    setBusyId(id);
    try {
      await db.admin.resetPassword(id, newPassword);
      window.alert("Contraseña actualizada.");
    } catch (err) {
      setError(err.message || "No se pudo cambiar la contraseña");
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeRole = async (id, role) => {
    setBusyId(id);
    try {
      await db.admin.setRole(id, role);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo cambiar el rol");
    } finally {
      setBusyId(null);
    }
  };

  const pendientes = users.filter((u) => !u.approved);
  const aprobados = users.filter((u) => u.approved);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Usuarios</h1>
        <p className="text-slate-500 mb-8">Aprueba las cuentas nuevas antes de que puedan entrar a la app.</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">
                Pendientes de aprobación {pendientes.length > 0 && <Badge variant="secondary">{pendientes.length}</Badge>}
              </h2>
              {pendientes.length === 0 ? (
                <p className="text-sm text-slate-400">No hay cuentas pendientes.</p>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Registrado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendientes.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.full_name || "-"}</TableCell>
                          <TableCell>{u.unidad || "-"}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell className="text-slate-500">
                            {u.created_date ? new Date(u.created_date).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" disabled={busyId === u.id} onClick={() => handleApprove(u.id)}>
                              <Check className="w-4 h-4 mr-1" /> Aprobar
                            </Button>
                            <Button size="sm" variant="outline" disabled={busyId === u.id} onClick={() => handleDelete(u.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Usuarios aprobados</h2>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aprobados.map((u) => {
                      const isSelf = u.id === user?.id;
                      const isTargetSuperadmin = u.role === "superadmin";
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.full_name || "-"}</TableCell>
                          <TableCell>{u.unidad || "-"}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            {isSuperadmin && !isSelf && !isTargetSuperadmin ? (
                              <Select value={u.role} onValueChange={(role) => handleChangeRole(u.id, role)} disabled={busyId === u.id}>
                                <SelectTrigger className="h-8 w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={u.role === "user" ? "secondary" : "default"}>
                                {ROLE_LABEL[u.role] || u.role}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {!isSelf && !isTargetSuperadmin && (
                              <Button size="sm" variant="outline" disabled={busyId === u.id} onClick={() => handleResetPassword(u.id, u.email)}>
                                <KeyRound className="w-4 h-4" />
                              </Button>
                            )}
                            {!isSelf && !isTargetSuperadmin && (
                              <Button size="sm" variant="outline" disabled={busyId === u.id} onClick={() => handleDelete(u.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {!isSuperadmin && (
                <p className="text-xs text-slate-400 mt-3">
                  Solo el superusuario puede cambiar el rol de otras cuentas.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
