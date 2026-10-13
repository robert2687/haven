import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import {
  Calendar,
  Filter,
  Info,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Maximize2,
  Activity,
} from 'lucide-react';
import { MoodIntelligence } from '../types';

export interface MoodDataPoint {
  date: Date;
  dateStr: string;
  shortDate: string;
  dayNumber: number;
  happiness: number;
  energy: number;
  stress: number;
  loneliness: number;
  motivation: number;
  event?: string;
}

export type MetricKey = 'happiness' | 'energy' | 'stress' | 'loneliness' | 'motivation';

export interface MetricConfig {
  key: MetricKey;
  label: string;
  emoji: string;
  color: string;
  strokeColor: string;
  bgBadge: string;
  gradientId: string;
}

export const METRIC_CONFIGS: Record<MetricKey, MetricConfig> = {
  happiness: {
    key: 'happiness',
    label: 'Happiness',
    emoji: '😊',
    color: '#f59e0b', // Amber-500
    strokeColor: '#fbbf24',
    bgBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    gradientId: 'grad-happiness',
  },
  energy: {
    key: 'energy',
    label: 'Energy',
    emoji: '⚡',
    color: '#06b6d4', // Cyan-500
    strokeColor: '#38bdf8',
    bgBadge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    gradientId: 'grad-energy',
  },
  stress: {
    key: 'stress',
    label: 'Stress',
    emoji: '🧠',
    color: '#f43f5e', // Rose-500
    strokeColor: '#fb7185',
    bgBadge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    gradientId: 'grad-stress',
  },
  loneliness: {
    key: 'loneliness',
    label: 'Loneliness',
    emoji: '😔',
    color: '#a855f7', // Purple-500
    strokeColor: '#c084fc',
    bgBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    gradientId: 'grad-loneliness',
  },
  motivation: {
    key: 'motivation',
    label: 'Motivation',
    emoji: '🔥',
    color: '#10b981', // Emerald-500
    strokeColor: '#34d399',
    bgBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    gradientId: 'grad-motivation',
  },
};

// Generate realistic 30-day emotional journey anchored by currentMood at day 30 (today)
export function generate30DayMoodData(currentMood: MoodIntelligence): MoodDataPoint[] {
  const points: MoodDataPoint[] = [];
  const now = new Date();
  
  // Historical narrative milestones over the past 30 days
  const milestones: Record<number, string> = {
    3: 'Defined Q4 roadmap & vision',
    9: 'Beta architecture bottleneck',
    14: 'Late night coding sprint; fatigue spike',
    19: 'Reconnected with Maya; morning run',
    23: 'First 20 beta users signed up',
    27: 'Weekend nature walk with Barnaby',
    30: 'Active calibration today',
  };

  // Base narrative curves leading to today's values
  // Day 1 is 29 days ago, Day 30 is today
  for (let i = 0; i < 30; i++) {
    const dayNumber = i + 1;
    const date = new Date(now);
    date.setDate(now.getDate() - (29 - i));
    
    // Normalized position 0 to 1
    const t = i / 29;

    let happiness: number;
    let energy: number;
    let stress: number;
    let loneliness: number;
    let motivation: number;

    if (i === 29) {
      // Day 30 is current active live calibrated mood
      happiness = currentMood.happiness;
      energy = currentMood.energy;
      stress = currentMood.stress;
      loneliness = currentMood.loneliness;
      motivation = currentMood.motivation;
    } else {
      // Mid-month dip around day 12-16 (launch pressure)
      const midPressure = Math.sin((i / 29) * Math.PI);
      const waveA = Math.sin(i * 0.45);
      const waveB = Math.cos(i * 0.3);

      happiness = Math.round(
        Math.min(100, Math.max(25, 68 + waveA * 8 - (midPressure * 12) + (t * (currentMood.happiness - 65))))
      );

      energy = Math.round(
        Math.min(100, Math.max(20, 62 + waveB * 10 - (midPressure * 14) + (t * (currentMood.energy - 60))))
      );

      stress = Math.round(
        Math.min(100, Math.max(15, 45 + (midPressure * 26) + waveA * 5 + (t * (currentMood.stress - 50))))
      );

      loneliness = Math.round(
        Math.min(100, Math.max(10, 38 + (midPressure * 18) - waveB * 4 + (t * (currentMood.loneliness - 40))))
      );

      motivation = Math.round(
        Math.min(100, Math.max(30, 75 + waveA * 7 + (t * (currentMood.motivation - 70))))
      );
    }

    const shortDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    points.push({
      date,
      dateStr,
      shortDate: i === 29 ? 'Today' : shortDate,
      dayNumber,
      happiness,
      energy,
      stress,
      loneliness,
      motivation,
      event: milestones[dayNumber],
    });
  }

  return points;
}

interface MoodTrendChartProps {
  currentMood: MoodIntelligence;
  onSelectDataPoint?: (point: MoodDataPoint) => void;
}

export const MoodTrendChart: React.FC<MoodTrendChartProps> = ({
  currentMood,
  onSelectDataPoint,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(560);
  const [timeRange, setTimeRange] = useState<'30' | '14' | '7'>('30');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Active metrics toggle
  const [activeMetrics, setActiveMetrics] = useState<Record<MetricKey, boolean>>({
    happiness: true,
    energy: true,
    stress: true,
    loneliness: true,
    motivation: true,
  });

  // Highlight specific single metric (null = normal multi view)
  const [focusedMetric, setFocusedMetric] = useState<MetricKey | null>(null);

  // Full 30-day dataset
  const allData = useMemo(() => {
    return generate30DayMoodData(currentMood);
  }, [currentMood]);

  // Filtered dataset based on selected time range
  const visibleData = useMemo(() => {
    const days = parseInt(timeRange, 10);
    return allData.slice(30 - days);
  }, [allData, timeRange]);

  // Container resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Dimensions
  const height = 240;
  const margin = { top: 16, right: 24, bottom: 28, left: 34 };
  const innerWidth = Math.max(100, containerWidth - margin.left - margin.right);
  const innerHeight = Math.max(50, height - margin.top - margin.bottom);

  // D3 Scales
  const { xScale, yScale, lineGenerators, areaGenerators } = useMemo(() => {
    const x = d3
      .scaleTime()
      .domain(d3.extent(visibleData, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    const lines: Partial<Record<MetricKey, d3.Line<MoodDataPoint>>> = {};
    const areas: Partial<Record<MetricKey, d3.Area<MoodDataPoint>>> = {};

    (['happiness', 'energy', 'stress', 'loneliness', 'motivation'] as MetricKey[]).forEach(
      (key) => {
        lines[key] = d3
          .line<MoodDataPoint>()
          .x((d) => x(d.date))
          .y((d) => y(d[key]))
          .curve(d3.curveMonotoneX);

        areas[key] = d3
          .area<MoodDataPoint>()
          .x((d) => x(d.date))
          .y0(innerHeight)
          .y1((d) => y(d[key]))
          .curve(d3.curveMonotoneX);
      }
    );

    return { xScale: x, yScale: y, lineGenerators: lines, areaGenerators: areas };
  }, [visibleData, innerWidth, innerHeight]);

  // Y-axis ticks (0, 25, 50, 75, 100)
  const yTicks = [0, 25, 50, 75, 100];

  // X-axis ticks (approx 5 to 6 ticks nicely spaced)
  const xTicks = useMemo(() => {
    if (visibleData.length <= 7) return visibleData;
    const step = Math.ceil(visibleData.length / 5);
    const sampled: MoodDataPoint[] = [];
    for (let i = 0; i < visibleData.length; i += step) {
      sampled.push(visibleData[i]);
    }
    // Always include the last point (Today)
    if (sampled[sampled.length - 1] !== visibleData[visibleData.length - 1]) {
      sampled.push(visibleData[visibleData.length - 1]);
    }
    return sampled;
  }, [visibleData]);

  // Handle pointer scrub
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - margin.left;
    if (mouseX < 0 || mouseX > innerWidth) {
      setHoveredIndex(null);
      return;
    }

    const hoveredDate = xScale.invert(mouseX);
    const bisect = d3.bisector<MoodDataPoint, Date>((d) => d.date).center;
    const index = bisect(visibleData, hoveredDate);
    if (index >= 0 && index < visibleData.length) {
      setHoveredIndex(index);
      if (onSelectDataPoint) {
        onSelectDataPoint(visibleData[index]);
      }
    }
  };

  const handlePointerLeave = () => {
    setHoveredIndex(null);
  };

  const activeHoveredPoint = hoveredIndex !== null ? visibleData[hoveredIndex] : null;

  // Toggle metric
  const toggleMetric = (key: MetricKey) => {
    setActiveMetrics((prev) => {
      // Ensure at least one remains active
      const next = { ...prev, [key]: !prev[key] };
      const activeCount = Object.values(next).filter(Boolean).length;
      if (activeCount === 0) return prev;
      return next;
    });
    if (focusedMetric === key) {
      setFocusedMetric(null);
    }
  };

  const soloMetric = (key: MetricKey) => {
    if (focusedMetric === key) {
      setFocusedMetric(null);
      setActiveMetrics({
        happiness: true,
        energy: true,
        stress: true,
        loneliness: true,
        motivation: true,
      });
    } else {
      setFocusedMetric(key);
      setActiveMetrics({
        happiness: key === 'happiness',
        energy: key === 'energy',
        stress: key === 'stress',
        loneliness: key === 'loneliness',
        motivation: key === 'motivation',
      });
    }
  };

  // 30-Day trend calculation (Delta from first day to last day)
  const trendDeltas = useMemo(() => {
    const first = visibleData[0];
    const last = visibleData[visibleData.length - 1];
    return {
      happiness: last.happiness - first.happiness,
      energy: last.energy - first.energy,
      stress: last.stress - first.stress,
      loneliness: last.loneliness - first.loneliness,
      motivation: last.motivation - first.motivation,
    };
  }, [visibleData]);

  // Overall emotional balance summary
  const summaryStatus = useMemo(() => {
    const avgStress = Math.round(
      visibleData.reduce((acc, p) => acc + p.stress, 0) / visibleData.length
    );
    const avgHappiness = Math.round(
      visibleData.reduce((acc, p) => acc + p.happiness, 0) / visibleData.length
    );
    if (trendDeltas.stress < -5 && trendDeltas.happiness > 0) {
      return {
        headline: 'Positive Emotional Recovery',
        subtext: `Stress decreased by ${Math.abs(trendDeltas.stress)}% while happiness increased +${trendDeltas.happiness}% over ${timeRange} days.`,
        positive: true,
      };
    } else if (trendDeltas.motivation > 5) {
      return {
        headline: 'Strong Motivation Momentum',
        subtext: `Drive & momentum sustained with peak energy over the period.`,
        positive: true,
      };
    }
    return {
      headline: 'Balanced Emotional Trajectory',
      subtext: `Average Happiness at ${avgHappiness}% with manageable baseline stress (${avgStress}%).`,
      positive: true,
    };
  }, [visibleData, trendDeltas, timeRange]);

  return (
    <div className="space-y-3.5">
      {/* Header Bar with Time Range & Focus Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>30-Day Emotional Trends</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
            D3.js
          </span>
        </div>

        {/* Range Selector */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-[11px]">
          {(['7', '14', '30'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                timeRange === r
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === '30' ? 'Last 30 Days' : `${r} Days`}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Filter Badges */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {(Object.keys(METRIC_CONFIGS) as MetricKey[]).map((key) => {
          const cfg = METRIC_CONFIGS[key];
          const isActive = activeMetrics[key];
          const isSolo = focusedMetric === key;

          return (
            <div
              key={key}
              className={`group flex items-center rounded-xl border text-xs transition-all ${
                isActive
                  ? 'bg-slate-800/90 border-slate-700 text-slate-200 shadow-xs'
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-60'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleMetric(key)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium"
              >
                <span
                  className="w-2 h-2 rounded-full transition-transform group-hover:scale-125"
                  style={{ backgroundColor: cfg.color }}
                />
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </button>

              <button
                type="button"
                title={`Focus only on ${cfg.label}`}
                onClick={() => soloMetric(key)}
                className={`px-1.5 py-1 text-[10px] rounded-r-xl border-l border-slate-700/50 hover:bg-slate-700/50 transition-colors ${
                  isSolo ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-400'
                }`}
              >
                {isSolo ? 'All' : 'Solo'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Chart SVG Container */}
      <div
        ref={containerRef}
        className="relative w-full bg-slate-950/70 border border-slate-800/90 rounded-2xl p-2.5 overflow-hidden shadow-inner select-none"
      >
        <svg
          width={containerWidth}
          height={height}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="overflow-visible cursor-crosshair touch-none"
        >
          <defs>
            {/* Metric Area Gradients */}
            {(Object.keys(METRIC_CONFIGS) as MetricKey[]).map((key) => {
              const cfg = METRIC_CONFIGS[key];
              return (
                <linearGradient
                  key={cfg.gradientId}
                  id={cfg.gradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={cfg.color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity="0.01" />
                </linearGradient>
              );
            })}
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Horizontal Gridlines */}
            {yTicks.map((tick) => {
              const yPos = yScale(tick);
              return (
                <g key={`grid-y-${tick}`}>
                  <line
                    x1={0}
                    x2={innerWidth}
                    y1={yPos}
                    y2={yPos}
                    stroke="rgba(148, 163, 184, 0.12)"
                    strokeDasharray={tick === 0 || tick === 100 ? 'none' : '3 3'}
                  />
                  <text
                    x={-8}
                    y={yPos + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-500 font-mono font-medium"
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}

            {/* X-axis tick labels */}
            {xTicks.map((pt, idx) => {
              const xPos = xScale(pt.date);
              return (
                <g key={`grid-x-${pt.dayNumber}-${idx}`}>
                  <line
                    x1={xPos}
                    x2={xPos}
                    y1={innerHeight}
                    y2={innerHeight + 4}
                    stroke="rgba(148, 163, 184, 0.3)"
                  />
                  <text
                    x={xPos}
                    y={innerHeight + 16}
                    textAnchor={idx === 0 ? 'start' : idx === xTicks.length - 1 ? 'end' : 'middle'}
                    className="text-[9px] fill-slate-400 font-mono font-medium"
                  >
                    {pt.shortDate}
                  </text>
                </g>
              );
            })}

            {/* Metric Areas (only for solo or when active) */}
            {(Object.keys(METRIC_CONFIGS) as MetricKey[]).map((key) => {
              if (!activeMetrics[key]) return null;
              const areaFn = areaGenerators[key];
              const isOnly = focusedMetric === key;
              if (!areaFn) return null;
              return (
                <path
                  key={`area-${key}`}
                  d={areaFn(visibleData) || ''}
                  fill={`url(#${METRIC_CONFIGS[key].gradientId})`}
                  opacity={isOnly ? 1 : 0.4}
                  className="transition-opacity duration-300"
                />
              );
            })}

            {/* Metric Lines */}
            {(Object.keys(METRIC_CONFIGS) as MetricKey[]).map((key) => {
              if (!activeMetrics[key]) return null;
              const lineFn = lineGenerators[key];
              const cfg = METRIC_CONFIGS[key];
              const isOnly = focusedMetric === key;
              if (!lineFn) return null;

              return (
                <path
                  key={`line-${key}`}
                  d={lineFn(visibleData) || ''}
                  fill="none"
                  stroke={cfg.color}
                  strokeWidth={isOnly ? 3 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-200"
                  style={{
                    filter: isOnly ? `drop-shadow(0 0 4px ${cfg.color}88)` : 'none',
                  }}
                />
              );
            })}

            {/* Data point circles for end node (Today) */}
            {(Object.keys(METRIC_CONFIGS) as MetricKey[]).map((key) => {
              if (!activeMetrics[key]) return null;
              const lastPt = visibleData[visibleData.length - 1];
              const xPos = xScale(lastPt.date);
              const yPos = yScale(lastPt[key]);
              const cfg = METRIC_CONFIGS[key];

              return (
                <circle
                  key={`endpoint-${key}`}
                  cx={xPos}
                  cy={yPos}
                  r={3.5}
                  fill={cfg.color}
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />
              );
            })}

            {/* Interactive Vertical Guide Rule & Dots on Hover */}
            {activeHoveredPoint && (
              <g>
                {/* Vertical hairline */}
                <line
                  x1={xScale(activeHoveredPoint.date)}
                  x2={xScale(activeHoveredPoint.date)}
                  y1={0}
                  y2={innerHeight}
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />

                {/* Glowing circles on each metric curve at current date */}
                {(Object.keys(METRIC_CONFIGS) as MetricKey[]).map((key) => {
                  if (!activeMetrics[key]) return null;
                  const xPos = xScale(activeHoveredPoint.date);
                  const yPos = yScale(activeHoveredPoint[key]);
                  const cfg = METRIC_CONFIGS[key];

                  return (
                    <g key={`hover-dot-${key}`}>
                      <circle
                        cx={xPos}
                        cy={yPos}
                        r={6}
                        fill={cfg.color}
                        opacity={0.3}
                      />
                      <circle
                        cx={xPos}
                        cy={yPos}
                        r={4}
                        fill={cfg.color}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        </svg>

        {/* Floating Scrubber Tooltip */}
        {activeHoveredPoint && (
          <div
            className="absolute z-20 top-3 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-2xl text-xs space-y-1.5 transition-all duration-75"
            style={{
              left: Math.min(
                Math.max(12, margin.left + xScale(activeHoveredPoint.date) - 90),
                containerWidth - 190
              ),
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 gap-3">
              <span className="font-semibold text-slate-200 flex items-center gap-1 text-[11px]">
                <Calendar className="w-3 h-3 text-blue-400" />
                <span>{activeHoveredPoint.dateStr}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Day {activeHoveredPoint.dayNumber}/30
              </span>
            </div>

            {/* Milestone annotation if present */}
            {activeHoveredPoint.event && (
              <div className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                🎯 {activeHoveredPoint.event}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-0.5">
              {(Object.keys(METRIC_CONFIGS) as MetricKey[]).map((key) => {
                if (!activeMetrics[key]) return null;
                const cfg = METRIC_CONFIGS[key];
                return (
                  <div key={`tip-${key}`} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <span>{cfg.emoji}</span>
                      <span>{cfg.label}</span>
                    </span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: cfg.color }}
                    >
                      {activeHoveredPoint[key]}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 30-Day Trend Takeaway Insight */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/30 via-slate-900/80 to-slate-900 border border-blue-900/40 flex items-start gap-2.5">
        <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-xs">
          <div className="font-semibold text-white flex items-center gap-2">
            <span>{summaryStatus.headline}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-medium">
              30d Analysis
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {summaryStatus.subtext}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span>😊 Happiness:</span>
              <span className={trendDeltas.happiness >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {trendDeltas.happiness >= 0 ? `+${trendDeltas.happiness}%` : `${trendDeltas.happiness}%`}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span>🧠 Stress:</span>
              <span className={trendDeltas.stress <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {trendDeltas.stress >= 0 ? `+${trendDeltas.stress}%` : `${trendDeltas.stress}%`}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span>😔 Loneliness:</span>
              <span className={trendDeltas.loneliness <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {trendDeltas.loneliness >= 0 ? `+${trendDeltas.loneliness}%` : `${trendDeltas.loneliness}%`}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
