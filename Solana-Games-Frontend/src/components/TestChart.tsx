import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const testData = [
    { name: 'A', value: 100 },
    { name: 'B', value: 200 },
    { name: 'C', value: 150 },
];

export const TestChart: React.FC = () => {
    return (
        <div style={{ width: '100%', height: '400px', background: '#1a1a1d', padding: '20px' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>TEST CHART - If you see a line chart below, Recharts works!</h2>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={testData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
