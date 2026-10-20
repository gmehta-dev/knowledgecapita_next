"use client";

import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { toast } from "react-toastify";
import Auth from "./Auth";

const onRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = Auth.token();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

const onRequestError = (error: AxiosError): Promise<AxiosError> => {
  // console.error(`[request error] [${JSON.stringify(error)}]`);
  return Promise.reject(error);
}

const onResponse = (response: AxiosResponse): AxiosResponse => {
  // console.info(`[response] [${JSON.stringify(response)}]`);
  return response.data;
}

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

const onResponseError = (error: AxiosError<ApiErrorResponse>): Promise<AxiosError> => {
  const errorData = error?.response?.data;

  if (errorData?.errors && Object.keys(errorData.errors).length > 0) {
    for (const key in errorData.errors) {
      toast.error(errorData.errors[key][0])
    }
  } else {
    toast.error(errorData?.message || 'Something went wrong!')
  }

  if (error?.response?.status === 401) {
    Auth.logout()
    setTimeout(() => {
      window.location.href = process.env.NEXT_PUBLIC_LOGOUT_REDIRECT_URL || '/'
    }, 1000);
  }

  return Promise.reject(error.response);
}

export function setupInterceptorsTo(axiosInstance: AxiosInstance): AxiosInstance {
  axiosInstance.interceptors.request.use(onRequest, onRequestError);
  axiosInstance.interceptors.response.use(onResponse, onResponseError);
  return axiosInstance;
}


export const axiosInstance = setupInterceptorsTo(axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/',
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  }
}))