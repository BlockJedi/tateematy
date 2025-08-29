import React from 'react';
import { Users, ChevronDown } from 'lucide-react';

interface Child {
  _id: string;
  fullName: string;
  dateOfBirth: string;
  childId?: string;
}

interface ChildSelectorProps {
  children: Child[];
  selectedChild: Child | null;
  onChildSelect: (child: Child) => void;
}

const ChildSelector: React.FC<ChildSelectorProps> = ({ 
  children, 
  selectedChild, 
  onChildSelect 
}) => {
  if (children.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <Users className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
        <p className="text-yellow-800 font-medium">No children registered yet</p>
        <p className="text-yellow-600 text-sm">Add your first child to get started</p>
      </div>
    );
  }

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                        (today.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      if (months === 0) {
        return `${years} year${years !== 1 ? 's' : ''}`;
      } else {
        return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2 text-moh-green" />
          Select Child to View
        </h3>
        <span className="text-sm text-gray-500">
          {children.length} child{children.length !== 1 ? 'ren' : ''}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((child) => (
          <div
            key={child._id}
            onClick={() => onChildSelect(child)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
              selectedChild?._id === child._id
                ? 'border-moh-green bg-green-50 ring-2 ring-moh-green ring-offset-2'
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{child.fullName}</h4>
              {selectedChild?._id === child._id && (
                <div className="w-3 h-3 bg-moh-green rounded-full"></div>
              )}
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <p>Age: {calculateAge(child.dateOfBirth)}</p>
              {child.childId && (
                <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {child.childId}
                </p>
              )}
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {new Date(child.dateOfBirth).toLocaleDateString()}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${
                selectedChild?._id === child._id ? 'rotate-180' : ''
              }`} />
            </div>
          </div>
        ))}
      </div>
      
      {selectedChild && (
        <div className="mt-4 p-3 bg-moh-green/10 border border-moh-green/20 rounded-lg">
          <p className="text-sm text-moh-green-800">
            <strong>Selected:</strong> {selectedChild.fullName} ({calculateAge(selectedChild.dateOfBirth)})
          </p>
        </div>
      )}
    </div>
  );
};

export default ChildSelector;
