"use client";

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import Input from "@/components/Input"
import { axiosInstance } from "@/lib/axios-config"
import { useNavigate } from "@/lib/navigation";
import { useLayoutContext } from "@/lib/layout-context";
import Auth from "@/lib/Auth"
import { toast } from "react-toastify"

type FormValues = { old_password: string; new_password: string; password_confirmation: string }

export default function MyAccount() {
    const navigate = useNavigate()
    const { setIsLoader, setIsUserLoggedIn, isUserLoggedIn } = useLayoutContext<any>()
    const LoggedInUser = Auth.loggedInUser()
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({ mode: 'onChange' })
    const [activeTab, setActiveTab] = useState('personal')

    const changePasswordHandle = (data: FormValues) => {
        setIsLoader(true)
        axiosInstance.post('auth/pass-change', data).then((res: any) => {
            Auth.login(res, true)
            toast.success(res.message)
            reset()
            setIsLoader(false)
        }).catch(() => setIsLoader(false))
    }

    const logoutHandler = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            setIsLoader(true)
            axiosInstance.get(`auth/sign-out`).then(() => {
                Auth.logout()
                setIsLoader(false)
                setIsUserLoggedIn(false)
            }).catch(() => setIsLoader(false))
        }
    }

    useEffect(() => { if (!isUserLoggedIn) navigate('/login') }, [isUserLoggedIn, navigate])
    useEffect(() => { document.title = 'My Account | KNOWLEDGE CAPITA' }, [])

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="fs-4 fw-bold mb-0">My Account</h1>
            </div>
            <div className="row my-account g-4">
                <div className="col-lg-3">
                    <div className="nav flex-column nav-pills nav-pills-custom">
                        <button className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
                            <i className='bx bxs-user-account'></i>
                            <span>Personal Info</span>
                        </button>
                        <button className={`nav-link d-flex align-items-center gap-2 ${activeTab === 'changePassword' ? 'active' : ''}`} onClick={() => setActiveTab('changePassword')}>
                            <i className='bx bxs-lock'></i>
                            <span>Change Password</span>
                        </button>
                        <button className="nav-link d-flex align-items-center gap-2 text-danger" onClick={logoutHandler}>
                            <i className='bx bx-log-out'></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
                <div className="col-lg-9">
                    <div className="tab-content">
                        <div className={`tab-pane fade bg-white shadow-sm rounded ${activeTab === 'personal' ? 'show active' : ''}`}>
                            <h5 className="fw-semibold mb-3">Personal Information</h5>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label small text-muted">Name</label>
                                    <div className="form-control bg-light">{LoggedInUser?.name}</div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small text-muted">Email</label>
                                    <div className="form-control bg-light">{LoggedInUser?.email || '-'}</div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small text-muted">Phone</label>
                                    <div className="form-control bg-light">+91 {LoggedInUser?.phone_number}</div>
                                </div>
                            </div>
                        </div>
                        <div className={`tab-pane fade bg-white shadow-sm rounded ${activeTab === 'changePassword' ? 'show active' : ''}`}>
                            <h5 className="fw-semibold mb-3">Change Password</h5>
                            <form autoComplete="off" onSubmit={handleSubmit(changePasswordHandle)}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <Input id="old_password" required label="Current Password" type="password" placeholder="Enter current password" inputError={errors?.old_password?.message} {...register("old_password", { required: 'Required' })} />
                                    </div>
                                    <div className="col-md-6">
                                        <Input id="new_password" required label="New Password" type="password" placeholder="Enter new password" inputError={errors?.new_password?.message} {...register("new_password", { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
                                    </div>
                                    <div className="col-md-6">
                                        <Input id="password_confirmation" required label="Confirm Password" type="password" placeholder="Confirm new password" inputError={errors?.password_confirmation?.message} {...register("password_confirmation", { required: 'Required', validate: (val) => watch("new_password") !== val ? "Passwords don't match" : undefined })} />
                                    </div>
                                    <div className="col-12">
                                        <button type="submit" className="btn btn-primary">Update Password</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
