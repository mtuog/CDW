import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomerGrowthChart = ({ data, period }) => {
  // Custom tooltip for customer growth chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          <p className="desc">{`Khách hàng mới: ${payload[0].value}`}</p>
          <p className="desc">{`Khách hàng hoạt động: ${payload[1].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-section">
      <div className="chart-container customer-chart">
        <div className="chart-header">
          <h2>Tăng trưởng khách hàng</h2>
          <div className="chart-period">
            {period === 'month' ? 'Theo tháng' : 'Theo tuần'}
          </div>
        </div>
        <div className="chart-content">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="newCustomers" 
                name="Khách hàng mới" 
                stackId="1" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="activeCustomers" 
                name="Khách hàng hoạt động" 
                stackId="2" 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style jsx>{`
        .chart-section {
          margin-bottom: 24px;
        }
        .chart-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          padding: 20px;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .chart-header h2 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
        .chart-period {
          font-size: 14px;
          color: #6c757d;
        }
        .custom-tooltip {
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 10px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .custom-tooltip .label {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .custom-tooltip .desc {
          margin: 0;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default CustomerGrowthChart; 