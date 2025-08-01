import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, QrCode, Users, Menu, LogOut } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import mcsLogo from "@assets/MCS Logo High Quality No Background_1750938857010.png";
import trustPassLogo from "@assets/Trust Pass powered by mcs_1754044444109.png";

export default function NavigationHeader() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the admin panel",
      });
      window.location.href = '/login';
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "destructive",
      });
    }
  });

  return (
    <header className="bg-green-600 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/admin">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="bg-white p-2 rounded-lg">
                <img src="/attached_assets/MCS Logo High Quality No Background_1750938857010.png" alt="MCS Logo" className="h-8 w-auto" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">MCS - Employee Management</h1>
                <p className="text-green-100 text-sm">Employee Management Platform</p>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex space-x-6 items-center">
            <Link href="/admin">
              <Button
                variant="ghost"
                className={`text-green-100 hover:text-white px-3 py-2 transition-colors ${
                  location === '/admin' || location === '/' ? 'bg-green-700 text-white' : ''
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="text-green-100 hover:text-white px-3 py-2 transition-colors"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </nav>

          <button 
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <Link href="/admin">
              <Button
                variant="ghost"
                className="w-full text-green-100 hover:text-white justify-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
