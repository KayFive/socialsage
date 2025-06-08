// src/components/reports/EngagementChart.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type EngagementChartProps = {
  data: {
    dates: string[];
    engagement: number[];
  };
  height?: number;
};

export default function EngagementChart({ data, height = 300 }: EngagementChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (chartRef.current && data.dates.length > 0) {
      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      // Create new chart
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.dates,
            datasets: [
              {
                label: 'Engagement Rate (%)',
                data: data.engagement,
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(79, 70, 229)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  usePointStyle: true,
                  padding: 20
                }
              },
              title: {
                display: true,
                text: 'Engagement Over Time',
                font: {
                  size: 16,
                  weight: 'bold'
                },
                padding: {
                  bottom: 20
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Engagement Rate (%)',
                  font: {
                    weight: 'bold'
                  }
                },
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Date',
                  font: {
                    weight: 'bold'
                  }
                },
                grid: {
                  display: false
                }
              }
            },
            interaction: {
              intersect: false,
              mode: 'index'
            }
          }
        });
      }
    }
    
    return () => {
      // Clean up
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div style={{ height: `${height}px` }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}