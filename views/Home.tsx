"use client";

import React, { useCallback, useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios-config"
import { useNavigate } from "@/lib/navigation";
import { useLayoutContext } from "@/lib/layout-context";
import { mediaUrl, replaceLogo } from "@/lib/helper";
import Auth from "@/lib/Auth";
import { PaginationControl } from "react-bootstrap-pagination-control";
import { LayoutContext } from "@/lib/types";

type uList = {
    id: string | number
    name: string,
    area_of_specialization: string
    designation: string
    industry: string,
    profile_image: string
}

type Tdata = {
    "industry": string[],
    "designation": string[],
    "area_of_specialization": string[],
    "emailId": string[]
}

// Modern skeleton card component
const SkeletonCard = () => (
    <div className="card skeleton-card">
        <div className="skeleton-image"></div>
        <div className="card-body">
            <div className="skeleton-title"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text short"></div>
            <div className="skeleton-button"></div>
        </div>
        <style>{`
            .skeleton-card {
                overflow: hidden;
            }
            .skeleton-image {
                height: 180px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }
            .skeleton-title {
                height: 1.25rem;
                width: 70%;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 4px;
                margin-bottom: 0.75rem;
            }
            .skeleton-text {
                height: 0.875rem;
                width: 100%;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 4px;
                margin-bottom: 0.5rem;
            }
            .skeleton-text.short {
                width: 60%;
            }
            .skeleton-button {
                height: 2rem;
                width: 100px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 8px;
                margin-top: 1rem;
            }
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            @media (max-width: 991.98px) {
                .skeleton-image { height: 160px; }
            }
            @media (max-width: 767.98px) {
                .skeleton-image { height: 140px; }
            }
            @media (max-width: 575.98px) {
                .skeleton-image { height: 120px; }
            }
        `}</style>
    </div>
);

const skeletonLoop = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export default function HomePage() {
    const { contentData, authData } = useLayoutContext<LayoutContext>()

    const loggedInUser = Auth.loggedInUser();
    const navigate = useNavigate()
    const [userList, setUserList] = useState<uList[]>();
    const [searchText, setSearchText] = useState<string>();
    const [page, setPage] = useState<number>(1);
    const [total, setTotal] = useState<number>(1);

    const [filterD, setFilterD] = useState<string>('');
    const [filterI, setFilterI] = useState<string>('');
    const [filterAS, setFilterAS] = useState<string>('');

    const [islistLoading, setIsListLoading] = useState<boolean>(false)

    const dropdownList = contentData?.dropdowns as Tdata | undefined;
    const authList = authData as Tdata | undefined;

    const userListHandler = useCallback((p = page) => {
        setIsListLoading(true);
        let apiUrl = `dashboard?size=${12}&page=${p}`

        if (filterI) {
            apiUrl = apiUrl + `&industry=${filterI}`
        }

        if (filterD) {
            apiUrl = apiUrl + `&designation=${filterD}`
        }
        if (filterAS) {
            apiUrl = apiUrl + `&area_of_specialization=${filterAS}`
        }

        if (searchText) {
            apiUrl = apiUrl + `&searching=${searchText}`
        }
        axiosInstance.get(apiUrl).then((response: any) => {
            setTotal(response.total)
            setUserList(response.data);
            setTimeout(() => {
                setIsListLoading(false);
            }, 800)
        }).catch((err: any) => {
            setIsListLoading(false);
        })
    }, [page, filterI, filterD, filterAS, searchText])

    useEffect(() => {
        if (authList) {
            if (!loggedInUser?.email || !authList.emailId.includes(loggedInUser.email)) {
                setFilterD('PhD Scholar')
            } else {
                userListHandler()
            }
        }
    }, [authList, loggedInUser?.email, userListHandler]);

    useEffect(() => {
        if (filterI || filterD || filterAS) {
            userListHandler()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterI, filterD, filterAS])

    useEffect(() => {
        document.title = "Home | KNOWLEDGE CAPITA";
    }, []);

    // Handle search on Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            userListHandler()
        }
    }

    return (
        <>
            {/* Filter Section */}
            <section className="filter-section">
                <div className="container-fluid bg-primary">
                    <div className="filter-container">
                        <div className="filter-grid">
                            <div className="filter-item">
                                <label className="filter-label">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                    Industry
                                </label>
                                <select
                                    onChange={(event) => setFilterI(event.target.value)}
                                    disabled={islistLoading}
                                    defaultValue=''
                                    name="industry"
                                    className="filter-select"
                                >
                                    <option value=''>All Industries</option>
                                    {dropdownList?.industry.map((di: string, index: any) =>
                                        <option key={index + 'ind'} value={di}>{di}</option>
                                    )}
                                </select>
                            </div>
                            <div className="filter-item">
                                <label className="filter-label">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Designation
                                </label>
                                <select
                                    disabled={islistLoading}
                                    onChange={(event) => setFilterD(event.target.value)}
                                    value={filterD}
                                    name="designation"
                                    className="filter-select"
                                >
                                    <option value=''>All Designations</option>
                                    {dropdownList?.designation.map((di: string, index: number) => {
                                        const isVisible = authList?.designation.includes(di) ||
                                            (loggedInUser?.email && authList?.emailId.includes(loggedInUser.email))
                                        return isVisible ? (
                                            <option key={index + 'designation'} value={di}>{di}</option>
                                        ) : null
                                    })}
                                </select>
                            </div>
                            <div className="filter-item">
                                <label className="filter-label">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 6v6l4 2" />
                                    </svg>
                                    Specialization
                                </label>
                                <select
                                    disabled={islistLoading}
                                    onChange={(event) => setFilterAS(event.target.value)}
                                    defaultValue=''
                                    name="area_of_specialization"
                                    className="filter-select"
                                >
                                    <option value=''>All Specializations</option>
                                    {dropdownList?.area_of_specialization.map((di: string, index: any) =>
                                        <option key={index + 'area_of_specialization'} value={di}>{di}</option>
                                    )}
                                </select>
                            </div>
                            <div className="filter-item search-item">
                                <label className="filter-label">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                    </svg>
                                    Search
                                </label>
                                <div className="search-wrapper">
                                    <input
                                        disabled={islistLoading}
                                        onChange={(event) => setSearchText(event.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="filter-input"
                                        type="text"
                                        placeholder="Search by name..."
                                    />
                                    <button
                                        onClick={() => userListHandler()}
                                        className="search-btn"
                                        disabled={islistLoading}
                                        aria-label="Search"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <path d="m21 21-4.35-4.35"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Results Section */}
            <section className="album py-4">
                <div className="container-fluid">
                    <div className="row g-3">
                        {/* No Results */}
                        {(!islistLoading && userList?.length === 0) &&
                            <div className="col-12">
                                <div className="no-results text-center py-5">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-muted">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                    <h3 className="text-muted">No Results Found</h3>
                                    <p className="text-secondary">Try adjusting your filters or search terms</p>
                                </div>
                            </div>
                        }

                        {/* User Cards */}
                        {!islistLoading && userList?.map((ul: uList, index: number) =>
                            <div className="col-6 col-md-4 col-lg-3 col-xl-2" key={index + 'ul'}>
                                <div className="card h-100" title={ul.name}>
                                    <div className="card-img-wrapper">
                                        <div
                                            className="card-img-blur-bg"
                                            style={{ backgroundImage: `url(${mediaUrl + ul.profile_image})` }}
                                        />
                                        <img
                                            className="card-img-top"
                                            loading="lazy"
                                            onError={replaceLogo}
                                            src={`${mediaUrl + ul.profile_image}`}
                                            alt={ul.name}
                                        />
                                    </div>
                                    <div className="card-body d-flex flex-column">
                                        <h5 className="card-title text-truncate mb-1">
                                            {ul.name}
                                        </h5>
                                        <p className="card-text text-secondary small mb-2 flex-grow-1">
                                            {ul.designation}
                                            <br className="d-none d-md-block" />
                                            <span className="d-md-none">, </span>
                                            {ul.area_of_specialization}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/profile-detail?pid=${ul.id}`)}
                                            className="btn btn-sm bg-danger text-white w-100"
                                        >
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Skeleton Loaders */}
                        {islistLoading && skeletonLoop.map((sl, i) =>
                            <div className="col-6 col-md-4 col-lg-3 col-xl-2" key={sl + i + 'sl'}>
                                <SkeletonCard />
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {!islistLoading && userList && userList.length > 0 && (
                        <div className="pagination-wrapper mt-4 d-flex justify-content-center">
                            <PaginationControl
                                page={page}
                                between={4}
                                total={total}
                                limit={12}
                                changePage={(page) => {
                                    setPage(page)
                                    userListHandler(page)
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                ellipsis={1}
                            />
                        </div>
                    )}
                </div>
            </section>

            <style>{`
                .filter-section {
                    position: relative;
                }

                .filter-container {
                    padding: 16px 0;
                }

                .filter-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                }

                .filter-item {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .filter-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .filter-label svg {
                    opacity: 0.8;
                }

                .filter-select,
                .filter-input {
                    width: 100%;
                    padding: 10px 14px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.95);
                    font-size: 0.875rem;
                    color: var(--text-dark);
                    transition: all 0.2s ease;
                    appearance: none;
                }

                .filter-select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23334155' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    padding-right: 40px;
                    cursor: pointer;
                }

                .filter-select:focus,
                .filter-input:focus {
                    outline: none;
                    border-color: var(--accent);
                    box-shadow: 0 0 0 3px rgba(159, 0, 0, 0.2);
                }

                .filter-select:disabled,
                .filter-input:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .search-wrapper {
                    position: relative;
                }

                .search-item .filter-input {
                    padding-right: 50px;
                }

                .search-btn {
                    position: absolute;
                    right: 6px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: var(--accent);
                    border: none;
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .search-btn:hover:not(:disabled) {
                    background: var(--accent-dark);
                }

                .search-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                /* Tablet - 2 columns */
                @media (max-width: 991.98px) {
                    .filter-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                    }
                }

                /* Mobile - 1 column */
                @media (max-width: 575.98px) {
                    .filter-container {
                        padding: 12px 0;
                    }

                    .filter-grid {
                        grid-template-columns: 1fr;
                        gap: 10px;
                    }

                    .filter-label {
                        font-size: 0.7rem;
                    }

                    .filter-select,
                    .filter-input {
                        padding: 8px 12px;
                        font-size: 0.8rem;
                    }

                    .filter-select {
                        padding-right: 36px;
                        background-position: right 10px center;
                    }

                    .search-btn {
                        padding: 6px 10px;
                    }

                    .search-btn svg {
                        width: 16px;
                        height: 16px;
                    }
                }

                .card-img-wrapper {
                    position: relative;
                    overflow: hidden;
                    height: 180px;
                    background: #f1f5f9;
                }

                .card-img-blur-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-size: cover;
                    background-position: center;
                    filter: blur(15px);
                    transform: scale(1.2);
                    opacity: 0.7;
                }

                .card-img-wrapper img {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    z-index: 1;
                    transition: transform 0.3s ease;
                }

                .card:hover .card-img-wrapper img {
                    transform: scale(1.05);
                }

                .no-results {
                    background: white;
                    border-radius: 16px;
                    padding: 3rem;
                }

                .no-results svg {
                    opacity: 0.5;
                }

                .pagination-wrapper {
                    padding: 1rem 0;
                }

                @media (max-width: 991.98px) {
                    .card-img-wrapper {
                        height: 160px;
                    }
                }

                @media (max-width: 767.98px) {
                    .card-img-wrapper {
                        height: 140px;
                    }
                }

                @media (max-width: 575.98px) {
                    .card-img-wrapper {
                        height: 120px;
                    }

                    .card-img-blur-bg {
                        filter: blur(10px);
                    }

                    .card-body .btn {
                        font-size: 0.75rem;
                        padding: 0.4rem 0.5rem;
                    }
                }
            `}</style>
        </>
    )
}
