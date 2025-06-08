// src/components/reports/AudienceChart.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type AudienceChartProps = {
  data: {
    ageRanges: Array<{ range: string; percentage: number }>;
    gender: {
      male: number;
      female: number;
      other: number;
    };
  };
  height?: number;
};

export default function AudienceChart({ data, height = 300 }: AudienceChartProps) {
  const ageChartRef = useRef<HTMLCanvasElement>(null);
  const genderChartRef = useRef<HTMLCanvasElement>(null);
  const ageChartInstance = useRef<Chart | null>(null);
  const genderChartInstance = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (ageChartRef.current && genderChartRef.current) {
      // Destroy existing charts
      if (ageChartInstance.current) {
        ageChartInstance.current.destroy();
      }
      if (genderChartInstance.current) {
        genderChartInstance.current.destroy();
      }
      
      // Create age distribution chart
      const ageCtx = ageChartRef.current.getContext('2d');
      if (ageCtx) {
        ageChartInstance.current = new Chart(ageCtx, {
          type: 'bar',
          data: {
            labels: data.ageRanges.map(age => age.range),
            datasets: [
              {
                label: 'Percentage',
                data: data.ageRanges.map(age => age.percentage),
                backgroundColor: [
                  'rgba(99, 102, 241, 0.7)',
                  'rgba(168, 85, 247, 0.7)',
                  'rgba(236, 72, 153, 0.7)',
                  'rgba(245, 101, 101, 0.7)',
                  'rgba(251, 146, 60, 0.7)',
                  'rgba(34, 197, 94, 0.7)'
                ],
                borderColor: [
                  'rgb(99, 102, 241)',
                  'rgb(168, 85, 247)',
                  'rgb(236, 72, 153)',
                  'rgb(245, 101, 101)',
                  'rgb(251, 146, 60)',
                  'rgb(34, 197, 94)'
                ],
                borderWidth: 2,
                borderRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              title: {
                display: true,
                text: 'Age Distribution',
                font: {
                  size: 16,
                  weight: 'bold'
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Percentage (%)',
                  font: {
                    weight: 'bold'
                  }
                },
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
      
      // Create gender distribution chart
      const genderCtx = genderChartRef.current.getContext('2d');
      if (genderCtx) {
        genderChartInstance.current = new Chart(genderCtx, {
          type: 'doughnut',
          data: {
            labels: ['Male', 'Female', 'Other'],
            datasets: [
              {
                data: [data.gender.male, data.gender.female, data.gender.other],
                backgroundColor: [
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(236, 72, 153, 0.8)',
                  'rgba(168, 85, 247, 0.8)'
                ],
                borderColor: [
                  'rgb(59, 130, 246)',
                  'rgb(236, 72, 153)',
                  'rgb(168, 85, 247)'
                ],
                borderWidth: 2,
                hoverBackgroundColor: [
                  'rgba(59, 130, 246, 1)',
                  'rgba(236, 72, 153, 1)',
                  'rgba(168, 85, 247, 1)'
                ]
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  padding: 20
                }
              },
              title: {
                display: true,
                text: 'Gender Distribution',
                font: {
                  size: 16,
                  weight: 'bold'
                }
              }
            },
            cutout: '60%'
          }
        });
      }
    }
    
    return () => {
      // Clean up
      if (ageChartInstance.current) {
        ageChartInstance.current.destroy();
      }
      if (genderChartInstance.current) {
        genderChartInstance.current.destroy();
      }
    };
  }, [data]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div style={{ height: `${height}px` }}>
          <canvas ref={ageChartRef}></canvas>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div style={{ height: `${height}px` }}>
          <canvas ref={genderChartRef}></canvas>
        </div>
      </div>
    </div>
  );
}