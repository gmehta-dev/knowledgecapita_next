"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import Input from "@/components/Input";
import { axiosInstance } from "@/lib/axios-config";
import Link from "next/link";
import { useNavigate } from "@/lib/navigation";
import { useLayoutContext } from "@/lib/layout-context";
import { toast } from "react-toastify";

type FormValues = { password: string, password_confirmation: string }

export default function ResetPassword({ token }: { token: string }) {
    const navigate = useNavigate()
    const { setIsLoader } = useLayoutContext<any>()
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({ mode: 'onChange' })
    const validLink = /^[a-f0-9]{64}$/i.test(token)

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        setIsLoader(true)
        axiosInstance.post('auth/pass-reset/confirm', { ...data, token }).then((res: any) => {
            setIsLoader(false)
            toast.success(res.message)
            reset()
            navigate('/login')
        }).catch(() => setIsLoader(false))
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h1>Set New Password</h1>
                    <p>{validLink ? 'Choose a new password for your account' : 'This reset link is invalid or incomplete'}</p>
                </div>
                {validLink ? (
                    <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                        <Input id="password" required label="New Password" type="password" placeholder="Enter new password" inputError={errors?.password?.message} {...register("password", { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
                        <Input id="password_confirmation" required label="Confirm Password" type="password" placeholder="Confirm new password" inputError={errors?.password_confirmation?.message} {...register("password_confirmation", { required: 'Required', validate: (val) => watch("password") !== val ? "Passwords don't match" : undefined })} />
                        <button type="submit" className="btn btn-primary mt-2">Set New Password</button>
                    </form>
                ) : (
                    <Link href="/forgot-password" className="btn btn-primary mt-2">Request a new link</Link>
                )}
                <div className="auth-footer">
                    Remember password? <Link href="/login">Sign In</Link>
                </div>
            </div>
        </div>
    )
}
