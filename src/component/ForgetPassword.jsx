import React, { useState } from "react";
import { auth, sendPasswordResetEmail } from "../Firebase"; 

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("❌ Please enter a valid email address.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("✅ A link to reset your password has been sent to your email.");
    } catch (error) {
      console.error("Error sending password reset email:", error.code, error.message);
      if (error.code === "auth/user-not-found") {
        setMessage("❌ No user found with this email address.");
      } else {
        setMessage(`❌ Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="flex flex-row items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-white mt-10 shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>
        <form onSubmit={handleForgot} className="space-y-4">
          <input
            type="email"
            placeholder="Enter Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700"
          >
            Send Reset Link
          </button>
        </form>
        {message && (
          <p className="text-center mt-4 text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;