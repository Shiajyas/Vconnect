import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUserAuth } from "../hooks/useUserAuth";

declare global {
    interface Window {
        google: any;
    }
}

export const handleGoogleLogin = () => {
    try {
        const { googleAuthMutation } = useUserAuth();

        // Initialize GIS client
        window.google.accounts.id.initialize({
            client_id:  import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: (response: any) => {
                const idToken = response.credential;

                // Decode JWT or send to the backend
                const userData = { idToken };

                // Send user data to the backend
                googleAuthMutation.mutate(userData);

                
            },
        });

        // Render the Google Sign-In button
        window.google.accounts.id.prompt();
    } catch (error) {
        console.error("Google login failed", error);
        // toast.error("Google login failed");
    }
};
