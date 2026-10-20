"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import Input from "@/components/Input";
import { axiosInstance } from "@/lib/axios-config";
import Link from "next/link";
import { useNavigate } from "@/lib/navigation";
import { useLayoutContext } from "@/lib/layout-context";
import { toast } from "react-toastify";
import { useEffect } from "react";

type FormValues = { email: string }

export default function ForgotPassword() {
    const navigate = useNavigate()
    const { setIsLoader } = useLayoutContext<any>()
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ mode: 'onChange' })

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        setIsLoader(true)
        axiosInstance.post('auth/pass-reset', data).then(() => {
            setIsLoader(false)
            toast.success('Reset link sent to your email')
            navigate('/login')
            reset()
        }).catch(() => setIsLoader(false))
    }

    useEffect(() => { document.title = 'Forgot Password | KNOWLEDGE CAPITA' }, [])

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h1>Reset Password</h1>
                    <p>Enter your email to receive reset link</p>
                </div>
                <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                    <Input id="email" required label="Email Address" type="text" placeholder="Enter your email" inputError={errors?.email?.message} {...register("email", { required: 'Required', pattern: { value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, message: "Invalid email" } })} />
                    <button type="submit" className="btn btn-primary mt-2">Send Reset Link</button>
                </form>
                <div className="auth-footer">
                    Remember password? <Link href="/login">Sign In</Link>
                </div>
            </div>
        </div>
    )
}
