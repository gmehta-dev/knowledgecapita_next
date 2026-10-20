"use client";

import { useCallback, useEffect, useState } from "react"
import { Modal } from "react-bootstrap"
import { useForm } from "react-hook-form"
import Input from "@/components/Input"
import moment from "moment"
import { axiosInstance } from "@/lib/axios-config"
import { useNavigate } from "@/lib/navigation";
import { useLayoutContext } from "@/lib/layout-context";
import { toast } from "react-toastify"
import { convertDate } from "@/lib/helper"
import { LayoutContext } from "@/lib/types"

type CalenderForm = { city: string; time: string; from_date: moment.Moment; to_date: moment.Moment; interested_to_meet: string }

export default function CalenderPage() {
    const navigate = useNavigate()
    const { setIsLoader, isUserLoggedIn } = useLayoutContext<LayoutContext>()
    const [calenderListing, setCalenderListing] = useState<CalenderForm[]>()
    const [addModalShow, setAddModalShow] = useState(false)
    const { register, handleSubmit, reset, formState: { errors } } = useForm<CalenderForm>({ mode: 'onChange' })

    const addCalenderFormHandler = (data: CalenderForm) => {
        if (moment(data?.from_date)?.isAfter(data?.to_date)) {
            toast.error('From date must be before To date')
            return
        }
        setIsLoader(true)
        axiosInstance.post('calender', { ...data, time: data.time })
            .then((res: any) => {
                setIsLoader(false)
                toast.success(res.message)
                setAddModalShow(false)
                calenderListhandler()
                reset()
            }).catch(() => setIsLoader(false))
    }

    const calenderListhandler = useCallback(() => {
        setIsLoader(true)
        axiosInstance.get('calender')
            .then((response) => { setIsLoader(false); setCalenderListing(response.data.reverse()) })
            .catch(() => setIsLoader(false))
    }, [setIsLoader])

    useEffect(() => { if (isUserLoggedIn) calenderListhandler() }, [isUserLoggedIn, calenderListhandler])
    useEffect(() => { document.title = 'Calendar | KNOWLEDGE CAPITA' }, [isUserLoggedIn, navigate])

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="fs-4 fw-bold mb-0">Calendar</h1>
                {isUserLoggedIn && <button className="btn btn-primary btn-sm" onClick={() => setAddModalShow(true)}>+ Add Entry</button>}
            </div>
            <div className="bg-white rounded shadow-sm overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead><tr><th>#</th><th>City</th><th>From Date</th><th>To Date</th><th>Time</th><th>Interested to Meet</th></tr></thead>
                        <tbody>
                            {calenderListing?.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted">No entries found</td></tr>}
                            {calenderListing?.map((cl, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{cl.city}</td>
                                    <td>{convertDate(cl?.from_date, 'MMM DD, YYYY')}</td>
                                    <td>{convertDate(cl?.to_date, 'MMM DD, YYYY')}</td>
                                    <td>{cl.time || '-'}</td>
                                    <td>{cl.interested_to_meet}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal show={addModalShow} onHide={() => setAddModalShow(false)}>
                <Modal.Header closeButton><Modal.Title>Add Calendar Entry</Modal.Title></Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleSubmit(addCalenderFormHandler)}>
                        <div className="row g-3">
                            <div className="col-12"><Input id="city" required label="City" type="text" placeholder="Enter city" inputError={errors?.city?.message} {...register("city", { required: 'Required' })} /></div>
                            <div className="col-6"><Input id="from_date" required label="From Date" type="date" min={moment().format('YYYY-MM-DD')} inputError={errors?.from_date?.message} {...register("from_date", { required: 'Required' })} /></div>
                            <div className="col-6"><Input id="to_date" required label="To Date" type="date" min={moment().format('YYYY-MM-DD')} inputError={errors?.to_date?.message} {...register("to_date", { required: 'Required' })} /></div>
                            <div className="col-6"><Input id="time" required label="Time" type="text" placeholder="e.g., 10 AM - 5 PM" inputError={errors?.time?.message} {...register("time", { required: 'Required' })} /></div>
                            <div className="col-6"><Input id="interested_to_meet" required label="Interested to Meet" type="text" inputError={errors?.interested_to_meet?.message} {...register("interested_to_meet", { required: 'Required' })} /></div>
                            <div className="col-12"><button type="submit" className="btn btn-primary">Add Entry</button></div>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        </div>
    )
}
