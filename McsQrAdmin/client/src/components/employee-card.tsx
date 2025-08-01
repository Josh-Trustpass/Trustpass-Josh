import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Shield, Clock } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import type { Employee } from "@shared/schema";

interface EmployeeCardProps {
  employee: Employee;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  const [imageError, setImageError] = useState(false);
  const statusColor = employee.isActive ? 'bg-green-500' : 'bg-red-500';
  const statusText = employee.isActive ? 'Currently Employed' : 'No Longer Employed';
  const StatusIcon = employee.isActive ? CheckCircle : XCircle;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card className="overflow-hidden border-gray-200 shadow-lg">
      {/* Status Header */}
      <div className={`${statusColor} px-6 py-4`}>
        <div className="flex items-center justify-center space-x-2">
          <StatusIcon className="h-5 w-5 text-white" />
          <span className="text-white font-semibold text-lg">{statusText}</span>
        </div>
      </div>

      {/* Employee Photo */}
      <div className="px-6 pt-6 pb-4 text-center">
        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg">
          {employee.photoUrl && !imageError ? (
            <img
              src={employee.photoUrl}
              alt={employee.fullName}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-2xl font-semibold">
                {employee.fullName.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Employee Information */}
      <CardContent className="pb-6 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{employee.fullName}</h2>
          <p className="text-blue-600 font-medium">Trust Pass - Powered By MCS</p>
        </div>

        <div className="space-y-3">
          {/* Employee ID */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 font-medium">Employee ID:</span>
            <span className="font-semibold text-gray-900">{employee.employeeId}</span>
          </div>

          {/* DBS Number */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 font-medium">DBS Number:</span>
            <span className="font-semibold text-gray-900">{employee.dbsNumber}</span>
          </div>

          {/* Start Date */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 font-medium">Start Date:</span>
            <span className="font-semibold text-gray-900">
              {format(new Date(employee.startDate), 'dd MMM yyyy')}
            </span>
          </div>

          {/* Position */}
          {employee.position && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Position:</span>
              <span className="font-semibold text-gray-900">{employee.position}</span>
            </div>
          )}

          {/* Verification Date */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 font-medium">Verified:</span>
            <span className="font-semibold text-green-600">
              <Clock className="h-4 w-4 inline mr-1" />
              {format(new Date(), 'dd MMM yyyy, HH:mm')}
            </span>
          </div>
        </div>

        {/* Verification Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500 mb-2">This verification is valid for:</p>
          <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Verified by Trust Pass</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Scan QR code to verify employment status</p>
        </div>
      </CardContent>
    </Card>
  );
}
