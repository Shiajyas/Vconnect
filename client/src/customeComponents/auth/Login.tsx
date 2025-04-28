import React from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { handleGoogleLogin } from "../../features/handleGoogleLogin";
import GoogleAuthProvider from "../../features/GoogleAuthProvider";

interface LoginFormInputs {
  email: string;
  password: string;
}

interface LoginPageProps {
  role: "user" | "admin";
  onSubmit: (email: string, password: string) => void;
  onGoogleLogin: () => void; // Callback for Google login
  redirectPath: string;
  title?: string;
  logoUrl?: string;
  forgotPasswordLink?: string;
  registerLink?: string;
  isLoading?: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({
  role,
  onSubmit,
  redirectPath = role === "admin" ? "/admin/dashboard" : "/home",
  title = "Login",
  logoUrl = logo,
  forgotPasswordLink = "/forgot-password",
  registerLink = "/register",
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();

  const handleFormSubmit = (data: LoginFormInputs) => {
    onSubmit(data.email, data.password);
  };



  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src= "/logo.png" alt="Logo" className="w-16 h-16" />
        </div>

        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
          {role === "admin" ? `${title}` : title}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Email Field */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end mb-4">
            <Link
              to={forgotPasswordLink}
              className="text-sm text-blue-500 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200"
            disabled={isLoading}
          >
           <span className="text-black"> {isLoading ? "Logging in..." : "Login"}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 border-t border-gray-300"></div>

        {/* Google Login Button */}
      
        {role === "user" && (
       <GoogleAuthProvider onGoogleSignIn={handleGoogleLogin} />
        )}

        {/* Register Link */}
        {role === "user" && (
          <p className="mt-4 text-sm text-center">
            Don't have an account?{" "}
            <Link to={registerLink} className="text-blue-500 hover:underline">
              Register
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
