import { useAuthState } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, TrendingDown, BarChart,DollarSign  } from "lucide-react";

import fdesLogo from "@assets/image_1758110732910.png";
import fdesLogo1 from "@assets/expensive2.png";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, login } = useAuthState();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Checking authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      // <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div style={{ height: "100vh", width: "100vw", display: "flex", border: "none" }}>
        {/* <div style={{ width: "72%", padding: 0, height: "100%",position:"relative" }}>
          <img style={{ width: "100%", height: "100%" }} src={fdesLogo1} alt="" />
          <h2 className='text-2xl font-bold' style={{position:"absolute",top:"50px",left:"24%",color:"white"}}>Empowering success through premium financial management.</h2>
        </div> */}
        {/* <div style={{ width: "72%", padding: 0, height: "100%", position: "relative" }}>
  <img style={{ width: "100%", height: "100%", objectFit: "cover" }} src={fdesLogo1} alt="" />
  <h2 
    className="text-3xl font-bold text-center"
    style={{
      position: "absolute",
      top: "80px",
      left: "50%",
      transform: "translate(-50%, -50%)",
      color: "white",
      textShadow: "2px 2px 8px rgba(252, 252, 252, 0.1)",
      padding: "0 10px"
    }}
  >
    Empowering success through premium financial management.
  </h2>
</div> */}
        {/* <div style={{ width: "72%", padding: 0, height: "100%", position: "relative" }}>
  <img 
    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
    src={fdesLogo1} 
    alt="" 
  />
  <h2
    className="text-2xl md:text-3xl font-bold"
    style={{
      position: "absolute",
      top: "50%",       // place near bottom
      left: "50%",
      transform: "translateX(-50%)",
      color: "rgba(5, 5, 5, 0.7)",  // white with transparency
      whiteSpace: "nowrap",  // force single line
      textShadow: "1px 1px 8px rgba(0,0,0,0.6)" // improve readability
    }}
  >
    Empowering success through premium financial management.
  </h2>
</div> */}
        <div style={{ width: "70%", padding: 0, height: "100%", position: "relative" }}>
          <img style={{ width: "100%", height: "100%", objectFit: "cover" }} src={fdesLogo1} alt="" />
          <h2
            className="text-4xl font-bold text-center"
            style={{
              position: "absolute",
              top: "150px",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "white",
              textShadow: "2px 2px 8px rgba(0,0,0,0.7)",
              padding: "0 10px"
            }}
          >
            Simplify Your Expense <br />Management
          </h2>
          <div style={{
            position: "absolute",
            top: "300px",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }} className="w-[620px] bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-5 ">

            {/* Logo */}
            <div className="flex gap-3">
              <div className="flex items-center justify-center" style={{ width: "50px", height: "50px", borderRadius: "10px", backgroundColor: "#21b8f5" }}>
                <TrendingUp className="w-8 h-8 text-white" />
              </div>

              <div style={{ width: "520px" }}>
                <h2
                  className="text-1xl font-bold m-0"
                >
                  Real-time Analytics
                </h2>
                <p style={{ fontSize: "13px", color: "#3a3b3dff" }}>
                 Get instant insights into spending patterns and budget performance with a comprehensive reporting tool. Track all company expenses in real time and categorize costs automatically. Make informed decisions to optimize budgets and improve overall financial performance.
                </p>
              </div>
            </div>
          </div>
           <div style={{
            position: "absolute",
            top: "480px",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }} className="w-[620px] bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-5 ">

            {/* Logo */}
            <div className="flex gap-3">
              <div className="flex items-center justify-center" style={{ width: "50px", height: "50px", borderRadius: "10px", backgroundColor: "#21b8f5" }}>
                <BarChart className="w-8 h-8 text-white" />
              </div>

              <div style={{ width: "520px" }}>
                <h2
                  className="text-1xl font-bold m-0"
                >
                  Spending Insights
                </h2>
                <p style={{ fontSize: "13px", color: "#3a3b3dff" }}>
                  Get instant visibility into company expenditures with detailed analytics and reporting tools. Monitor spending in real time and categorize expenses automatically. Make informed decisions to optimize budgets and reduce costs efficiently.
                </p>
              </div>
            </div>
          </div>
          <div style={{
            position: "absolute",
            top: "660px",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }} className="w-[620px] bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-5 ">

            {/* Logo */}
            <div className="flex gap-3">
              <div className="flex items-center justify-center" style={{ width: "50px", height: "50px", borderRadius: "10px", backgroundColor: "#21b8f5" }}>
                <DollarSign  className="w-8 h-8 text-white" />
              </div>

              <div style={{ width: "520px" }}>
                <h2
                  className="text-1xl font-bold m-0"
                >
                  Cost Control
                </h2>
                <p style={{ fontSize: "13px", color: "#3a3b3dff" }}>
                 Track and manage every expense efficiently, reducing waste and improving financial performance. Monitor all company expenditures in real time and categorize costs automatically. Gain actionable insights to optimize budgets and make informed financial decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center" style={{ width: "30%", height: "100%", backgroundColor: "white" }}>
          <div className="  flex flex-col items-center">

            {/* Logo + Title */}
            <div className="flex flex-col gap-6 items-center">
              {/* <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4"> */}
              {/* Replace with your own logo if needed */}
              <img
                src={fdesLogo}
                alt="FDES Logo"
                className="h-20 w-auto object-contain"
              />
              {/* </div> */}
              {/* <h1 className="text-3xl font-bold">
        <span className="text-blue-600">Office </span>
        <span className="text-purple-600">Expense </span>
        <span className="text-gray-800">Tracker</span>
      </h1> */}
              {/* <div className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Office Expense Tracker
                </span>
              </div> */}
              <h2 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">
              Office Expense Tracker
            </h2>
              <div className="w-full">
                <p className="text-sm text-gray-600 mb-3 font-medium">Sign in to continue</p>
                <p className="text-xs text-gray-400 mb-4">
                  Use your company Microsoft account to access the platform
                </p>

                <Button
                  onClick={login}
                  className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 py-3 px-2 text-base font-medium rounded-lg flex items-center justify-start gap-3 shadow-sm transition-transform transform hover:scale-[1.02]"
                  data-testid="button-login-required"
                >
                  {/* Microsoft squares */}
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                      <div className="bg-red-500 w-2 h-2"></div>
                      <div className="bg-green-500 w-2 h-2"></div>
                      <div className="bg-blue-500 w-2 h-2"></div>
                      <div className="bg-yellow-500 w-2 h-2"></div>
                    </div>
                  </div>
                  <span>Sign in with Microsoft</span>
                </Button>
              </div>
            </div>

            {/* Welcome Back */}


            {/* Microsoft Sign In */}


            {/* Footer */}
            <p className="text-gray-400 text-xs font-medium mt-10">
              {/* © 2025 Floot Inc. All rights reserved. */}
              V1.0 • {new Date().toLocaleString("en-US", { month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100" style={{ width: "28%", height: "100%" }}>
          <div className="w-[420px] bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-10 flex flex-col items-center">

          
            <div className="mb-6 flex justify-center">
              <h2
                  className="text-2xl font-bold m-0"
                >
                  Office Expensive Tracker
                </h2>
              <img
                src={fdesLogo}
                alt="FDES Logo"
                className="h-20 w-auto object-contain"
              />
            </div>

            
            <h2 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">
              Expense Tracker
            </h2>
            <p className="text-base text-gray-500 mb-8">
              Sign in to your account
            </p>

            <Button
              onClick={login}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-2 text-lg font-medium rounded-xl flex items-center justify-center gap-3 shadow-md transition-transform transform hover:scale-[1.02]"
              data-testid="button-login-required"
            >

              <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
                <div className="grid grid-cols-2 gap-px w-3 h-3">
                  <div className="bg-red-500 w-1.5 h-1.5"></div>
                  <div className="bg-green-500 w-1.5 h-1.5"></div>
                  <div className="bg-blue-500 w-1.5 h-1.5"></div>
                  <div className="bg-yellow-500 w-1.5 h-1.5"></div>
                </div>
              </div>
              <span>Sign in with Office 365</span>
            </Button>

            <p className="text-gray-400 text-sm font-medium mt-8">
              V1.0 • Sept 2025
            </p>
          </div>
        </div> */}
      </div>
      // </div>
    );
  }

  // Show access denied if admin required but user is not admin
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 mx-auto text-destructive" />
              <div>
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="text-muted-foreground mt-2">
                  You don't have permission to access this page. Administrator privileges are required.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}