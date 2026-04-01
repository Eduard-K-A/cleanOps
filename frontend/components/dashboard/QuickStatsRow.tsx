'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { TrendingUp, Star, Users } from 'lucide-react';

// Sparkline data for top job category
const sparklineData = [
  { value: 12 },
  { value: 19 },
  { value: 15 },
  { value: 25 },
  { value: 22 },
  { value: 30 },
  { value: 28 },
  { value: 35 },
  { value: 32 },
  { value: 38 },
  { value: 42 },
  { value: 45 }
];

// Gauge data for client satisfaction
const satisfactionData = [
  { name: 'Satisfied', value: 92, fill: 'var(--md-success)' },
  { name: 'Remaining', value: 8, fill: 'var(--md-divider)' }
];

// Bar data for open applications
const applicationsData = [
  { status: 'Pending', count: 12, fill: 'var(--md-warning)' },
  { status: 'Reviewing', count: 8, fill: 'var(--md-primary-500)' },
  { status: 'Approved', count: 15, fill: 'var(--md-success)' },
  { status: 'Rejected', count: 3, fill: 'var(--md-error)' }
];

export function QuickStatsRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Top Job Category - Sparkline */}
      <div
        className="bg-white rounded-xl p-6"
        style={{
          backgroundColor: 'var(--md-surface)',
          borderRadius: 'var(--md-radius-lg)',
          boxShadow: 'var(--md-elevation-1)',
          padding: 'var(--md-space-6)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp 
              size={20} 
              style={{ color: 'var(--md-primary-500)' }}
            />
            <h4 
              className="font-semibold text-sm"
              style={{ color: 'var(--md-on-surface)' }}
            >
              Top Category
            </h4>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <p 
              className="text-2xl font-bold"
              style={{ color: 'var(--md-on-surface)' }}
            >
              Commercial
            </p>
            <p 
              className="text-xs"
              style={{ color: 'var(--md-on-surface-muted)' }}
            >
              +45% this month
            </p>
          </div>
          
          {/* Sparkline chart */}
          <div className="h-16 min-h-16">
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={64}>
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--md-primary-500)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Client Satisfaction - Gauge */}
      <div
        className="bg-white rounded-xl p-6"
        style={{
          backgroundColor: 'var(--md-surface)',
          borderRadius: 'var(--md-radius-lg)',
          boxShadow: 'var(--md-elevation-1)',
          padding: 'var(--md-space-6)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star 
              size={20} 
              style={{ color: 'var(--md-warning)' }}
            />
            <h4 
              className="font-semibold text-sm"
              style={{ color: 'var(--md-on-surface)' }}
            >
              Client Satisfaction
            </h4>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="text-center">
            <p 
              className="text-3xl font-bold"
              style={{ color: 'var(--md-on-surface)' }}
            >
              92%
            </p>
            <p 
              className="text-xs"
              style={{ color: 'var(--md-on-surface-muted)' }}
            >
              4.6/5.0 average rating
            </p>
          </div>
          
          {/* Gauge chart */}
          <div className="h-16 min-h-16">
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={64}>
              <PieChart>
                <Pie
                  data={satisfactionData}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={25}
                  outerRadius={40}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {satisfactionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Open Applications - Horizontal Bars */}
      <div
        className="bg-white rounded-xl p-6"
        style={{
          backgroundColor: 'var(--md-surface)',
          borderRadius: 'var(--md-radius-lg)',
          boxShadow: 'var(--md-elevation-1)',
          padding: 'var(--md-space-6)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users 
              size={20} 
              style={{ color: 'var(--md-info)' }}
            />
            <h4 
              className="font-semibold text-sm"
              style={{ color: 'var(--md-on-surface)' }}
            >
              Open Applications
            </h4>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <p 
              className="text-2xl font-bold"
              style={{ color: 'var(--md-on-surface)' }}
            >
              38
            </p>
            <p 
              className="text-xs"
              style={{ color: 'var(--md-on-surface-muted)' }}
            >
              Total applications
            </p>
          </div>
          
          {/* Horizontal bar chart */}
          <div className="space-y-2">
            {applicationsData.map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <span 
                  className="text-xs w-16"
                  style={{ color: 'var(--md-on-surface-muted)' }}
                >
                  {item.status}
                </span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.count / 15) * 100}%`,
                      backgroundColor: item.fill
                    }}
                  />
                </div>
                <span 
                  className="text-xs font-medium w-6 text-right"
                  style={{ color: 'var(--md-on-surface)' }}
                >
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
