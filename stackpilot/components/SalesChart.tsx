import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFormatters } from '../format';

interface SalesChartProps {
  data: { date: string; amount: number; profit: number }[];
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  const { formatCurrency } = useFormatters();

  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <LineChart
                data={data}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D6" />
                <XAxis dataKey="date" stroke="#E3E1D6" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#6B7268' }} />
                <YAxis
                    stroke="#E3E1D6"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#6B7268' }}
                    tickFormatter={(value) => `₱${Number(value).toLocaleString('en-US')}`}
                />
                <Tooltip
                    formatter={(value: number, name: string) => {
                        if (name === 'amount') {
                            return [formatCurrency(value), 'Benta'];
                        } else if (name === 'profit') {
                            return [formatCurrency(value), 'Kita'];
                        }
                        return [value, name];
                    }}
                    contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E3E1D6',
                        borderRadius: '0.75rem',
                        boxShadow: '0 12px 32px -12px rgba(14, 26, 22, 0.25)',
                    }}
                    labelStyle={{ color: '#0E1A16', fontWeight: 600 }}
                    itemStyle={{ color: '#16261F' }}
                />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="amount" stroke="#0B6E50" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                 <Line type="monotone" dataKey="profit" stroke="#1C5FD6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
