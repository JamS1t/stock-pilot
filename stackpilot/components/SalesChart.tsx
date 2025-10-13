import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../format';

interface SalesChartProps {
  data: { date: string; amount: number; profit: number }[];
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <LineChart
                data={data}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                    stroke="#9CA3AF" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `₱${Number(value).toLocaleString('en-US')}`}
                />
                <Tooltip
                    formatter={(value: number, name: string) => {
                        if (name === 'amount') {
                            return [formatCurrency(value), 'Revenue'];
                        } else if (name === 'profit') {
                            return [formatCurrency(value), 'Profit'];
                        }
                        return [value, name];
                    }}
                    contentStyle={{
                        backgroundColor: '#1F2937', // gray-800
                        borderColor: '#4B5563' // gray-600
                    }}
                    labelStyle={{ color: '#F9FAFB' }} // gray-50
                />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="amount" stroke="#38BDF8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                 <Line type="monotone" dataKey="profit" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
