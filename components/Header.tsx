"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header(props: any) {
    const { isUserLoggedIn } = props
    const pathname = usePathname()
    const [mobileView, setMobileview] = useState<boolean>(false)
    const [isScrolled, setIsScrolled] = useState<boolean>(false)

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileview(false)
    }, [pathname])

    // Add scroll effect for header
    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 20
            setIsScrolled(prev => prev !== scrolled ? scrolled : prev)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const linkClasses = 'nav-link text-center text-uppercase px-3 mx-2 rounded-2 text-white fw-bold'

    return (
        <header className={`sticky-top ${isScrolled ? 'header-scrolled' : ''}`}>
            <div className="container-fluid bg-white">
                <nav className="navbar navbar-expand-lg">
                    <div className="container-fluid px-0">
                        <Link href="/" className="navbar-brand d-flex align-items-end gap-2">
                            <img className="logo" src="/assets/images/logo.png" alt="Knowledge Capita Logo" />
                            <span className="fs-6 text-dark-emphasis fontme d-none d-sm-block">
                                Amplifying <strong className="text-danger fw-bolder border border-3 px-1 border-start-0 border-end-0">KNOWLEDGE CAPITA</strong> of the World
                            </span>
                            <span className="fontme d-block d-sm-none">
                                <strong className="text-danger">KNOWLEDGE CAPITA</strong>
                            </span>
                        </Link>

                        <button
                            onClick={() => setMobileview(!mobileView)}
                            className={`navbar-toggler ${mobileView ? 'active' : ''}`}
                            type="button"
                            aria-controls="navbarNavAltMarkup"
                            aria-expanded={mobileView}
                            aria-label="Toggle navigation"
                        >
                            <span className="toggler-icon">
                                <span></span>
                                <span></span>
                                <span></span>
                            </span>
                        </button>

                        <div
                            className={`collapse navbar-collapse mega-menu ${mobileView ? 'show mobile-view' : ''}`}
                            id="navbarNavAltMarkup"
                        >
                            <div className="navbar-nav ms-auto">
                                <Link
                                    href="/about-us"
                                    className={`${linkClasses} ${pathname === '/about-us' ? 'active' : ''}`}
                                >
                                    About us
                                </Link>
                                <Link
                                    href={isUserLoggedIn ? '/register' : '/login'}
                                    className={`${linkClasses} ${pathname === '/register' ? 'active' : ''}`}
                                >
                                    Register
                                </Link>
                                {isUserLoggedIn &&
                                    <Link
                                        href="/calender"
                                        className={`${linkClasses} ${pathname === '/calender' ? 'active' : ''}`}
                                    >
                                        Calendar
                                    </Link>
                                }
                                <Link
                                    href="/activities"
                                    className={`${linkClasses} ${pathname === '/activities' ? 'active' : ''}`}
                                >
                                    Activities
                                </Link>
                                <Link
                                    href="/contact-us"
                                    className={`${linkClasses} ${pathname === '/contact-us' ? 'active' : ''}`}
                                >
                                    Contact Us
                                </Link>
                                <Link
                                    href={isUserLoggedIn ? '/myaccount' : '/login'}
                                    className={`${linkClasses} ${isUserLoggedIn && pathname === '/myaccount' ? 'active' : ''}`}
                                >
                                    {isUserLoggedIn ? 'My Account' : 'Login'}
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>
            </div>

            {/* Mobile menu overlay */}
            {mobileView && (
                <div
                    className="mobile-overlay"
                    onClick={() => setMobileview(false)}
                />
            )}

            <style>{`
                header {
                    transition: all 0.3s ease;
                    z-index: 1000;
                }

                header.header-scrolled {
                    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
                }

                header.header-scrolled .navbar {
                    padding: 0.5rem 0;
                }

                .navbar-toggler {
                    border: none;
                    padding: 0.5rem;
                    background: transparent;
                }

                .navbar-toggler:focus {
                    box-shadow: none;
                }

                .toggler-icon {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    width: 24px;
                    height: 18px;
                    cursor: pointer;
                }

                .toggler-icon span {
                    display: block;
                    height: 2px;
                    width: 100%;
                    background: var(--primary, #29184d);
                    border-radius: 2px;
                    transition: all 0.3s ease;
                }

                .navbar-toggler.active .toggler-icon span:nth-child(1) {
                    transform: rotate(45deg) translate(5px, 5px);
                }

                .navbar-toggler.active .toggler-icon span:nth-child(2) {
                    opacity: 0;
                }

                .navbar-toggler.active .toggler-icon span:nth-child(3) {
                    transform: rotate(-45deg) translate(5px, -5px);
                }

                .mobile-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: -1;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @media (max-width: 991.98px) {
                    .mega-menu {
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: white;
                        padding: 1rem;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                        border-radius: 0 0 16px 16px;
                        max-height: 0;
                        overflow: hidden;
                        opacity: 0;
                        transition: all 0.3s ease;
                    }

                    .mega-menu.show {
                        max-height: 400px;
                        opacity: 1;
                        padding: 1rem;
                    }

                    .mega-menu .navbar-nav {
                        gap: 0.5rem;
                    }
                }
            `}</style>
        </header>
    )
}
