import React, { useState, useEffect } from "react";
// import { NodeJS } from "node";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
// import { useAuth } from "../hooks/useAuth";
import { useUserAuth } from "../hooks/useUserAuth";
import { useLocation, useNavigate } from "react-router-dom";


interface ForgotPasswordFormInputs {
  email?: string;
  otp?: string;
  password?: string;
  confirmPassword?: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP, Step 3: Reset Password
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(90); // Timer for OTP resend
  const [isOtpResendAvailable, setIsOtpResendAvailable] = useState(true);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordFormInputs>();

  const { requestOtpMutation, verifyOtpfMutation, resetPasswordMutation } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation()

  const role = location.pathname.includes("admin") ? "admin" : "user"

  // Start the timer when OTP is sent
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsOtpResendAvailable(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const onSubmit = async (data: ForgotPasswordFormInputs) => {
    const email = watch("email") || "";
    setLoading(true);

    if (step === 1) {
      requestOtpMutation.mutate(
        { email },
        {
          onSuccess: () => {
            toast.success("OTP sent to your email!");
            setStep(2);
            setTimer(90); 
            setIsOtpResendAvailable(false); 
          },
          onError: (error: any) => {
            toast.error(error?.response?.data?.msg || "Give registerd email");
          },
          onSettled: () => setLoading(false),
        }
      );
    } else if (step === 2) {
      const otp = data.otp || "";
      verifyOtpfMutation.mutate(
        { email, otp },
        {
          onSuccess: () => {
            toast.success("OTP verified successfully!");
            setStep(3);
          },
          onError: (error: any) => {
            toast.error(error?.response?.data?.msg || "Invalid OTP");
          },
          onSettled: () => setLoading(false),
        }
      );
    } else if (step === 3) {
      if (data.password !== data.confirmPassword) {
        toast.error("Passwords do not match!");
        setLoading(false);
        return;
      }
      resetPasswordMutation.mutate(
        { email, password: data.password || "" },
        {
          onSuccess: () => {
            toast.success("Password reset successfully!");
            if(role == "user"){
              navigate("/login");
            }else{
              navigate("/admin/login");
            }
            
          },
          onError: (error: any) => {
            toast.error(error?.response?.data?.msg || "Failed to reset password");
          },
          onSettled: () => setLoading(false),
        }
      );
    }
  };

  const handleResendOtp = () => {
    if (timer > 0) {
      toast.warn("Please wait until the timer expires to resend OTP.");
      return;
    }
    const email = watch("email") || "";
    requestOtpMutation.mutate(
      { email },
      {
        onSuccess: () => {
          toast.success("OTP resent successfully!");
          setTimer(90); 
          setIsOtpResendAvailable(false);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.msg || "Failed to resend OTP");
        },
      }
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-12"
          />
        </div>

        {/* Step Tracker */}
        <div className="flex items-center justify-between mb-8">
          {[{ label: "Step 1: Email", completed: step > 1 }, { label: "Step 2: OTP", completed: step > 2 }, { label: "Step 3: Reset", completed: step > 3 }].map(
            (stepInfo, index) => {
              const stepNumber = index + 1;
              const isActive = step === stepNumber;
              return (
                <div key={stepInfo.label} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full ${isActive ? "bg-blue-500 text-white" : stepInfo.completed ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700"}`}
                  >
                    {stepInfo.completed ? "✔" : stepNumber}
                  </div>
                  <span className={`mt-2 text-sm ${isActive ? "text-blue-500 font-bold" : "text-gray-700 font-medium"}`}>
                    {stepInfo.label}
                  </span>
                </div>
              );
            }
          )}
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Email Input */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none ${errors.email ? "border-red-500" : "border-gray-300"}`}
                  {...register("email", { required: "Email is required", pattern: { value: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/, message: "Invalid email address" } })}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
              </div>
              {/* Submit Button */}
              <button type="submit" className="w-full py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none">
               <span className="text-black"> {loading ? "Sending OTP..." : "Send OTP"}</span>
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* OTP Input */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">OTP</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none ${errors.otp ? "border-red-500" : "border-gray-300"}`}
                  {...register("otp", { required: "OTP is required", minLength: 6, maxLength: 6 })}
                />
                {errors.otp && <p className="mt-1 text-sm text-red-500">{errors.otp.message}</p>}
              </div>
              <button type="submit" className="w-full py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none">
              <span className="text-black">  {loading ? "Verifying..." : "Verify OTP"}</span>
              </button>
              <p className="mt-4 text-sm text-gray-600">
                Didn't receive the OTP?{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!isOtpResendAvailable}
                  className={`${
                    !isOtpResendAvailable ? "text-gray-400 cursor-not-allowed" : "text-blue-500 underline hover:text-blue-600"
                  }`}
                >
                   
                  Resend OTP
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {timer > 0
                  ? `Resend available in ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, "0")}`
                  : "You can resend the OTP now."}
              </p>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Password Inputs */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none ${errors.password ? "border-red-500" : "border-gray-300"}`}
                  {...register("password", { required: "Password is required" })}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none ${errors.confirmPassword ? "border-red-500" : "border-gray-300"}`}
                  {...register("confirmPassword", {
                    validate: (value) => value === watch("password") || "Passwords do not match",
                  })}
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
              </div>
              <button type="submit" className="w-full py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none">
              <span className="text-black"> {loading ? "Resetting Password..." : "Reset Password"}</span>
                
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
