// src/components/reports/GrowthChart.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type GrowthChartProps = {
  data: {
    dates: string[];
    followers: number[];
    posts: number[];
  };
  height?: number;
};

export default function GrowthChart({ data, height = 300 }: GrowthChartProps) {
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
                label: 'Followers',
                data: data.followers,
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: false,
                tension: 0.4,
                pointBackgroundColor: 'rgb(99, 102, 241)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                yAxisID: 'y'
              },
              {
                label: 'Posts',
                data: data.posts,
                borderColor: 'rgb(236, 72, 153)',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                fill: false,
                tension: 0.4,
                pointBackgroundColor: 'rgb(236, 72, 153)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                yAxisID: 'y1'
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
                text: 'Growth Trends Over Time',
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
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'Followers',
                  font: {
                    weight: 'bold'
                  },
                  color: 'rgb(99, 102, 241)'
                },
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                  color: 'rgb(99, 102, 241)'
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                  display: true,
                  text: 'Posts',
                  font: {
                    weight: 'bold'
                  },
                  color: 'rgb(236, 72, 153)'
                },
                grid: {
                  drawOnChartArea: false,
                },
                ticks: {
                  color: 'rgb(236, 72, 153)'
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