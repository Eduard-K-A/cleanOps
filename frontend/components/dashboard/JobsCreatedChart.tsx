'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Calendar } from 'lucide-react';

// Removed mock jobsData

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
        <p className="font-medium text-sm" style={{ color: 'var(--md-on-surface)' }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function JobsCreatedChart({ data }: { data?: any[] }) {
  if (!data) return null;
  
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
            Jobs Created Over Time
          </h3>
          <p 
            className="text-sm"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            Monthly job creation trends and revenue
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-slate-500">
           <Calendar className="w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 min-h-80">
        <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="jobsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--md-primary-500)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--md-primary-500)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="var(--md-divider)"
              horizontal={true}
              vertical={false}
            />
            
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'var(--md-on-surface-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            
            <YAxis 
              tick={{ fill: 'var(--md-on-surface-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--md-primary-500)"
              strokeWidth={2}
              fill="url(#jobsGradient)"
              name="Jobs Created"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'var(--md-primary-500)' }}
          />
          <span className="text-sm" style={{ color: 'var(--md-on-surface-muted)' }}>
            Jobs Created
          </span>
        </div>
      </div>
    </div>
  );
}
