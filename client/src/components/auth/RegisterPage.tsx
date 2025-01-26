import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { img_Url } from "../../images/image";
import { useUserAuth } from "../../hooks/useUserAuth";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { registerMutation, isRegisterLoading } = useUserAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm();

  const onSubmit = async (data: any) => {
    try {
      await registerMutation.mutateAsync(data);
      navigate("/verify-otp");
    } catch (error) {
      console.error("Error during registration:", error);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={img_Url} alt="Logo" className="w-24 h-24" />
        </div>

        <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Register
        </h3>

        {/* Loading Indicator */}
        {isRegisterLoading && (
          <div className="flex justify-center items-center mb-6">
            <div className="spinner-large"></div>
          </div>
        )}

        {/* Full Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
              errors.fullname ? "border-red-500" : "border-gray-300"
            }`}
            {...register("fullname", { required: "Full name is required" })}
          />
          {errors.fullname && (
            <small className="text-red-500">{errors.fullname?.message as string}</small>
          )}
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
              errors.username ? "border-red-500" : "border-gray-300"
            }`}
            {...register("username", { required: "Username is required" })}
          />
          {errors.username && (
            <small className="text-red-500">{errors.username?.message as string}</small>
          )}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
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
            <small className="text-red-500">{errors.email?.message as string}</small>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters long",
              },
            })}
          />
          {errors.password && (
            <small className="text-red-500">{errors.password?.message as string}</small>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type="password"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
              errors.confirmPassword ? "border-red-500" : "border-gray-300"
            }`}
            {...register("confirmPassword", {
              required: "Confirm Password is required",
              validate: (value) =>
                value === getValues("password") || "Passwords do not match",
            })}
          />
          {errors.confirmPassword && (
            <small className="text-red-500">{errors.confirmPassword?.message as string}</small>
          )}
        </div>

        {/* Gender */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <div className="flex items-center space-x-4 mt-1">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="male"
                {...register("gender", { required: "Gender is required" })}
              />
              <span>Male</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="female"
                {...register("gender", { required: "Gender is required" })}
              />
              <span>Female</span>
            </label>
          </div>
          {errors.gender && (
            <small className="text-red-500">{errors.gender?.message as string}</small>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200"
          disabled={isRegisterLoading}
        >
          <span className="text-black">{isRegisterLoading ? "Registering..." : "Register"}</span>
          
        </button>

        <p className="text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login Now
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
