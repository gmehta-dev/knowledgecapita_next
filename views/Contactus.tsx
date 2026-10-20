"use client";

import { useForm } from "react-hook-form"
import { useLayoutContext } from "@/lib/layout-context";
import Input from "@/components/Input"
import { axiosInstance } from "@/lib/axios-config"
import { toast } from "react-toastify"
import { useEffect } from "react"

type contactForm = { name: string; email: string; contact_no: string; query: string }

export default function ContactUsPage() {
    const { setIsLoader } = useLayoutContext<any>()
    const { register, handleSubmit, reset, formState: { errors } } = useForm<contactForm>({ mode: 'onChange' })

    const contactFormSubmit = (data: contactForm) => {
        setIsLoader(true)
        axiosInstance.post('contact', data).then((res: any) => {
            setIsLoader(false)
            toast.success(res.message)
            reset()
        }).catch(() => setIsLoader(false))
    }

    useEffect(() => { document.title = 'Contact us | KNOWLEDGE CAPITA' }, [])

    return (
        <div className="container py-4">
            <div className="text-center mb-4">
                <h1 className="fs-4 fw-bold">Contact Us</h1>
                <p className="text-muted small">Have questions? We'd love to hear from you.</p>
            </div>
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="bg-white rounded shadow-sm p-4">
                        <form onSubmit={handleSubmit(contactFormSubmit)}>
                            <div className="row g-3">
                                <div className="col-12">
                                    <Input id="name" required label="Name" type="text" placeholder="Your name" inputError={errors?.name?.message} {...register("name", { required: 'Required' })} />
                                </div>
                                <div className="col-md-6">
                                    <Input id="email" required label="Email" type="text" placeholder="Your email" inputError={errors?.email?.message} {...register("email", { required: 'Required', pattern: { value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, message: "Invalid email" } })} />
                                </div>
                                <div className="col-md-6">
                                    <Input id="contact_no" required label="Phone" type="text" placeholder="Your phone" inputError={errors?.contact_no?.message} {...register("contact_no", { required: 'Required', pattern: { value: /^[0-9]{10}$/, message: "Must be 10 digits" } })} />
                                </div>
                                <div className="col-12">
                                    <label className="form-label small fw-semibold">Message <span className="text-danger">*</span></label>
                                    <textarea className="form-control" rows={4} placeholder="Your message..." {...register('query', { required: 'Required' })}></textarea>
                                    {errors?.query && <span className="text-danger small">{errors.query.message}</span>}
                                </div>
                                <div className="col-12">
                                    <button type="submit" className="btn btn-primary">Send Message</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
