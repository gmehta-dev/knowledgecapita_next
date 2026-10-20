"use client";

import { useForm } from "react-hook-form";
import Input from "@/components/Input";
import React, { useEffect, useState } from "react";
import { useLayoutContext } from "@/lib/layout-context";
import dynamic from "next/dynamic";
import 'react-quill-new/dist/quill.snow.css';
import { axiosInstance } from "@/lib/axios-config";
import { toast } from "react-toastify";
import { getFileIcon, mediaUrl, mediaUrlBioFile } from "@/lib/helper";
import { LayoutContext } from "@/lib/types";

// Quill touches `document` on import, so load it in the browser only.
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface FormValues {
    name: string
    designation: string
    area_of_specialization: string
    industry: string
    experience: string
    calendar: string
    scheduling_assistance: string
    brief_bio: string
    detailed_bio: string
    profile_image: string
    profile_img_upload: FileList
    detailed_bio_upload: FileList
    name_visibility: number
    profile_visibility: number
    brief_bio_visibility: number
    experience_visibility: number
    calender_visibility: number
    scheduling_visibility: number
    detailed_bio_visibility: number
}

interface UploadResponse {
    image: string
    message: string
}

export default function RegisterPage() {
    const { setIsLoader, isUserLoggedIn, contentData } = useLayoutContext<LayoutContext>()

    const [imagePreview, setImagePreview] = useState<string>()
    const [bioFilePreview, setBioFilePreview] = useState<string>()
    const dropdownList = contentData?.dropdowns

    const { register, handleSubmit, setValue, watch, getValues, formState: { errors } } = useForm<FormValues>({
        mode: 'onChange',
        defaultValues: {
            designation: '',
            area_of_specialization: '',
            industry: '',
            name_visibility: 1,
            profile_visibility: 1,
            brief_bio_visibility: 1,
            experience_visibility: 1,
            calender_visibility: 0,
            scheduling_visibility: 1,
            detailed_bio_visibility: 1
        }
    })

    const checkboxHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target
        const value: number = checked ? 1 : 0
        setValue(name as keyof FormValues, value)
    }

    const FileUploadhandler = async (file: File, uploadKeyName: string): Promise<UploadResponse | void> => {
        const formData = new FormData()
        formData.append('type', uploadKeyName)
        formData.append('file', file)

        return axiosInstance.post<UploadResponse>('upload-image', formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }).then((res) => res as unknown as UploadResponse)
          .catch(() => { setIsLoader(false) })
    }

    const getProfileHandler = () => {
        setIsLoader(true);
        axiosInstance.get('user/profile').then((response) => {
            setIsLoader(false);
            if (response?.data?.profile_image) {
                setImagePreview(mediaUrl + response?.data?.profile_image)
            }
            // setProfileById(response?.data)

            setValue('name', response?.data?.name)
            setValue('designation', response?.data?.designation || '')
            setValue('area_of_specialization', response?.data?.area_of_specialization || '')
            setValue('industry', response?.data?.industry || '')
            setValue('brief_bio', response?.data?.brief_bio)
            setValue('experience', response?.data?.experience)

            setValue('scheduling_assistance', response?.data?.scheduling_assistance)

            setValue('calender_visibility', +response?.data?.calender_visibility)
            setValue('detailed_bio', response?.data?.detailed_bio)
            setBioFilePreview(response?.data?.detailed_bio)
            setValue('profile_image', response?.data?.profile_image)

            setValue('name_visibility', 1)
            setValue('profile_visibility', 1)
            setValue('brief_bio_visibility', 1)
            setValue('experience_visibility', 1)
            setValue('scheduling_visibility', 1)
            setValue('detailed_bio_visibility', 1)

        }).catch(() => {
            setIsLoader(false);
        })
    }

    const formSubmitHandler = async (data: FormValues) => {
        let bodyData: Partial<FormValues> & { detailed_bio?: string; profile_image?: string } = { ...data }
        setIsLoader(true)
        if (data.detailed_bio_upload.length > 0) {
            const imgRes = await FileUploadhandler(getValues('detailed_bio_upload')[0], 'bioFile')
            if (imgRes) {
                bodyData = { ...bodyData, detailed_bio: imgRes.image }
            }
        }

        if (data.profile_img_upload.length > 0) {
            const imgRes = await FileUploadhandler(getValues('profile_img_upload')[0], 'profile')
            if (imgRes) {
                bodyData = { ...bodyData, profile_image: imgRes.image }
            }
        }
        delete bodyData.detailed_bio_upload;
        delete bodyData.profile_img_upload;

        axiosInstance.post<{ message: string }>('user/profile', bodyData).then((res) => {
            setIsLoader(false);
            toast.success((res as unknown as { message: string }).message)
        }).catch(() => {
            setIsLoader(false);
        });
    }

    useEffect(() => {

        if (getValues('profile_img_upload')?.length > 0) {
            if (getValues('profile_img_upload')[0].size > 2000000) {
                toast.error('The file size should not be more than 2MB.')
                setValue('profile_img_upload', undefined!)
                return
            }

            const selectedFile = getValues('profile_img_upload')
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile[0]);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watch('profile_img_upload')])

    useEffect(() => {

        if (getValues('detailed_bio_upload')?.length > 0) {
            if (getValues('detailed_bio_upload')[0].size > 5000000) {
                toast.error('The file size should not be more than 5MB.')
                setValue('detailed_bio_upload', undefined!)
                return
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watch('detailed_bio_upload')])

    useEffect(() => {

        if (isUserLoggedIn) {
            getProfileHandler()
        }

        // eslint-disable-next-line
    }, [isUserLoggedIn])

    useEffect(() => {
        register('brief_bio', { required: true });
        register('experience');
    }, [register])

    useEffect(() => {
        document.title = 'Register | KNOWLEDGE CAPITA';
    }, []);

    return (
        <div className="register-page">
            <div className="container py-4">
                {/* Page Header */}
                <div className="text-center mb-4">
                    <h1 className="register-title">Complete Your Profile</h1>
                    <p className="register-subtitle">Share your expertise with the Knowledge Capita community</p>
                </div>

                <form onSubmit={handleSubmit(formSubmitHandler)}>
                    <div className="row justify-content-center">
                        <div className="col-lg-10 col-xl-8">

                            {/* Profile Image Section */}
                            <div className="register-card mb-4">
                                <div className="register-card-header">
                                    <i className='bx bx-user-circle'></i>
                                    <span>Profile Photo</span>
                                </div>
                                <div className="register-card-body text-center">
                                    <input
                                        id="profileImage"
                                        className="d-none"
                                        type="file"
                                        accept=".jpg, .png, .jpeg"
                                        {...register("profile_img_upload")}
                                    />
                                    <label htmlFor="profileImage" className="profile-upload-wrapper">
                                        <div className="profile-upload-circle">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Profile" className="profile-preview-img" />
                                            ) : (
                                                <div className="profile-upload-placeholder">
                                                    <i className='bx bxs-camera'></i>
                                                </div>
                                            )}
                                            <div className="profile-upload-overlay">
                                                <i className='bx bx-upload'></i>
                                            </div>
                                        </div>
                                        <span className="profile-upload-text">
                                            {imagePreview ? 'Change Photo' : 'Upload Photo'}
                                        </span>
                                        <span className="profile-upload-hint">JPG, PNG (max 2MB)</span>
                                    </label>
                                    {errors.profile_img_upload && (
                                        <div className="text-danger small mt-2">{errors.profile_img_upload.message}</div>
                                    )}
                                </div>
                            </div>

                            {/* Basic Information */}
                            <div className="register-card mb-4">
                                <div className="register-card-header">
                                    <i className='bx bx-info-circle'></i>
                                    <span>Basic Information</span>
                                </div>
                                <div className="register-card-body">
                                    <div className="row">
                                        <div className="col-12">
                                            <Input
                                                id="name"
                                                required={true}
                                                label="Full Name"
                                                type="text"
                                                placeholder="Enter your full name"
                                                autocomplete="off"
                                                inputError={errors.name?.message}
                                                {...register("name", {
                                                    required: "Name is required.",
                                                })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label className="form-label small fw-semibold mb-1">
                                                    Designation<span className="text-danger ms-1">*</span>
                                                </label>
                                                <select
                                                    className={`form-select ${errors.designation ? 'is-invalid' : ''}`}
                                                    {...register("designation", {
                                                        required: "Designation is required.",
                                                    })}
                                                >
                                                    <option value="" disabled>Select designation</option>
                                                    {dropdownList?.designation.map((di: string, index: number) => (
                                                        <option key={index + 'designation'} value={di}>{di}</option>
                                                    ))}
                                                </select>
                                                {errors.designation && (
                                                    <div className="invalid-feedback">{errors.designation.message}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label className="form-label small fw-semibold mb-1">
                                                    Industry<span className="text-danger ms-1">*</span>
                                                </label>
                                                <select
                                                    className={`form-select ${errors.industry ? 'is-invalid' : ''}`}
                                                    {...register("industry", {
                                                        required: "Industry is required.",
                                                    })}
                                                >
                                                    <option value="" disabled>Select industry</option>
                                                    {dropdownList?.industry.map((di: string, index: number) => (
                                                        <option key={index + 'ind'} value={di}>{di}</option>
                                                    ))}
                                                </select>
                                                {errors.industry && (
                                                    <div className="invalid-feedback">{errors.industry.message}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="form-group">
                                                <label className="form-label small fw-semibold mb-1">
                                                    Area of Specialization<span className="text-danger ms-1">*</span>
                                                </label>
                                                <select
                                                    className={`form-select ${errors.area_of_specialization ? 'is-invalid' : ''}`}
                                                    {...register("area_of_specialization", {
                                                        required: "Area of specialization is required.",
                                                    })}
                                                >
                                                    <option value="" disabled>Select specialization</option>
                                                    {dropdownList?.area_of_specialization.map((di: string, index: number) => (
                                                        <option key={index + 'aaos'} value={di}>{di}</option>
                                                    ))}
                                                </select>
                                                {errors.area_of_specialization && (
                                                    <div className="invalid-feedback">{errors.area_of_specialization.message}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Professional Bio */}
                            <div className="register-card mb-4">
                                <div className="register-card-header">
                                    <i className='bx bx-edit'></i>
                                    <span>Professional Bio</span>
                                </div>
                                <div className="register-card-body">
                                    <div className="form-group mb-4">
                                        <label className="form-label small fw-semibold mb-1">
                                            Brief Bio<span className="text-danger ms-1">*</span>
                                        </label>
                                        <p className="text-muted small mb-2">Write a short introduction about yourself</p>
                                        <ReactQuill
                                            // Same HTML as the legacy react-quill (root.innerHTML); avoids Quill 2.0.3 getSemanticHTML XSS.
                                            useSemanticHTML={false}
                                            className="edit-class"
                                            theme="snow"
                                            value={getValues('brief_bio')}
                                            onChange={(event) => setValue("brief_bio", event)}
                                        />
                                        {errors.brief_bio && (
                                            <div className="text-danger small mt-2">Brief Bio is required.</div>
                                        )}
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="form-label small fw-semibold mb-1">Experience</label>
                                        <p className="text-muted small mb-2">Describe your professional experience</p>
                                        <ReactQuill
                                            // Same HTML as the legacy react-quill (root.innerHTML); avoids Quill 2.0.3 getSemanticHTML XSS.
                                            useSemanticHTML={false}
                                            className="edit-class"
                                            theme="snow"
                                            value={getValues('experience')}
                                            onChange={(data) => setValue("experience", data)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label small fw-semibold mb-1">Detailed Bio (Document)</label>
                                        <p className="text-muted small mb-2">Upload a detailed resume or CV</p>
                                        <div className="file-upload-area">
                                            <input
                                                type="file"
                                                id="detailed_bio_upload"
                                                className="file-upload-input"
                                                accept=".pdf, .doc, .docx"
                                                {...register("detailed_bio_upload")}
                                            />
                                            <label htmlFor="detailed_bio_upload" className="file-upload-label">
                                                <i className='bx bx-cloud-upload'></i>
                                                <span>Choose file or drag here</span>
                                                <span className="file-hint">PDF, DOC, DOCX (max 5MB)</span>
                                            </label>
                                        </div>
                                        {errors.detailed_bio_upload && (
                                            <div className="text-danger small mt-2">{errors.detailed_bio_upload.message}</div>
                                        )}
                                        {bioFilePreview && (
                                            <div className="uploaded-file-preview mt-3">
                                                <button
                                                    onClick={() => window.open(mediaUrlBioFile + bioFilePreview, '_blank')}
                                                    type="button"
                                                    className="btn btn-outline-primary btn-sm"
                                                >
                                                    <img
                                                        style={{ width: '24px', marginRight: '8px' }}
                                                        src={getFileIcon(bioFilePreview!)}
                                                        alt=""
                                                    />
                                                    View Uploaded File
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Scheduling Settings */}
                            <div className="register-card mb-4">
                                <div className="register-card-header">
                                    <i className='bx bx-calendar'></i>
                                    <span>Scheduling Settings</span>
                                </div>
                                <div className="register-card-body">
                                    <div className="calendar-toggle-section mb-4">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <label className="form-label small fw-semibold mb-0">Enable Calendar</label>
                                                <p className="text-muted small mb-0">Allow others to see your availability</p>
                                            </div>
                                            <div className="form-check form-switch">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="calender_visibility"
                                                    checked={watch('calender_visibility') === 1}
                                                    onChange={(event) => checkboxHandler(event)}
                                                    name="calender_visibility"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Input
                                        id="scheduling_assistance"
                                        label="Scheduling Assistant"
                                        type="text"
                                        placeholder="Name & contact of your scheduling assistant"
                                        autocomplete="off"
                                        maxLength={100}
                                        inputError={errors.scheduling_assistance?.message}
                                        {...register("scheduling_assistance")}
                                    />
                                </div>
                            </div>

                            {/* Submit Section */}
                            <div className="register-submit-section">
                                <button type="submit" className="btn btn-primary btn-lg w-100">
                                    <i className='bx bx-check-circle me-2'></i>
                                    Save Profile
                                </button>
                                <p className="text-muted small text-center mt-3">
                                    Your information will be visible to other community members
                                </p>
                            </div>

                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}