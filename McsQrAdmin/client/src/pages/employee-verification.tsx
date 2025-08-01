import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Shield, Phone, Mail, Clock, AlertCircle, Ban } from "lucide-react";
import { format } from "date-fns";

import mcsLogo from "@assets/MCS Logo High Quality No Background_1750938857010.png";
import trustPassLogo from "@assets/Trust Pass powered by mcs_1754044444109.png";

export default function EmployeeVerification() {
  const { employeeId } = useParams();

  const { data: employee, isLoading, error } = useQuery({
    queryKey: [`/api/employees/verify/${employeeId}`],
    enabled: !!employeeId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Not Found</h2>
                <p className="text-gray-600 mb-6">
                  The employee verification code could not be found or may have expired.
                </p>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-800">
                    Please check the QR code and try again, or contact Trust Pass support at joshua@trustpass.uk for assistance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if DBS is expired
  const isDbsExpired = (employee as any).dbsExpiryDate && new Date((employee as any).dbsExpiryDate) < new Date();
  
  // Determine status based on active state, suspension, and DBS validity
  let statusColor = 'bg-green-500';
  let statusText = 'Currently Employed';
  let statusIcon = CheckCircle;
  
  if ((employee as any).isSuspended) {
    statusColor = 'bg-red-500';
    statusText = 'Currently Suspended';
    statusIcon = Ban;
  } else if (!(employee as any).isActive) {
    statusColor = 'bg-red-500';
    statusText = 'No Longer Employed';
    statusIcon = XCircle;
  } else if (isDbsExpired) {
    statusColor = 'bg-red-500';
    statusText = 'Security Clearance Expired';
    statusIcon = AlertCircle;
  }
  
  const StatusIcon = statusIcon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        {/* MCS Logo Header */}
        <div className="text-center mb-6">
          <img 
            src="/attached_assets/MCS Logo High Quality No Background_1750938857010.png" 
            alt="MCS Cleaning & Maintenance Services" 
            className="h-20 mx-auto mb-2"
          />
          <h1 className="text-xl font-bold text-gray-800">Employee Verification</h1>
        </div>

        {/* Employee Verification Card */}
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
              {(employee as any).photoUrl ? (
                <img
                  src={(employee as any).photoUrl}
                  alt={(employee as any).fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-2xl font-semibold">
                    {(employee as any).fullName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Employee Information */}
          <CardContent className="pb-6 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">{(employee as any).fullName}</h2>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <img 
                  src="/attached_assets/MCS Logo High Quality No Background_1750938857010.png" 
                  alt="MCS Cleaning & Maintenance Services" 
                  className="h-8 w-auto"
                />
                <p className="text-green-600 font-medium">MCS Cleaning & Maintenance</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Employee ID */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Employee ID:</span>
                <span className="font-semibold text-gray-900">{(employee as any).employeeId}</span>
              </div>



              {/* Security Clearance Valid Until */}
              {(employee as any).dbsExpiryDate && (
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  isDbsExpired ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium">Security Clearance Valid Until:</span>
                    {isDbsExpired && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <span className={`font-semibold ${
                    isDbsExpired ? 'text-red-700' : 'text-gray-900'
                  }`}>
                    {isDbsExpired ? 'Expired' : format(new Date((employee as any).dbsExpiryDate), 'dd MMM yyyy')}
                  </span>
                </div>
              )}

              {/* Start Date */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Start Date:</span>
                <span className="font-semibold text-gray-900">
                  {format(new Date((employee as any).startDate), 'dd MMM yyyy')}
                </span>
              </div>

              {/* Position */}
              {(employee as any).position && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Position:</span>
                  <span className="font-semibold text-gray-900">{(employee as any).position}</span>
                </div>
              )}

              {/* Employment Type */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Employment Type:</span>
                <div className="flex flex-col items-end">
                  <span className={`font-semibold ${(employee as any).employmentType === 'permanent' ? 'text-blue-600' : 'text-orange-600'}`}>
                    {(employee as any).employmentType === 'permanent' ? 'Permanent Staff' : 'Temporary Staff'}
                  </span>
                  {(employee as any).employmentType === 'temporary' && (employee as any).validUntilDate && (
                    <span className="text-xs text-gray-500 mt-1">
                      Valid until: {format(new Date((employee as any).validUntilDate), 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>
              </div>

              {/* Verification Date */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Verified:</span>
                <span className="font-semibold text-green-600">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {format(new Date(), 'dd MMM yyyy, HH:mm')}
                </span>
              </div>
            </div>

            {/* Warning Messages */}
            {((employee as any).isSuspended || isDbsExpired) && (
              <div className="mt-4 space-y-3">
                {(employee as any).isSuspended && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Ban className="h-5 w-5 text-red-600" />
                      <div>
                        <h4 className="font-semibold text-red-800">Security Clearance Suspended</h4>
                        <p className="text-sm text-red-700">
                          This employee's security clearance is currently suspended. Contact Trust Pass management at joshua@trustpass.uk for details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isDbsExpired && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <h4 className="font-semibold text-red-800">Security Clearance Expired</h4>
                        <p className="text-sm text-red-700">
                          This employee currently has no valid security clearance. Employment verification may be restricted.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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

        {/* Contact Information */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                <AlertCircle className="h-4 w-4 inline mr-2 text-green-600" />
                Verification Support
              </h3>
              <img 
                src="/attached_assets/Trust Pass powered by mcs_1754044444109.png" 
                alt="Trust Pass - Powered by MCS" 
                className="h-6 w-auto"
              />
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <Phone className="h-4 w-4 inline mr-2 text-green-600" />
                Call: <a href="tel:01530382006" className="hover:underline">01530 382006</a>
              </p>
              <p>
                <Mail className="h-4 w-4 inline mr-2 text-green-600" />
                Email: <a href="mailto:joshua@trustpass.uk" className="hover:underline">joshua@trustpass.uk</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
