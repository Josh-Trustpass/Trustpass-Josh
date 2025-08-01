import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import EmployeeVerification from "@/pages/employee-verification";
import AdminDashboard from "@/pages/admin-dashboard";
import Login from "@/pages/login";

function Router() {
  const { isAuthenticated, isLoading, error } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle access denied error
  if (error?.message?.includes('Access denied')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h2 className="font-bold mb-2">Access Restricted</h2>
            <p>The admin panel is only accessible from authorized company locations.</p>
            <p className="mt-2 text-sm">Contact support if you need access: joshua@mcsclean.co.uk</p>
          </div>
          <div className="mt-4">
            <a href="/verify/MCS-0001" className="text-blue-600 hover:underline">
              View Employee Verification Demo
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public QR verification route - no authentication required */}
      <Route path="/verify/:employeeId" component={EmployeeVerification} />
      
      {/* All other routes require authentication */}
      <Route path="/login" component={Login} />
      <Route path="/" component={() => isAuthenticated ? <AdminDashboard /> : <Login />} />
      <Route path="/admin" component={() => isAuthenticated ? <AdminDashboard /> : <Login />} />
      <Route component={isAuthenticated ? NotFound : Login} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
