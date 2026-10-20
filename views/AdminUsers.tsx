"use client";

import { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Modal } from "react-bootstrap"
import { useForm } from "react-hook-form"
import { toast } from "react-toastify"
import { PaginationControl } from "react-bootstrap-pagination-control"
import 'react-quill-new/dist/quill.snow.css'
import Input from "@/components/Input"
import Auth from "@/lib/Auth"
import { axiosInstance } from "@/lib/axios-config"
import { useNavigate } from "@/lib/navigation"
import { useLayoutContext } from "@/lib/layout-context"
import { LayoutContext } from "@/lib/types"

// Quill touches `document` on import, so load it in the browser only.
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

const PAGE_SIZE = 20

type AdminUser = {
    id: string
    name: string
    email: string
    phone_number: string
    designation?: string
    industry?: string
    area_of_specialization?: string
    profile_visibility?: number
    role: "user" | "super_admin"
    created_at?: string
}

type EditForm = {
    name: string
    email: string
    phone_number: string
    designation: string
    industry: string
    area_of_specialization: string
    brief_bio: string
    role: "user" | "super_admin"
    profile_visibility: boolean
    password: string
}

/** Keeps a user's current (possibly legacy) value selectable even if it is no longer in the list. */
const withCurrent = (options: string[] = [], current?: string) =>
    current && !options.includes(current) ? [current, ...options] : options

export default function AdminUsersPage() {
    const navigate = useNavigate()
    const { setIsLoader, isUserLoggedIn, isSuperAdmin, contentData } = useLayoutContext<LayoutContext>()
    const currentUserId = Auth.loggedInUser()?.id
    const dropdowns = contentData?.dropdowns

    const [users, setUsers] = useState<AdminUser[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [appliedSearch, setAppliedSearch] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [editing, setEditing] = useState<(AdminUser & { brief_bio?: string }) | null>(null)

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, dirtyFields } } = useForm<EditForm>()

    const loadUsers = useCallback((p: number, q: string) => {
        setIsLoading(true)
        const params = new URLSearchParams({ page: String(p), size: String(PAGE_SIZE) })
        if (q) params.set("searching", q)
        axiosInstance.get(`admin/users?${params}`)
            .then((res: any) => { setUsers(res.data); setTotal(res.total) })
            .catch(() => setUsers([]))
            .finally(() => setIsLoading(false))
    }, [])

    useEffect(() => { document.title = 'Admin | KNOWLEDGE CAPITA' }, [])

    useEffect(() => {
        if (!isUserLoggedIn) { navigate('/login'); return }
        if (isSuperAdmin) loadUsers(page, appliedSearch)
    }, [isUserLoggedIn, isSuperAdmin, page, appliedSearch, loadUsers, navigate])

    const openEdit = (id: string) => {
        setIsLoader(true)
        axiosInstance.get(`admin/users/${id}`)
            .then((res: any) => {
                const u = res.data
                setEditing(u)
                reset({
                    name: u.name || "",
                    email: u.email || "",
                    phone_number: u.phone_number || "",
                    designation: u.designation || "",
                    industry: u.industry || "",
                    area_of_specialization: u.area_of_specialization || "",
                    brief_bio: u.brief_bio || "",
                    role: u.role || "user",
                    profile_visibility: u.profile_visibility !== 0,
                    password: "",
                })
            })
            .finally(() => setIsLoader(false))
    }

    const closeEdit = () => { setEditing(null); reset() }

    const saveEdit = (data: EditForm) => {
        if (!editing) return
        // Send only what changed, so untouched legacy values are never re-validated.
        const payload: Record<string, unknown> = {}
        for (const key of Object.keys(dirtyFields) as (keyof EditForm)[]) {
            if (key === "password" && !data.password) continue
            payload[key] = key === "profile_visibility" ? (data.profile_visibility ? 1 : 0) : data[key]
        }
        if (Object.keys(payload).length === 0) {
            toast.info("Nothing changed")
            return
        }
        setIsLoader(true)
        axiosInstance.put(`admin/users/${editing.id}`, payload)
            .then((res: any) => {
                toast.success(res.message)
                closeEdit()
                loadUsers(page, appliedSearch)
            })
            .finally(() => setIsLoader(false))
    }

    const deleteUser = (u: AdminUser) => {
        if (!window.confirm(`Delete ${u.name} (${u.email})?\n\nThis permanently removes the user and their calendar entries.`)) return
        setIsLoader(true)
        axiosInstance.delete(`admin/users/${u.id}`)
            .then((res: any) => {
                toast.success(res.message)
                const lastOnPage = users.length === 1 && page > 1
                if (lastOnPage) setPage(page - 1)
                else loadUsers(page, appliedSearch)
            })
            .finally(() => setIsLoader(false))
    }

    if (!isSuperAdmin) {
        return (
            <div className="container py-5 text-center">
                <h1 className="fs-4 fw-bold">Not authorized</h1>
                <p className="text-muted">Only super admins can manage users.</p>
            </div>
        )
    }

    return (
        <div className="container py-4">
            <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4">
                <h1 className="fs-4 fw-bold mb-0">Users <span className="text-muted fs-6 fw-normal">({total})</span></h1>
                <form className="d-flex gap-2" onSubmit={(e) => { e.preventDefault(); setPage(1); setAppliedSearch(search.trim()) }}>
                    <input
                        type="search"
                        className="form-control form-control-sm"
                        placeholder="Name, email or phone"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-sm">Search</button>
                </form>
            </div>

            <div className="bg-white rounded shadow-sm table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Designation</th>
                            <th>Visible</th>
                            <th>Role</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr><td colSpan={7} className="text-center py-4 text-muted">Loading…</td></tr>
                        )}
                        {!isLoading && users.length === 0 && (
                            <tr><td colSpan={7} className="text-center py-4 text-muted">No users found</td></tr>
                        )}
                        {!isLoading && users.map((u) => (
                            <tr key={u.id}>
                                <td className="fw-semibold">{u.name}</td>
                                <td>{u.email}</td>
                                <td>{u.phone_number}</td>
                                <td>{u.designation || <span className="text-muted">-</span>}</td>
                                <td>{u.profile_visibility === 0 ? 'No' : 'Yes'}</td>
                                <td>
                                    {u.role === 'super_admin'
                                        ? <span className="badge bg-danger">Super admin</span>
                                        : <span className="badge bg-secondary">User</span>}
                                </td>
                                <td className="text-end text-nowrap">
                                    <button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(u.id)}>Edit</button>
                                    {u.id !== currentUserId && (
                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(u)}>Delete</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {total > PAGE_SIZE && (
                <div className="pagination-wrapper mt-4 d-flex justify-content-center">
                    <PaginationControl
                        page={page}
                        between={4}
                        total={total}
                        limit={PAGE_SIZE}
                        changePage={(p) => setPage(p)}
                        ellipsis={1}
                    />
                </div>
            )}

            <Modal show={!!editing} size="lg" onHide={closeEdit}>
                <Modal.Header closeButton><Modal.Title>Edit user</Modal.Title></Modal.Header>
                <Modal.Body>
                    {editing && (
                        <form onSubmit={handleSubmit(saveEdit)}>
                            <div className="row">
                                <div className="col-md-6">
                                    <Input id="name" required label="Name" type="text" inputError={errors.name?.message} {...register("name", { required: 'Name is required' })} />
                                </div>
                                <div className="col-md-6">
                                    <Input id="email" required label="Email" type="email" inputError={errors.email?.message} {...register("email", { required: 'Email is required' })} />
                                </div>
                                <div className="col-md-6">
                                    <Input id="phone_number" required label="Phone number" type="text" inputError={errors.phone_number?.message} {...register("phone_number", { required: 'Phone number is required', pattern: { value: /^\+?\d{1,15}$/, message: 'Invalid phone number format' } })} />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="role" className="form-label small fw-semibold mb-1">Role</label>
                                    <select id="role" className="form-select" disabled={editing.id === currentUserId} {...register("role")}>
                                        <option value="user">User</option>
                                        <option value="super_admin">Super admin</option>
                                    </select>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label htmlFor="designation" className="form-label small fw-semibold mb-1">Designation</label>
                                    <select id="designation" className="form-select" {...register("designation")}>
                                        <option value="" disabled>Select designation</option>
                                        {withCurrent(dropdowns?.designation, editing.designation).map((d) => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label htmlFor="industry" className="form-label small fw-semibold mb-1">Industry</label>
                                    <select id="industry" className="form-select" {...register("industry")}>
                                        <option value="" disabled>Select industry</option>
                                        {withCurrent(dropdowns?.industry, editing.industry).map((d) => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label htmlFor="area_of_specialization" className="form-label small fw-semibold mb-1">Specialization</label>
                                    <select id="area_of_specialization" className="form-select" {...register("area_of_specialization")}>
                                        <option value="" disabled>Select specialization</option>
                                        {withCurrent(dropdowns?.area_of_specialization, editing.area_of_specialization).map((d) => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="col-12 mb-3">
                                    <label className="form-label small fw-semibold mb-1">Brief bio</label>
                                    <ReactQuill
                                        className="edit-class"
                                        theme="snow"
                                        value={watch("brief_bio")}
                                        onChange={(value, _delta, source) => {
                                            // Quill normalises HTML on load; only user edits count as changes.
                                            if (source === "user") setValue("brief_bio", value, { shouldDirty: true })
                                        }}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <Input id="password" label="New password (leave blank to keep)" type="password" autocomplete="new-password" inputError={errors.password?.message} {...register("password", { minLength: { value: 8, message: 'Password must be at least 8 characters' } })} />
                                </div>
                                <div className="col-md-6 d-flex align-items-center">
                                    <div className="form-check mt-2">
                                        <input id="profile_visibility" type="checkbox" className="form-check-input" {...register("profile_visibility")} />
                                        <label htmlFor="profile_visibility" className="form-check-label">Profile visible in directory</label>
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex justify-content-end gap-2 mt-3">
                                <button type="button" className="btn btn-outline-secondary" onClick={closeEdit}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save changes</button>
                            </div>
                        </form>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    )
}
