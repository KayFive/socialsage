// src/components/reports/ContentPerformanceChart.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type ContentPerformanceChartProps = {
  data: {
    types: string[];
    engagementRates: number[];
  };
  height?: number;
};

export default function ContentPerformanceChart({ data, height = 300 }: ContentPerformanceChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (chartRef.current && data.types.length > 0) {
      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      // Create new chart
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: data.types,
            datasets: [
              {
                label: 'Engagement Rate (%)',
                data: data.engagementRates,
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: 'rgb(79, 70, 229)',
                pointBackgroundColor: 'rgb(79, 70, 229)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(79, 70, 229)',
                borderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 7
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
                text: 'Content Type Performance',
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
              r: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)'
                },
                angleLines: {
                  color: 'rgba(0, 0, 0, 0.1)'
                },
                pointLabels: {
                  font: {
                    size: 12,
                    weight: 'bold'
                  },
                  color: 'rgb(75, 85, 99)'
                },
                ticks: {
                  backdropColor: 'transparent',
                  color: 'rgb(107, 114, 128)',
                  font: {
                    size: 10
                  }
                }
              }
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