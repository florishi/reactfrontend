import axios from "axios";
import Auth from "./Auth";

export const baseURL = "/api/v3";

export const getBaseURL = () => {
    return baseURL;
};

export const getPreviewURL = (
    isShare: boolean,
    shareID: any,
    fileID: any,
    path: any
): string => {
    return (
        getBaseURL() +
        (isShare
            ? "/share/preview/" +
              shareID +
              (path !== "" ? "?path=" + encodeURIComponent(path) : "")
            : "/file/preview/" + fileID)
    );
};

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const instance = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true,
});

class AppError extends Error {
    constructor(message: string | undefined, public code: any, error: any) {
        super(message);
        this.code = code;
        this.message = message || "未知错误";
        this.message += error ? " " + error : "";
        this.stack = new Error().stack;
    }
}

instance.interceptors.response.use(
    function (response: any) {
        response.rawData = response.data;
        response.data = response.data.data;
        if (
            response.rawData.code !== undefined &&
            response.rawData.code !== 0 &&
            response.rawData.code !== 203
        ) {
            // 登录过期
            if (response.rawData.code === 401) {
                Auth.signout();
                window.location.href = "/login";
            }

            // 非管理员
            if (response.rawData.code === 40008) {
                window.location.href = "/home";
            }
            throw new AppError(
                response.rawData.msg,
                response.rawData.code,
                response.rawData.error
            );
        }
        return response;
    },
    function (error) {
        return Promise.reject(error);
    }
);

export default instance;