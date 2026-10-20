"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import Input from "@/components/Input";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios-config";
import Link from "next/link";
import { useNavigate } from "@/lib/navigation";
import { useLayoutContext } from "@/lib/layout-context";
import Auth from "@/lib/Auth";

type FormValues = { emailOrphone: string; password: string }

export default function LoginPage() {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const { setIsLoader, isUserLoggedIn, setIsUserLoggedIn } = useLayoutContext<any>()
    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ mode: 'onChange' })

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        setIsLoader(true)
        axiosInstance.post('auth/sign-in', data).then((res: any) => {
            setIsUserLoggedIn(true)
            Auth.login(res, true)
            setIsLoader(false)
            navigate('/myaccount')
        }).catch(() => setIsLoader(false))
    }

    useEffect(() => { if (isUserLoggedIn) navigate('/myaccount') }, [isUserLoggedIn, navigate])
    useEffect(() => { document.title = 'Login | KNOWLEDGE CAPITA' }, [])

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to continue</p>
                </div>
                <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                    <Input id="emailOrphone" required label="Email or Phone" type="text" placeholder="Enter email or phone" inputError={errors?.emailOrphone?.message} {...register("emailOrphone", { required: 'Required' })} />
                    <div className="position-relative">
                        <Input id="password" required label="Password" type={showPassword ? "text" : "password"} placeholder="Enter password" inputError={errors?.password?.message} {...register("password", { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: 38, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                    <div className="d-flex justify-content-end mb-3">
                        <Link href="/forgot-password" style={{ fontSize: '0.8125rem', color: '#64748b' }}>Forgot Password?</Link>
                    </div>
                    <button type="submit" className="btn btn-primary">Sign In</button>
                </form>
                <div className="auth-footer">
                    Don&apos;t have an account? <Link href="/sign-up">Sign Up</Link>
                </div>
            </div>
        </div>
    )
}
