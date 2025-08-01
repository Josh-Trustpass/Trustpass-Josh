import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";

import type { Employee } from "@shared/schema";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeAdded: () => void;
  selectedEmployee?: Employee | null;
}

export default function AddEmployeeModal({ isOpen, onClose, onEmployeeAdded, selectedEmployee }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    employeeId: "",
    dbsNumber: "",
    dbsExpiryDate: "",
    startDate: "",
    employmentType: "permanent",
    validUntilDate: "",
    position: "Cleaner",
    isActive: true,
    isSuspended: false,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Reset form when modal opens/closes or selectedEmployee changes
  useEffect(() => {
    if (isOpen && selectedEmployee) {
      // Edit mode - populate form with existing employee data
      const startDateStr = new Date(selectedEmployee.startDate).toISOString().split('T')[0];
      const dbsExpiryDateStr = selectedEmployee.dbsExpiryDate ? new Date(selectedEmployee.dbsExpiryDate).toISOString().split('T')[0] : "";
      
      const validUntilDateStr = selectedEmployee.validUntilDate ? new Date(selectedEmployee.validUntilDate).toISOString().split('T')[0] : "";
      
      setFormData({
        fullName: selectedEmployee.fullName,
        employeeId: selectedEmployee.employeeId,
        dbsNumber: selectedEmployee.dbsNumber,
        dbsExpiryDate: dbsExpiryDateStr,
        startDate: startDateStr,
        employmentType: selectedEmployee.employmentType || "permanent",
        validUntilDate: validUntilDateStr,
        position: selectedEmployee.position || "Cleaner",
        isActive: selectedEmployee.isActive ?? true,
        isSuspended: selectedEmployee.isSuspended ?? false,
      });
      setPhotoPreview(selectedEmployee.photoUrl || null);
      setPhotoFile(null);
    } else if (isOpen) {
      // Add mode - reset form
      setFormData({
        fullName: "",
        employeeId: "",
        dbsNumber: "",
        dbsExpiryDate: "",
        startDate: "",
        employmentType: "permanent",
        validUntilDate: "",
        position: "Cleaner",
        isActive: true,
        isSuspended: false,
      });
      setPhotoPreview(null);
      setPhotoFile(null);
    }
  }, [isOpen, selectedEmployee]);

  const { toast } = useToast();

  const employeeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (selectedEmployee) {
        // Edit existing employee
        return await apiRequest('PATCH', `/api/employees/${selectedEmployee.id}`, data);
      } else {
        // Create new employee
        return await apiRequest('POST', '/api/employees', data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: selectedEmployee ? "Employee updated successfully!" : "Employee added successfully!",
      });
      onEmployeeAdded();
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || (selectedEmployee ? "Failed to update employee" : "Failed to add employee"),
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setFormData({
      fullName: "",
      employeeId: "",
      dbsNumber: "",
      dbsExpiryDate: "",
      startDate: "",
      employmentType: "permanent",
      validUntilDate: "",
      position: "Cleaner",
      isActive: true,
      isSuspended: false,
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    onClose();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.fullName.trim() || !formData.employeeId.trim() || 
        !formData.dbsNumber.trim() || !formData.startDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate temporary staff has valid until date
    if (formData.employmentType === "temporary" && !formData.validUntilDate) {
      toast({
        title: "Validation Error",
        description: "Valid employment until date is required for temporary staff",
        variant: "destructive",
      });
      return;
    }
    
    const submitData = new FormData();
    submitData.append('fullName', formData.fullName.trim());
    submitData.append('employeeId', formData.employeeId.trim());
    submitData.append('dbsNumber', formData.dbsNumber.trim());
    if (formData.dbsExpiryDate) {
      submitData.append('dbsExpiryDate', formData.dbsExpiryDate);
    }
    submitData.append('startDate', formData.startDate);
    submitData.append('employmentType', formData.employmentType);
    if (formData.validUntilDate) {
      submitData.append('validUntilDate', formData.validUntilDate);
    }
    submitData.append('position', formData.position || '');
    submitData.append('isActive', formData.isActive.toString());
    
    if (photoFile) {
      submitData.append('photo', photoFile);
    }

    employeeMutation.mutate(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Fill in the employee details below to create a new employee record and generate their QR verification code.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Employee Photo</Label>
            <div className="flex items-center space-x-6">
              <div className="shrink-0">
                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-gray-300">
                  {photoPreview ? (
                    <img className="h-full w-full object-cover" src={photoPreview} alt="Preview" />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Photo</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
              />
            </div>



            {/* Employee ID */}
            <div>
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="MCS-2024-XXX"
              />
            </div>

            {/* DBS Number */}
            <div>
              <Label htmlFor="dbsNumber">DBS Number *</Label>
              <Input
                id="dbsNumber"
                required
                value={formData.dbsNumber}
                onChange={(e) => setFormData({ ...formData, dbsNumber: e.target.value })}
                placeholder="Enter DBS number"
              />
            </div>

            {/* Employment Type */}
            <div>
              <Label htmlFor="employmentType">Employment Type *</Label>
              <select
                id="employmentType"
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="permanent">Permanent Staff</option>
                <option value="temporary">Temporary Staff</option>
              </select>
            </div>

            {/* Valid Until Date - Only for temporary staff */}
            {formData.employmentType === "temporary" && (
              <div>
                <Label htmlFor="validUntilDate">Valid Employment Until *</Label>
                <Input
                  id="validUntilDate"
                  type="date"
                  required
                  value={formData.validUntilDate}
                  onChange={(e) => setFormData({ ...formData, validUntilDate: e.target.value })}
                />
              </div>
            )}

            {/* DBS Expiry Date */}
            <div>
              <Label htmlFor="dbsExpiryDate">DBS Expiry Date</Label>
              <Input
                id="dbsExpiryDate"
                type="date"
                value={formData.dbsExpiryDate}
                onChange={(e) => setFormData({ ...formData, dbsExpiryDate: e.target.value })}
              />
            </div>

            {/* Start Date */}
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            {/* Position */}
            <div>
              <Label htmlFor="position">Position</Label>
              <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cleaner">Cleaner</SelectItem>
                  <SelectItem value="Cover Cleaner">Cover Cleaner</SelectItem>
                  <SelectItem value="Maintenance Technician">Maintenance Technician</SelectItem>
                  <SelectItem value="Team Leader">Team Leader</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Managing Director">Managing Director</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Initial Status</Label>
            <RadioGroup 
              value={formData.isActive.toString()} 
              onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="active" />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="inactive" />
                <Label htmlFor="inactive">Inactive</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Suspension Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isSuspended"
              checked={formData.isSuspended}
              onCheckedChange={(checked) => setFormData({ ...formData, isSuspended: checked === true })}
            />
            <Label htmlFor="isSuspended" className="text-sm font-medium text-gray-700">
              Employee is currently suspended
            </Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={employeeMutation.isPending} className="bg-green-600 hover:bg-green-700">
              {employeeMutation.isPending ? (
                selectedEmployee ? "Updating..." : "Adding..."
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {selectedEmployee ? "Update Employee" : "Add Employee & Generate QR"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
