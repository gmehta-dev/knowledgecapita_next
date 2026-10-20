// Shared TypeScript interfaces

export interface User {
    id: number | string
    name: string
    email: string
    phone_number?: string
    designation?: string
    industry?: string
    area_of_specialization?: string
    profile_image?: string
}

export interface AuthResponse {
    token: string
    user: User
}

export interface LayoutContext {
    isLoader: boolean
    setIsLoader: (value: boolean) => void
    isUserLoggedIn: boolean
    setIsUserLoggedIn: (value: boolean) => void
    contentData: { dropdowns?: DropdownData; about?: AboutData } | null
    authData: AuthData | null
}

export interface AboutData {
    'first-content': { data: string }
    'list': { content: string }[]
    'second-content': Record<string, string>
}

export interface AuthData {
    designation: string[]
    emailId: string[]
    industry?: string[]
    area_of_specialization?: string[]
}

export interface DropdownData {
    industry: string[]
    designation: string[]
    area_of_specialization: string[]
    emailId: string[]
}

export interface ApiResponse<T = unknown> {
    message: string
    data: T
    total?: number
}
