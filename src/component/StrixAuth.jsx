import React, { useState } from "react";
import { auth, provider, signInWithPopup } from "../firebase";
import { Link } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from 'react-router-dom';


const StrixAuth = () => {
  const [currentView, setCurrentView] = useState("login");
  const [accountType, setAccountType] = useState("personal");
  const [showPassword, setShowPassword] = useState(false);
  const [emailerror, setEmailerror] = useState("")
  const[passworderror , setPassworderror] = useState("")
  const [nameerror, setNameerror] = useState("")
  const [companyerror, setCompanyerror]= useState("")
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    company: "",
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setEmailerror("")
    setPassworderror("")
  };

  const handleGoogleAuth = async() => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("User Info:", user);

      // Store user info in localStorage (optional)
      localStorage.setItem("user", JSON.stringify(user));
      alert("Login successful!");
      navigate("/integration")

    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

   
    setEmailerror("");
    setPassworderror("");

    const { email, password } = formData;

    // Check if fields are filled
    if (!email && !password) {
      setEmailerror("*Please Enter Email");
      setPassworderror("*Please Enter Password");
      return;
    }

    if (!email) {
      setEmailerror("*Please Enter Email");
      return;
    }

    if (!password) {
      setPassworderror("*Please Enter Password");
      return;
    }


    const savedData = JSON.parse(localStorage.getItem("signupData"));

    if (!savedData) {
      alert("No account found. Please sign up first.");
      return;
    }

    
    if (email === savedData.email && password === savedData.password) {
      alert("Login successful!");
      navigate("/integration")
     
    } else {
      alert("Invalid email or password.");
    }
  };
  
  
  
  const handleCreateSubmit = (e) => {
    e.preventDefault();

    setEmailerror("");
    setPassworderror("");
    setNameerror("");

    const { email, password, name, company } = formData;

    let hasError = false;

    if (!email) {
      setEmailerror("*Please Enter Email");
      hasError = true;
    }

    if (!password) {
      setPassworderror("*Please Enter Password");
      hasError = true;
    }

    if (!name) {
      setNameerror("*Please Enter Name");
      hasError = true;
    }

    if (hasError) return;

    const userData = {
      view: currentView,
      type: accountType,
      email,
      password,
      name,
      company,
    };

    localStorage.setItem("signupData", JSON.stringify(userData));
    alert("Account Created Successfully!");

    setFormData({
      email: "",
      password: "",
      name: "",
      company: "",
    });

    setCurrentView(currentView === "login" ? "signup" : "login");
  };
  
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex flex-row justify-center  mb-4">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center  shadow-lg">
              <span className="text-2xl font-bold text-white">S</span>
            </div>
            <div className="flex flex-row justify-center items-center ml-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Strix
              </h1>
            </div>
          </div>
          <p className="text-gray-600 mt-1">The Spreadsheet Website</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-90">
          {currentView === "login" ? (
            <>
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back
                  </h2>
                  <p className="text-gray-600">Sign in to your Strix account</p>
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setAccountType("personal");
                      setFormData = {
                        email: "",
                        password: "",
                        name: "",
                        company: "",
                      };
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      accountType === "personal"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Personal
                  </button>
                  <button
                    onClick={() => {
                      setAccountType("business");
                      setFormData = {
                        email: "",
                        password: "",
                        name: "",
                        company: "",
                      };
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      accountType === "business"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Business
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <p className="!text-red-500 text-[13px] mt-2 ">
                      {emailerror}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {!showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="!text-red-500 text-[13px] mt-2 ">
                      {passworderror}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        Remember me
                      </span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
                  >
                    Sign In
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Create your account
                  </h2>
                  <p className="text-gray-600">
                    Join Strix and start managing your spreadsheets
                  </p>
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setAccountType("personal")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      accountType === "personal"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Personal
                  </button>
                  <button
                    onClick={() => setAccountType("business")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      accountType === "business"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Business
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {accountType === "business"
                        ? "Contact Name"
                        : "Full Name"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder={
                          accountType === "business"
                            ? "Enter contact name"
                            : "Enter your full name"
                        }
                        required
                      />
                    </div>
                    <p className="!text-red-500 text-[13px] mt-2 ">
                      {nameerror}
                    </p>
                  </div>

                  {accountType === "business" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          placeholder="Enter your company name"
                          required
                        />
                      </div>
                      <p className="!text-red-500 text-[13px] mt-2 ">
                        {nameerror}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <p className="!text-red-500 text-[13px] mt-2 ">
                      {emailerror}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="Create a password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {!showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="!text-red-500 text-[13px] mt-2 ">
                      {passworderror}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      {accountType === "personal"
                        ? "Personal Plan Features:"
                        : "Business Plan Features:"}
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {accountType === "personal"
                          ? "Up to 10 spreadsheets"
                          : "Unlimited spreadsheets"}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {accountType === "personal"
                          ? "1GB storage"
                          : "100GB storage"}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {accountType === "personal"
                          ? "Basic templates"
                          : "Advanced collaboration tools"}
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                      checked={isChecked}
                      onChange={(e) => setIsChecked(e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      I agree to the{" "}
                      <a
                        href="#"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        Privacy Policy
                      </a>
                    </span>
                  </label>

                  <button
                    type="submit"
                    onClick={handleCreateSubmit}
                    disabled={!isChecked}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
                  >
                    Create Account
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
              ;
            </>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleAuth}
              className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {currentView === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={() =>
                  setCurrentView(currentView === "login" ? "signup" : "login")
                }
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                {currentView === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 Strix. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default StrixAuth;