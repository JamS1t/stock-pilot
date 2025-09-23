
import React from 'react';

interface DashboardCardProps {
    icon: React.ElementType;
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon: Icon, title, value, change, changeType }) => {
    const changeColor = changeType === 'increase' ? 'text-green-400' : 'text-red-400';
    
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-white mt-2">{value}</p>
                <p className={`text-xs mt-2 ${changeColor}`}>{change}</p>
            </div>
            <div className="bg-gray-700/50 p-3 rounded-lg">
                <Icon className="w-6 h-6 text-sky-400" />
            </div>
        </div>
    );
};

export default DashboardCard;