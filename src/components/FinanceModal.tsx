'use client';

import { useState } from 'react';
import { X, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Finance {
  id: string;
  month: string;
  year: number;
  expected_amount: number;
  actual_amount: number;
}

interface FinanceBreakdown {
  id: string;
  month: string;
  year: number;
  category: string;
  amount: number;
  color: string;
}

interface FinanceModalProps {
  finance: Finance;
  breakdowns: FinanceBreakdown[];
  onClose: () => void;
  onUpdate: () => void;
}

export default function FinanceModal({ finance, breakdowns, onClose, onUpdate }: FinanceModalProps) {
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetAmount, setTargetAmount] = useState(finance.expected_amount.toString());

  const difference = finance.actual_amount - finance.expected_amount;
  const differenceText = difference >= 0 ? `+£${difference}` : `-£${Math.abs(difference)}`;

  const handleTargetUpdate = async () => {
    try {
      const { error } = await supabase
        .from('finances')
        .update({ expected_amount: parseFloat(targetAmount) })
        .eq('id', finance.id);

      if (error) throw error;
      
      setIsEditingTarget(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating target:', error);
    }
  };

  const handleTargetClick = () => {
    setIsEditingTarget(true);
  };

  const handleBackClick = () => {
    if (isEditingTarget) {
      setIsEditingTarget(false);
    } else {
      onClose();
    }
  };

  // Calculate total for pie chart
  const total = breakdowns.reduce((sum, b) => sum + b.amount, 0);

  // Create pie chart segments
  const createPieChart = () => {
    let cumulativePercentage = 0;
    
    return breakdowns.map((breakdown) => {
      const percentage = (breakdown.amount / total) * 100;
      const startAngle = cumulativePercentage * 3.6; // Convert to degrees
      const endAngle = (cumulativePercentage + percentage) * 3.6;
      
      cumulativePercentage += percentage;
      
      return {
        ...breakdown,
        percentage,
        startAngle,
        endAngle
      };
    });
  };

  const pieSegments = createPieChart();

  if (isEditingTarget) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white w-full max-w-md mx-4 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <button onClick={handleBackClick} className="text-gray-600">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-semibold">{finance.month} {finance.year}</h2>
            <button onClick={onClose} className="text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Edit Target Form */}
          <div className="p-6">
            <div className="relative">
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full text-2xl font-semibold text-center border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="2600"
                autoFocus
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-semibold text-gray-500">
                £
              </div>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col">
                <button
                  onClick={() => setTargetAmount((prev) => (parseFloat(prev) + 100).toString())}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <ChevronUp size={20} />
                </button>
                <button
                  onClick={() => setTargetAmount((prev) => Math.max(0, parseFloat(prev) - 100).toString())}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleBackClick}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTargetUpdate}
                className="flex-1 px-4 py-2 bg-[#973b00] text-white rounded-lg hover:bg-[#7d3100]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md mx-4 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div></div>
          <h2 className="text-lg font-semibold">{finance.month} {finance.year}</h2>
          <button onClick={onClose} className="text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Target Section */}
        <div className="p-6">
          <div 
            className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2"
            onClick={handleTargetClick}
          >
            <h3 className="text-xl font-semibold mb-2">
              This Months Target: £{finance.expected_amount.toLocaleString()}
            </h3>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Difference: {differenceText}</span>
              <span className="text-xl font-semibold">£{finance.actual_amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div 
              className="bg-[#973b00] h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((finance.actual_amount / finance.expected_amount) * 100, 100)}%` }}
            ></div>
          </div>

          {/* Pie Chart */}
          {breakdowns.length > 0 && (
            <>
              <div className="flex justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Outer circle */}
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                    
                    {/* Pie segments */}
                    {pieSegments.map((segment, index) => {
                      const startAngle = (segment.startAngle - 90) * (Math.PI / 180);
                      const endAngle = (segment.endAngle - 90) * (Math.PI / 180);
                      
                      const x1 = 100 + 80 * Math.cos(startAngle);
                      const y1 = 100 + 80 * Math.sin(startAngle);
                      const x2 = 100 + 80 * Math.cos(endAngle);
                      const y2 = 100 + 80 * Math.sin(endAngle);
                      
                      const largeArcFlag = segment.percentage > 50 ? 1 : 0;
                      
                      return (
                        <path
                          key={index}
                          d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill={segment.color}
                        />
                      );
                    })}
                    
                    {/* Inner circle (donut hole) */}
                    <circle cx="100" cy="100" r="40" fill="white" />
                  </svg>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {breakdowns.map((breakdown) => (
                  <div key={breakdown.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-3"
                        style={{ backgroundColor: breakdown.color }}
                      ></div>
                      <span className="text-sm">{breakdown.category}</span>
                    </div>
                    <span className="text-sm font-medium">£{breakdown.amount}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
