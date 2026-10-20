"use client";

import { useEffect, useState, useCallback } from "react"
import { axiosInstance } from "@/lib/axios-config"
import { useNavigate } from "@/lib/navigation";
import { convertDate, getFileIcon, mediaUrl, mediaUrlBioFile, replaceLogo } from "@/lib/helper"

type udType = { name: string; industry: string; email?: string; designation: string; profile_image: string; calender: string; brief_bio: string; experience: string; detailed_bio: string; scheduling_assistance: string; area_of_specialization: string; calender_visibility: string; user_calender: any[] }
type CalenderForm = { city: string; time: string; from_date: string; to_date: string; interested_to_meet: string }

const sortCalendar = (data: udType): udType => ({
    ...data,
    user_calender: [...(data.user_calender || [])].sort((a: CalenderForm, b: CalenderForm) => new Date(b.from_date).getTime() - new Date(a.from_date).getTime())
})

/**
 * Profile page. Rendered on the server with `initialData` from /profile/[slug];
 * falls back to fetching `dashboard/:pid` in the browser when no data is given.
 */
export default function ProfileDetail({ pid, initialData }: { pid: string; initialData?: udType }) {
    const navigate = useNavigate()
    const [userDetail, setUserDetail] = useState<udType | undefined>(initialData ? sortCalendar(initialData) : undefined)
    const [activeTab, setActiveTab] = useState("briefBio")
    const [isLoading, setIsLoading] = useState(!initialData)

    const userGetByIdHandler = useCallback(() => {
        setIsLoading(true)
        axiosInstance.get(`dashboard/${pid}`).then((response) => {
            setUserDetail(sortCalendar(response.data))
            setIsLoading(false)
        }).catch(() => setIsLoading(false))
    }, [pid])

    useEffect(() => {
        if (!initialData) userGetByIdHandler()
        window.scrollTo(0, 0)
    }, [initialData, userGetByIdHandler])


    const tabs = [
        { id: 'briefBio', label: 'Brief Bio', icon: '📋' },
        { id: 'experience', label: 'Experience', icon: '💼' },
        { id: 'detailedBio', label: 'Documents', icon: '📄' },
        { id: 'availability', label: 'Availability', icon: '📅' }
    ]

    return (
        <div className="profile-detail-page">
            {/* Hero Banner */}
            <div className="profile-hero">
                <div
                    className="hero-bg"
                    style={{ backgroundImage: `url(${mediaUrl + userDetail?.profile_image})` }}
                />
                <div className="hero-overlay" />
                <div className="container">
                    <button onClick={() => navigate(-1)} className="back-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back
                    </button>
                </div>
            </div>

            <div className="container profile-content">
                <div className="row g-4">
                    {/* Left Column - Profile Card */}
                    <div className="col-lg-4">
                        <div className="profile-card">
                            <div className="profile-image-wrapper">
                                <div
                                    className="profile-image-blur"
                                    style={{ backgroundImage: `url(${mediaUrl + userDetail?.profile_image})` }}
                                />
                                {isLoading ? (
                                    <div className="profile-image skeleton" />
                                ) : (
                                    <img
                                        className="profile-image"
                                        src={`${mediaUrl + userDetail?.profile_image}`}
                                        onError={replaceLogo}
                                        alt={userDetail?.name}
                                    />
                                )}
                            </div>

                            <div className="profile-info">
                                {isLoading ? (
                                    <>
                                        <div className="skeleton skeleton-title mx-auto" />
                                        <div className="skeleton skeleton-text mx-auto" />
                                        <div className="skeleton skeleton-text short mx-auto" />
                                    </>
                                ) : (
                                    <>
                                        <h1 className="profile-name">{userDetail?.name}</h1>
                                        <span className="profile-badge">{userDetail?.designation}</span>
                                    </>
                                )}
                            </div>

                            {/* Quick Info */}
                            <div className="quick-info">
                                <div className="info-item">
                                    <div className="info-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                        </svg>
                                    </div>
                                    <div className="info-content">
                                        <span className="info-label">Industry</span>
                                        <span className="info-value">{userDetail?.industry || '-'}</span>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="M12 6v6l4 2"/>
                                        </svg>
                                    </div>
                                    <div className="info-content">
                                        <span className="info-label">Specialization</span>
                                        <span className="info-value">{userDetail?.area_of_specialization || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scheduling Assistance Card */}
                        {userDetail?.scheduling_assistance && (
                            <div className="assistance-card">
                                <div className="assistance-header">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                    <span>Scheduling Assistance</span>
                                </div>
                                <p className="assistance-email">{userDetail.scheduling_assistance}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Content */}
                    <div className="col-lg-8">
                        {/* Tab Navigation */}
                        <div className="tabs-wrapper">
                            <div className="tabs-nav">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                    >
                                        <span className="tab-icon">{tab.icon}</span>
                                        <span className="tab-label">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="tab-content-wrapper">
                            {isLoading && (
                                <div className="tab-loading">
                                    <div className="skeleton skeleton-line" />
                                    <div className="skeleton skeleton-line" />
                                    <div className="skeleton skeleton-line short" />
                                </div>
                            )}

                            {/* Brief Bio */}
                            {!isLoading && activeTab === 'briefBio' && (
                                <div className="tab-content fade-in">
                                    <div className="content-header">
                                        <h2>About {userDetail?.name?.split(' ')[0]}</h2>
                                        <p>Professional background and expertise</p>
                                    </div>
                                    {userDetail?.brief_bio ? (
                                        <div
                                            className="bio-content"
                                            dangerouslySetInnerHTML={{ __html: userDetail.brief_bio }}
                                        />
                                    ) : (
                                        <div className="empty-state">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                                <polyline points="14 2 14 8 20 8"/>
                                                <line x1="16" y1="13" x2="8" y2="13"/>
                                                <line x1="16" y1="17" x2="8" y2="17"/>
                                                <polyline points="10 9 9 9 8 9"/>
                                            </svg>
                                            <h3>No Bio Available</h3>
                                            <p>This profile doesn&apos;t have a brief bio yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Experience */}
                            {!isLoading && activeTab === 'experience' && (
                                <div className="tab-content fade-in">
                                    <div className="content-header">
                                        <h2>Professional Experience</h2>
                                        <p>Career history and achievements</p>
                                    </div>
                                    {userDetail?.experience ? (
                                        <div
                                            className="bio-content"
                                            dangerouslySetInnerHTML={{ __html: userDetail.experience }}
                                        />
                                    ) : (
                                        <div className="empty-state">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                                            </svg>
                                            <h3>No Experience Listed</h3>
                                            <p>Experience details haven&apos;t been added yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Documents */}
                            {!isLoading && activeTab === 'detailedBio' && (
                                <div className="tab-content fade-in">
                                    <div className="content-header">
                                        <h2>Documents & Resources</h2>
                                        <p>Detailed biography and additional materials</p>
                                    </div>
                                    {userDetail?.detailed_bio ? (
                                        <div className="document-card">
                                            <div className="document-icon">
                                                <img src={getFileIcon(userDetail.detailed_bio)} alt="Document" />
                                            </div>
                                            <div className="document-info">
                                                <h4>Detailed Biography</h4>
                                                <p>Click to view the complete biography document</p>
                                            </div>
                                            <button
                                                onClick={() => window.open(mediaUrlBioFile + userDetail.detailed_bio, '_blank')}
                                                className="document-btn"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                                    <polyline points="15 3 21 3 21 9"/>
                                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                                </svg>
                                                Open
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                                                <polyline points="13 2 13 9 20 9"/>
                                            </svg>
                                            <h3>No Documents</h3>
                                            <p>No documents have been uploaded yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Availability */}
                            {!isLoading && activeTab === 'availability' && (
                                <div className="tab-content fade-in">
                                    <div className="content-header">
                                        <h2>Availability Schedule</h2>
                                        <p>Upcoming availability for meetings and consultations</p>
                                    </div>
                                    {userDetail?.user_calender && userDetail.user_calender.length > 0 ? (
                                        <div className="schedule-list">
                                            {userDetail.user_calender.map((cl, i) => {
                                                const isPast = new Date(cl.to_date) < new Date()
                                                return (
                                                    <div key={i} className={`schedule-item ${isPast ? 'past' : ''}`}>
                                                        <div className="schedule-date">
                                                            <span className="date-month">{convertDate(cl.from_date, 'MMM')}</span>
                                                            <span className="date-day">{convertDate(cl.from_date, 'DD')}</span>
                                                        </div>
                                                        <div className="schedule-info">
                                                            <div className="schedule-city">
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                                    <circle cx="12" cy="10" r="3"/>
                                                                </svg>
                                                                {cl.city}
                                                            </div>
                                                            <div className="schedule-meta">
                                                                <span>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <circle cx="12" cy="12" r="10"/>
                                                                        <polyline points="12 6 12 12 16 14"/>
                                                                    </svg>
                                                                    {cl.time}
                                                                </span>
                                                                <span>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                                                    </svg>
                                                                    {convertDate(cl.from_date, 'MMM DD')} - {convertDate(cl.to_date, 'MMM DD')}
                                                                </span>
                                                            </div>
                                                            {cl.interested_to_meet && (
                                                                <div className="schedule-interest">
                                                                    <strong>Interested to meet:</strong> {cl.interested_to_meet}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isPast && <span className="past-badge">Past</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                <line x1="16" y1="2" x2="16" y2="6"/>
                                                <line x1="8" y1="2" x2="8" y2="6"/>
                                                <line x1="3" y1="10" x2="21" y2="10"/>
                                            </svg>
                                            <h3>No Availability</h3>
                                            <p>No schedule has been set yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .profile-detail-page {
                    background: var(--bg-body);
                    min-height: 100vh;
                }

                /* Hero Banner */
                .profile-hero {
                    position: relative;
                    height: 200px;
                    overflow: hidden;
                }

                .hero-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-size: cover;
                    background-position: center;
                    filter: blur(30px);
                    transform: scale(1.2);
                }

                .hero-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(30, 58, 95, 0.9) 0%, rgba(30, 58, 95, 0.7) 100%);
                }

                .back-btn {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    margin-top: 20px;
                    background: rgba(255,255,255,0.15);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    backdrop-filter: blur(10px);
                }

                .back-btn:hover {
                    background: rgba(255,255,255,0.25);
                }

                /* Profile Content */
                .profile-content {
                    margin-top: -100px;
                    position: relative;
                    z-index: 10;
                    padding-bottom: 40px;
                }

                /* Left Column - Sticky on Desktop */
                .profile-content .col-lg-4 {
                    position: sticky;
                    top: 80px;
                    height: fit-content;
                    align-self: flex-start;
                }

                /* Profile Card */
                .profile-card {
                    background: white;
                    border-radius: 16px;
                    box-shadow: var(--shadow-lg);
                    overflow: hidden;
                }

                .profile-image-wrapper {
                    position: relative;
                    height: 280px;
                    overflow: hidden;
                    background: var(--bg-muted);
                }

                .profile-image-blur {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-size: cover;
                    background-position: center;
                    filter: blur(20px);
                    transform: scale(1.3);
                    opacity: 0.5;
                }

                .profile-image {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    z-index: 1;
                }

                .profile-info {
                    padding: 20px;
                    text-align: center;
                    border-bottom: 1px solid var(--border);
                }

                .profile-name {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-dark);
                    margin-bottom: 8px;
                }

                .profile-badge {
                    display: inline-block;
                    padding: 6px 16px;
                    background: var(--accent);
                    color: white;
                    font-size: 0.8rem;
                    font-weight: 600;
                    border-radius: 20px;
                }

                /* Quick Info */
                .quick-info {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border);
                }

                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 0;
                }

                .info-item:not(:last-child) {
                    border-bottom: 1px solid var(--border);
                }

                .info-icon {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-muted);
                    border-radius: 10px;
                    color: var(--primary);
                }

                .info-content {
                    flex: 1;
                }

                .info-label {
                    display: block;
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .info-value {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--text-dark);
                }

                /* Assistance Card */
                .assistance-card {
                    background: white;
                    border-radius: 12px;
                    padding: 16px;
                    margin-top: 16px;
                    box-shadow: var(--shadow-sm);
                }

                .assistance-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 600;
                    color: var(--text-dark);
                    margin-bottom: 8px;
                }

                .assistance-header svg {
                    color: var(--accent);
                }

                .assistance-email {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                    margin: 0;
                    word-break: break-all;
                }

                /* Tabs */
                .tabs-wrapper {
                    background: white;
                    border-radius: 12px;
                    padding: 6px;
                    box-shadow: var(--shadow-sm);
                    margin-bottom: 16px;
                }

                .tabs-nav {
                    display: flex;
                    gap: 4px;
                }

                .tab-btn {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    padding: 12px 8px;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tab-btn:hover {
                    background: var(--bg-muted);
                }

                .tab-btn.active {
                    background: var(--primary);
                    color: white;
                }

                .tab-icon {
                    font-size: 1.25rem;
                }

                .tab-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                /* Tab Content */
                .tab-content-wrapper {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: var(--shadow-sm);
                    min-height: 400px;
                }

                .tab-content.fade-in {
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .content-header {
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 2px solid var(--bg-muted);
                }

                .content-header h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-dark);
                    margin-bottom: 4px;
                }

                .content-header p {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                    margin: 0;
                }

                .bio-content {
                    font-size: 0.9rem;
                    line-height: 1.8;
                    color: var(--text-body);
                }

                .bio-content p {
                    margin-bottom: 1rem;
                }

                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                }

                .empty-state svg {
                    color: var(--text-light);
                    margin-bottom: 16px;
                }

                .empty-state h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-dark);
                    margin-bottom: 8px;
                }

                .empty-state p {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                    margin: 0;
                }

                /* Document Card */
                .document-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px;
                    background: var(--bg-muted);
                    border-radius: 12px;
                    border: 1px solid var(--border);
                }

                .document-icon img {
                    width: 48px;
                    height: 48px;
                }

                .document-info {
                    flex: 1;
                }

                .document-info h4 {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-dark);
                    margin-bottom: 4px;
                }

                .document-info p {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin: 0;
                }

                .document-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: var(--accent);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .document-btn:hover {
                    background: var(--accent-dark);
                    transform: translateY(-2px);
                }

                /* Schedule List */
                .schedule-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .schedule-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 16px;
                    background: var(--bg-muted);
                    border-radius: 12px;
                    border: 1px solid var(--border);
                    position: relative;
                    transition: all 0.2s;
                }

                .schedule-item:hover {
                    border-color: var(--primary);
                    box-shadow: var(--shadow-sm);
                }

                .schedule-item.past {
                    opacity: 0.6;
                }

                .schedule-date {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 50px;
                    padding: 10px;
                    background: var(--primary);
                    border-radius: 10px;
                    color: white;
                }

                .date-month {
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .date-day {
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                .schedule-info {
                    flex: 1;
                }

                .schedule-city {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-dark);
                    margin-bottom: 8px;
                }

                .schedule-city svg {
                    color: var(--accent);
                }

                .schedule-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }

                .schedule-meta span {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .schedule-interest {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px dashed var(--border);
                    font-size: 0.8rem;
                    color: var(--text-body);
                }

                .past-badge {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    padding: 4px 10px;
                    background: var(--text-light);
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 600;
                    border-radius: 4px;
                }

                /* Skeleton */
                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 8px;
                }

                .skeleton-title {
                    height: 28px;
                    width: 60%;
                    margin-bottom: 12px;
                }

                .skeleton-text {
                    height: 20px;
                    width: 40%;
                    margin-bottom: 8px;
                }

                .skeleton-text.short {
                    width: 30%;
                }

                .skeleton-line {
                    height: 16px;
                    width: 100%;
                    margin-bottom: 12px;
                }

                .skeleton-line.short {
                    width: 60%;
                }

                .tab-loading {
                    padding: 20px 0;
                }

                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                /* Responsive */
                @media (max-width: 991.98px) {
                    .profile-hero {
                        height: 150px;
                    }

                    .profile-content {
                        margin-top: -60px;
                    }

                    .profile-content .col-lg-4 {
                        position: relative;
                        top: auto;
                    }

                    .profile-image-wrapper {
                        height: 220px;
                    }

                    .tab-btn {
                        padding: 10px 6px;
                    }

                    .tab-label {
                        font-size: 0.65rem;
                    }
                }

                @media (max-width: 767.98px) {
                    .profile-hero {
                        height: 120px;
                    }

                    .profile-content {
                        margin-top: -40px;
                    }

                    .tab-content-wrapper {
                        padding: 16px;
                        min-height: 300px;
                    }

                    .document-card {
                        flex-direction: column;
                        text-align: center;
                    }

                    .schedule-item {
                        flex-direction: column;
                    }

                    .schedule-date {
                        flex-direction: row;
                        gap: 8px;
                        width: 100%;
                        justify-content: center;
                    }

                    .schedule-meta {
                        flex-direction: column;
                        gap: 8px;
                    }
                }
            `}</style>
        </div>
    )
}
