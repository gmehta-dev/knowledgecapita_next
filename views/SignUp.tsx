"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import Input from "@/components/Input";
import { axiosInstance } from "@/lib/axios-config";
import Link from "next/link";
import { useNavigate } from "@/lib/navigation";
import { useLayoutContext } from "@/lib/layout-context";
import { toast } from "react-toastify";
import { useEffect } from "react";

type FormValues = { phone_number: string; name: string; email: string; password: string }

export default function SignUpPage() {
    const navigate = useNavigate()
    const { setIsLoader } = useLayoutContext<any>()
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ mode: 'onChange' })

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        setIsLoader(true)
        axiosInstance.post('auth/sign-up', data).then(() => {
            setIsLoader(false)
            toast.success('Account created successfully')
            navigate('/login')
            reset()
        }).catch(() => setIsLoader(false))
    }

    useEffect(() => { document.title = 'Sign Up | KNOWLEDGE CAPITA' }, [])

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <h1>Create Account</h1>
                    <p>Join KNOWLEDGE CAPITA</p>
                </div>
                <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                    <Input id="name" required label="Full Name" type="text" placeholder="Enter your name" inputError={errors?.name?.message} {...register("name", { required: 'Required' })} />
                    <Input id="phone_number" required label="Phone Number" type="text" placeholder="Enter phone number" inputError={errors?.phone_number?.message} {...register("phone_number", { required: 'Required', pattern: { value: /^\+?\d{1,15}$/, message: "Invalid phone number" } })} />
                    <Input id="email" required label="Email" type="text" placeholder="Enter email" inputError={errors?.email?.message} {...register("email", { required: 'Required', pattern: { value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, message: "Invalid email" } })} />
                    <Input id="password" required label="Password" type="password" placeholder="Create password" inputError={errors?.password?.message} {...register("password", { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
                    <button type="submit" className="btn btn-primary mt-2">Create Account</button>
                </form>
                <div className="auth-footer">
                    Already have an account? <Link href="/login">Sign In</Link>
                </div>
            </div>
        </div>
    )
}
