
import React from 'react';

interface DashboardCardProps {
    icon: React.ElementType;
    title: string;
    value: string;
    change?: string;
    changeType?: 'increase' | 'decrease' | 'neutral';
    valueTone?: 'money' | 'neutral';
}

const DashboardCard: React.FC<DashboardCardProps> = ({
    icon: Icon,
    title,
    value,
    change,
    changeType = 'neutral',
    valueTone = 'neutral',
}) => {
    const changeColor =
        changeType === 'increase'
            ? 'text-peso'
            : changeType === 'decrease'
                ? 'text-danger'
                : 'text-muted';

    return (
        <div className="card flex items-start justify-between p-4 lg:p-5">
            <div className="min-w-0">
                <p className="stat-label">{title}</p>
                <p className={`money mt-1 text-2xl font-bold tracking-tight lg:text-3xl ${valueTone === 'money' ? 'text-peso' : 'text-ink'}`}>{value}</p>
                {change && <p className={`mt-2 text-xs ${changeColor}`}>{change}</p>}
            </div>
            <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${valueTone === 'money' ? 'bg-peso-tint text-peso' : 'bg-sunken text-muted'}`}>
                <Icon className="h-5 w-5" />
            </span>
        </div>
    );
};

export default DashboardCard;
