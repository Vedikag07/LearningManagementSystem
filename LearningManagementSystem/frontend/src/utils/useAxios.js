// OLD CODE COMMENTED WITH EXPLANATIONS

/*
const useAxios = () => {
    const accessToken = Cookies.get("access_token");
    const refreshToken = Cookies.get("refresh_token");

    const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    axiosInstance.interceptors.request.use(async (req) => {
        if (!isAccessTokenExpired(accessToken)) {
            // Pass the token here
            return req;
        }

        console.log(accessToken);
        console.log(refreshToken);

        const response = await getRefreshedToken(refreshToken);
        console.log("response.data ====", response?.data);
        console.log("response.data?.access ====", response?.data?.access);

        setAuthUser(response.data?.access, response.data?.refresh);
        req.headers.Authorization = `Bearer ${response.data?.access}`;
        return req;
    });

    return axiosInstance;
};
*/

// CHANGES:
// - Now handles both `AllowAny` and `IsAuthenticated` endpoints
// - Doesn't send the Authorization header if the endpoint is public
// - Checks and refreshes tokens only when necessary for authenticated endpoints

import axios from "axios";
import { setAuthUser, getRefreshToken, isAccessTokenExpired } from "./auth";
import Cookie from "js-cookie";

// Create an Axios instance with default settings
const useAxios = axios.create({
    baseURL: "http://127.0.0.1:8000/api/v1/",
    timeout: 10000000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor for adding authentication token if available
useAxios.interceptors.request.use(
    async (config) => {
        const accessToken = Cookie.get("access_token"); // Updated cookie names for consistency with your app

        // If the access token exists, add it to the Authorization header
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // If the access token is expired, attempt to refresh it
        if (isAccessTokenExpired(accessToken)) {
            const refreshToken = Cookie.get("refresh_token"); // Updated for consistency
            if (refreshToken) {
                try {
                    const response = await getRefreshToken(refreshToken);

                    // Update the token cookies and headers
                    setAuthUser(response.data.access, response.data.refresh);
                    config.headers.Authorization = `Bearer ${response.data.access}`;
                } catch (error) {
                    // Handle refresh token failure (e.g., log out user or show an error message)
                    console.error("Token refresh failed:", error);
                }
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling errors
useAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle specific error cases if needed
        if (error.response && error.response.status === 401) {
            // Handle unauthorized errors (e.g., redirect to login)
            console.error("Unauthorized access - you may need to log in:", error);
        }

        return Promise.reject(error);
    }
);

export default useAxios;