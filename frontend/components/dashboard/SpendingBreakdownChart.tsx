'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { DollarSign } from 'lucide-react';

const spendingData = [
  { category: 'Residential', current: 8500, previous: 7200 },
  { category: 'Commercial', current: 12400, previous: 10800 },
  { category: 'Deep Clean', current: 5600, previous: 4900 },
  { category: 'Window', current: 3200, previous: 2800 },
  { category: 'Upholstery', current: 2100, previous: 1800 },
  { category: 'Maintenance', current: 4800, previous: 4500 }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-lg shadow-lg border"
        style={{
          backgroundColor: 'var(--md-surface)',
          borderColor: 'var(--md-divider)',
          boxShadow: 'var(--md-elevation-2)'
        }}
      >
        <p className="font-medium text-sm mb-2" style={{ color: 'var(--md-on-surface)' }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: ${entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function SpendingBreakdownChart() {
  return (
    <div
      className="bg-white rounded-xl p-6"
      style={{
        backgroundColor: 'var(--md-surface)',
        borderRadius: 'var(--md-radius-lg)',
        boxShadow: 'var(--md-elevation-1)',
        padding: 'var(--md-space-6)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 
            className="text-lg font-semibold mb-1"
            style={{ 
              color: 'var(--md-on-surface)',
              fontFamily: 'var(--md-font-display)'
            }}
          >
            Spending Breakdown
          </h3>
          <p 
            className="text-sm"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            Revenue by service category comparison
          </p>
        </div>
        
        {/* Export button */}
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
          style={{
            backgroundColor: 'var(--md-surface)',
            borderColor: 'var(--md-divider)',
            color: 'var(--md-on-surface)'
          }}
        >
          Export
        </button>
      </div>

      {/* Chart */}
      <div className="h-80 min-h-80">
        <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320}>
          <BarChart 
            data={spendingData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="var(--md-divider)"
              horizontal={true}
              vertical={false}
            />
            
            <XAxis 
              dataKey="category" 
              tick={{ fill: 'var(--md-on-surface-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            
            <YAxis 
              tick={{ fill: 'var(--md-on-surface-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              wrapperStyle={{
                paddingTop: '20px'
              }}
              iconType="rect"
            />
            
            <Bar
              dataKey="current"
              fill="var(--md-primary-500)"
              name="Current Period"
              radius={[4, 4, 0, 0]}
            />
            
            <Bar
              dataKey="previous"
              fill="var(--md-primary-200)"
              name="Previous Period"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t" style={{ borderColor: 'var(--md-divider)' }}>
        <div className="text-center">
          <p 
            className="text-2xl font-bold"
            style={{ color: 'var(--md-on-surface)' }}
          >
            $36,600
          </p>
          <p 
            className="text-xs"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            Total Current
          </p>
        </div>
        <div className="text-center">
          <p 
            className="text-2xl font-bold"
            style={{ color: 'var(--md-success)' }}
          >
            +18.5%
          </p>
          <p 
            className="text-xs"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            Growth Rate
          </p>
        </div>
        <div className="text-center">
          <p 
            className="text-2xl font-bold"
            style={{ color: 'var(--md-primary-600)' }}
          >
            Commercial
          </p>
          <p 
            className="text-xs"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            Top Category
          </p>
        </div>
      </div>
    </div>
  );
}
