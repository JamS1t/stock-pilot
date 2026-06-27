
import React from 'react';

interface DashboardCardProps {
    icon: React.ElementType;
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon: Icon, title, value, change, changeType }) => {
    const changeColor = changeType === 'increase' ? 'text-peso' : 'text-danger';

    return (
        <div className="card flex items-start justify-between p-4 lg:p-5">
            <div className="min-w-0">
                <p className="stat-label">{title}</p>
                <p className="money mt-1 text-2xl font-bold tracking-tight text-peso lg:text-3xl">{value}</p>
                <p className={`mt-2 text-xs ${changeColor}`}>{change}</p>
            </div>
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-peso-tint text-peso">
                <Icon className="h-5 w-5" />
            </span>
        </div>
    );
};

export default DashboardCard;
