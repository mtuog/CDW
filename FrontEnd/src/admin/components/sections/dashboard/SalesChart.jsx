import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SalesChart = ({ data, period, formatCurrency }) => {
  // Custom tooltip for revenue chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          <p className="desc">{`Doanh thu: ${formatCurrency(payload[0].value)}`}</p>
          <p className="desc">{`Đơn hàng: ${payload[1].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-section">
      <div className="chart-container revenue-chart">
        <div className="chart-header">
          <h2>Phân tích doanh thu</h2>
          <div className="chart-period">
            {period === 'month' ? 'Theo tháng' : 'Theo tuần'}
          </div>
        </div>
        <div className="chart-content">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="orders" name="Đơn hàng" fill="#82ca9d" />
            </BarChart>
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

export default SalesChart; 