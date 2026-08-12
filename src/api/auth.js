import api from "./axios";

export const login = (data) => {
    return api.post("/auth/login", data);
};