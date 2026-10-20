"use client";

import { useEffect, useState } from "react"
import { Modal } from "react-bootstrap"
import { useForm } from "react-hook-form"
import Input from "@/components/Input"
import { axiosInstance } from "@/lib/axios-config"
import { useNavigate } from "@/lib/navigation";
import { useLayoutContext } from "@/lib/layout-context";
import { toast } from "react-toastify"
import Auth from "@/lib/Auth"
import { LayoutContext } from "@/lib/types"

type ActivitiesForm = { id: number; name: string; description: string }

const SkeletonRow = () => (
    <li className="list-group-item d-flex justify-content-between align-items-center">
        <span className="skeleton-line" style={{ width: '40%' }}></span>
        <span className="d-flex gap-2">
            <span className="skeleton-line" style={{ width: 50 }}></span>
            <span className="skeleton-line" style={{ width: 60 }}></span>
        </span>
    </li>
)

export default function ActivitiesPage() {
    const isUserLoggedIn = Auth?.loggedInUser()
    const navigate = useNavigate()
    const { setIsLoader, authData: authList } = useLayoutContext<LayoutContext>()
    const [activitiesListing, setActivitiesListing] = useState<ActivitiesForm[]>()
    const [isLoading, setIsLoading] = useState(true)
    const [addModalShow, setAddModalShow] = useState(false)
    const [isEditing, setIsEditing] = useState<ActivitiesForm>()
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ActivitiesForm>({ mode: 'onChange' })

    const addActivitiesFormHandler = (data: ActivitiesForm) => {
        setIsLoader(true)
        const apiUrl = isEditing ? `activities/${isEditing.id}` : 'activities'
        const axiosCall = isEditing ? axiosInstance.put : axiosInstance.post
        axiosCall(apiUrl, data)
            .then((res: any) => {
                reset()
                setIsEditing(undefined)
                setAddModalShow(false)
                setIsLoader(false)
                toast.success(res.message)
                activitiesListhandler()
            }).catch(() => setIsLoader(false))
    }

    const handleDelete = (id: number) => {
        if (window.confirm("Delete this activity?")) {
            axiosInstance.delete('activities/' + id)
                .then((res: any) => { toast.success(res.message); activitiesListhandler() })
                .catch(() => setIsLoader(false))
        }
    }

    const activitiesListhandler = () => {
        setIsLoading(true)
        axiosInstance.get('activities')
            .then((response: any) => { setIsLoading(false); setActivitiesListing(response.data) })
            .catch(() => { setIsLoading(false); setActivitiesListing([]) })
    }

    useEffect(() => {
        register('description')
        if (isUserLoggedIn) {
            activitiesListhandler()
        } else {
            setIsLoading(false)
            setActivitiesListing([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => { document.title = 'Activities | KNOWLEDGE CAPITA' }, [isUserLoggedIn, navigate])

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="fs-4 fw-bold mb-0">Activities</h1>
                {isUserLoggedIn?.email && authList?.emailId.includes(isUserLoggedIn.email) && (
                    <button className="btn btn-primary btn-sm" onClick={() => setAddModalShow(true)}>+ Add Activity</button>
                )}
            </div>
            <div className="bg-white rounded shadow-sm">
                {!isLoading && activitiesListing?.length === 0 && (
                    <div className="text-center py-5 text-muted">No activities found</div>
                )}
                <ul className="list-group list-group-flush">
                    {isLoading && [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
                    {!isLoading && activitiesListing?.map((al, index) => (
                        <li className="list-group-item d-flex justify-content-between align-items-center" key={index}>
                            <span>{al.name}</span>
                            {isUserLoggedIn?.email && authList?.emailId.includes(isUserLoggedIn.email) && (
                                <span className="d-flex gap-2">
                                    <button type="button" onClick={() => { setAddModalShow(true); setIsEditing(al); setValue('name', al.name) }} className="btn btn-sm btn-outline-primary">Edit</button>
                                    <button onClick={() => handleDelete(al?.id)} type="button" className="btn btn-sm btn-outline-danger">Delete</button>
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <style>{`
                .skeleton-line {
                    display: inline-block;
                    height: 14px;
                    border-radius: 4px;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
            <Modal show={addModalShow} onHide={() => { reset(); setIsEditing(undefined); setAddModalShow(false) }}>
                <Modal.Header closeButton><Modal.Title>{isEditing ? 'Edit' : 'Add'} Activity</Modal.Title></Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleSubmit(addActivitiesFormHandler)}>
                        <Input id="name" required label="Activity Name" type="text" placeholder="Enter activity name" inputError={errors?.name?.message} {...register("name", { required: 'Required' })} />
                        <button type="submit" className="btn btn-primary mt-3">{isEditing ? 'Update' : 'Add'}</button>
                    </form>
                </Modal.Body>
            </Modal>
        </div>
    )
}
