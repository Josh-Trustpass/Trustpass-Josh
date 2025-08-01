import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import NavigationHeader from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserX, QrCode, Eye, Plus, Download, Search, Filter, Edit, Trash2, UserMinus, LogOut, Ban, AlertTriangle } from "lucide-react";
import AddEmployeeModal from "@/components/add-employee-modal";
import QRCodeModal from "@/components/qr-code-modal";
import type { Employee } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const { toast } = useToast();

  // Helper function to check if DBS certificate is expired
  const isDBSExpired = (dbsExpiryDate: string | null): boolean => {
    if (!dbsExpiryDate) return false;
    const today = new Date();
    const expiryDate = new Date(dbsExpiryDate);
    return expiryDate < today;
  };

  const { data: employees = [], isLoading: employeesLoading, refetch: refetchEmployees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
  });

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

  const filteredAndSortedEmployees = employees ? (employees as Employee[])
    .filter((employee: Employee) => {
      const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "active" && employee.isActive && !employee.isSuspended) ||
                           (statusFilter === "inactive" && !employee.isActive) ||
                           (statusFilter === "suspended" && employee.isSuspended);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a: Employee, b: Employee) => {
      switch (sortBy) {
        case "name":
          return a.fullName.localeCompare(b.fullName);
        case "startDateOldest":
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case "startDateNewest":
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case "dbsSoonest":
          if (!a.dbsExpiryDate && !b.dbsExpiryDate) return 0;
          if (!a.dbsExpiryDate) return 1;
          if (!b.dbsExpiryDate) return -1;
          return new Date(a.dbsExpiryDate).getTime() - new Date(b.dbsExpiryDate).getTime();
        case "dbsLatest":
          if (!a.dbsExpiryDate && !b.dbsExpiryDate) return 0;
          if (!a.dbsExpiryDate) return 1;
          if (!b.dbsExpiryDate) return -1;
          return new Date(b.dbsExpiryDate).getTime() - new Date(a.dbsExpiryDate).getTime();
        default:
          return 0;
      }
    }) : [];

  const handleShowQR = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowQRModal(true);
  };

  const handleEmployeeAdded = () => {
    refetchEmployees();
    setShowAddModal(false);
    setSelectedEmployee(null); // Clear selected employee after adding/editing
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowAddModal(true); // Reuse the add modal for editing
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      await apiRequest('PATCH', `/api/employees/${employee.id}`, {
        isActive: !employee.isActive
      });
      toast({
        title: "Employee updated",
        description: `${employee.fullName} has been ${!employee.isActive ? 'activated' : 'deactivated'}`,
      });
      refetchEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee status",
        variant: "destructive",
      });
    }
  };

  const handleToggleSuspension = async (employee: Employee) => {
    try {
      console.log('Toggling suspension for:', employee.fullName, 'Current status:', employee.isSuspended);
      const newSuspensionStatus = !employee.isSuspended;
      
      await apiRequest('PATCH', `/api/employees/${employee.id}`, {
        isSuspended: newSuspensionStatus
      });
      
      toast({
        title: "Employee updated",
        description: `${employee.fullName} has been ${newSuspensionStatus ? 'suspended' : 'unsuspended'}`,
      });
      refetchEmployees();
    } catch (error) {
      console.error('Suspension toggle error:', error);
      toast({
        title: "Error",
        description: "Failed to update suspension status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!window.confirm(`Are you sure you want to delete ${employee.fullName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiRequest('DELETE', `/api/employees/${employee.id}`);
      toast({
        title: "Employee deleted",
        description: `${employee.fullName} has been removed from the system`,
      });
      refetchEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  if (employeesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MCS - Employee Management</h1>
              <p className="mt-1 text-sm text-gray-500">Manage employee verification and QR codes</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
              <Button variant="secondary" className="bg-gray-600 hover:bg-gray-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Export QR Codes
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Employees</p>
                  <p className="text-2xl font-semibold text-gray-900">{(stats as any)?.activeEmployees || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <UserX className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Inactive</p>
                  <p className="text-2xl font-semibold text-gray-900">{(stats as any)?.inactiveEmployees || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <QrCode className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">QR Codes Generated</p>
                  <p className="text-2xl font-semibold text-gray-900">{(stats as any)?.totalEmployees || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <Ban className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Suspended</p>
                  <p className="text-2xl font-semibold text-gray-900">{(stats as any)?.suspendedEmployees || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="startDateOldest">Start Date (Oldest)</SelectItem>
                  <SelectItem value="startDateNewest">Start Date (Newest)</SelectItem>
                  <SelectItem value="dbsSoonest">DBS Expiry (Soonest)</SelectItem>
                  <SelectItem value="dbsLatest">DBS Expiry (Latest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DBS Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employment Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DBS Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedEmployees.map((employee: Employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full overflow-hidden">
                          {employee.photoUrl ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={employee.photoUrl}
                              alt={employee.fullName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {employee.fullName.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.fullName}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.employeeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.dbsNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col">
                        <Badge 
                          variant={employee.employmentType === "permanent" ? "default" : "secondary"}
                          className={employee.employmentType === "permanent" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}
                        >
                          {employee.employmentType === "permanent" ? "Permanent" : "Temporary"}
                        </Badge>
                        {employee.employmentType === "temporary" && employee.validUntilDate && (
                          <span className="text-xs text-gray-500 mt-1">
                            Until: {format(new Date(employee.validUntilDate), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {employee.dbsExpiryDate ? (
                        <div className={`flex items-center ${isDBSExpired(employee.dbsExpiryDate) ? 'text-red-600' : 'text-gray-900'}`}>
                          {isDBSExpired(employee.dbsExpiryDate) && (
                            <AlertTriangle className="h-4 w-4 mr-1" />
                          )}
                          <span className={isDBSExpired(employee.dbsExpiryDate) ? 'font-semibold' : ''}>
                            {format(new Date(employee.dbsExpiryDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <Badge 
                          variant={employee.isActive ? "default" : "secondary"}
                          className={employee.isActive ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                        >
                          {employee.isActive ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                        {employee.isSuspended && (
                          <Badge variant="destructive" className="bg-red-100 text-red-800">
                            <Ban className="h-3 w-3 mr-1" />
                            Suspended
                          </Badge>
                        )}
                      </div>
                      {/* Suspension Toggle Button */}
                      <div className="mt-2">
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => handleToggleSuspension(employee)}
                          className={employee.isSuspended ? 
                            "border-green-500 text-green-600 hover:bg-green-50" : 
                            "border-red-500 text-red-600 hover:bg-red-50"
                          }
                        >
                          {employee.isSuspended ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Unsuspend
                            </>
                          ) : (
                            <>
                              <Ban className="h-3 w-3 mr-1" />
                              Suspend
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShowQR(employee)}
                        disabled={!employee.isActive}
                        className={employee.isActive ? "text-blue-600 hover:text-blue-700" : "text-gray-400 cursor-not-allowed"}
                      >
                        <QrCode className="h-5 w-5" />
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleEditEmployee(employee)}
                        title="Edit employee"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-yellow-600 hover:text-yellow-700"
                        onClick={() => handleToggleActive(employee)}
                        title={employee.isActive ? "Deactivate employee" : "Activate employee"}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteEmployee(employee)}
                        title="Delete employee"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedEmployees.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No employees found matching your criteria.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <AddEmployeeModal 
        isOpen={showAddModal} 
        onClose={() => {
          setShowAddModal(false);
          setSelectedEmployee(null);
        }}
        onEmployeeAdded={handleEmployeeAdded}
        selectedEmployee={selectedEmployee}
      />

      {selectedEmployee && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          employee={selectedEmployee}
        />
      )}
    </div>
  );
}
