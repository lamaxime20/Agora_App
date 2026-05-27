import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => {
    return useContext(AuthContext);
}

export function effacer_tout_le_local_storage() {
    window.localStorage.clear();
}