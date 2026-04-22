import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface DataPoint {
  time: string;
  positive: number;
  negative: number;
  modeSwitch?: { mode: string };
  keywords?: string[];
}

export function SentimentFlowChart() {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  // Mock data - 방송 시작부터 현재까지
  const data: DataPoint[] = [
    { time: '14:00', positive: 45, negative: 55 },
    { time: '14:05', positive: 52, negative: 48 },
    { time: '14:10', positive: 48, negative: 52 },
    { time: '14:15', positive: 65, negative: 35, modeSwitch: { mode: 'support' }, keywords: ['잘한다', '멋지다', '화이팅'] },
    { time: '14:20', positive: 70, negative: 30 },
    { time: '14:25', positive: 68, negative: 32 },
    { time: '14:30', positive: 38, negative: 62, modeSwitch: { mode: 'criticism' }, keywords: ['아쉽다', '실수', '다시'] },
    { time: '14:35', positive: 42, negative: 58 },
    { time: '14:40', positive: 58, negative: 42 },
    { time: '14:45', positive: 73, negative: 27, modeSwitch: { mode: 'support' }, keywords: ['오', '대박', '완벽'] },
    { time: '14:50', positive: 75, negative: 25 },
    { time: '14:55', positive: 73, negative: 27 },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as DataPoint;
      
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-slate-400 mb-2">{dataPoint.time}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-blue-400">긍정</span>
              <span className="text-sm font-bold text-blue-400">{dataPoint.positive}%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-red-400">부정</span>
              <span className="text-sm font-bold text-red-400">{dataPoint.negative}%</span>
            </div>
          </div>
          
          {dataPoint.keywords && dataPoint.keywords.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-400 mb-1">주요 키워드</p>
              <div className="flex flex-wrap gap-1">
                {dataPoint.keywords.map((keyword, idx) => (
                  <span key={idx} className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const modeSwitchPoints = data.filter(d => d.modeSwitch);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold text-lg">감정 흐름 그래프</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-slate-400">긍정</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-slate-400">부정</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-4 bg-white/50" />
            <span className="text-slate-400">모드 전환</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="time" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* 모드 전환 시점 수직선 */}
            {modeSwitchPoints.map((point, idx) => (
              <ReferenceLine
                key={idx}
                x={point.time}
                stroke="#ffffff50"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            ))}

            <Line
              type="monotone"
              dataKey="positive"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="negative"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* 모드 전환 아이콘 표시 */}
        {modeSwitchPoints.map((point, idx) => {
          const dataIndex = data.findIndex(d => d.time === point.time);
          const xPosition = (dataIndex / (data.length - 1)) * 100;
          
          return (
            <div
              key={idx}
              className="absolute top-0 transform -translate-x-1/2"
              style={{ left: `${xPosition}%` }}
            >
              <div className={`w-2 h-2 rounded-full shadow-lg ${
                point.modeSwitch?.mode === 'support' ? 'bg-blue-500' : 'bg-red-500'
              }`} />
            </div>
          );
        })}
      </div>

      {/* 하단 통계 */}
      <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">평균 긍정도</p>
          <p className="text-lg font-semibold text-blue-400">
            {Math.round(data.reduce((sum, d) => sum + d.positive, 0) / data.length)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">모드 전환</p>
          <p className="text-lg font-semibold text-purple-400">{modeSwitchPoints.length}회</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">방송 시간</p>
          <p className="text-lg font-semibold text-white">55분</p>
        </div>
      </div>
    </div>
  );
}