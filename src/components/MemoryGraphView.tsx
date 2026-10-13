import React, { useState } from 'react';
import {
  Network,
  Share2,
  Database,
  Cpu,
  User,
  Heart,
  Briefcase,
  Target,
  Sparkles,
  Send,
  Loader2,
  HelpCircle,
  ShieldCheck,
  Zap,
  Layers,
  Compass,
} from 'lucide-react';
import { MemoryGraphNode, DigitalTwinProfile } from '../types';

interface MemoryGraphViewProps {
  nodes: MemoryGraphNode[];
  digitalTwin: DigitalTwinProfile;
  userName: string;
  onUpdateDigitalTwin?: (dt: DigitalTwinProfile) => void;
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export const MemoryGraphView: React.FC<MemoryGraphViewProps> = ({
  nodes,
  digitalTwin,
  userName = 'Alex',
  onUpdateDigitalTwin,
  onOpenChatWithPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'digital-twin' | 'future-self'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-user');

  // Future self advisor state
  const [futureQuery, setFutureQuery] = useState('');
  const [isConsultingFuture, setIsConsultingFuture] = useState(false);
  const [latestFutureAdvice, setLatestFutureAdvice] = useState<{
    advice: string;
    keyInsight: string;
    action: string;
  } | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const handleAskFutureSelf = async (queryText?: string) => {
    const q = (queryText || futureQuery).trim();
    if (!q) return;

    setIsConsultingFuture(true);
    try {
      const res = await fetch('/api/future-self/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          digitalTwin,
          userName,
        }),
      });
      const data = await res.json();
      setLatestFutureAdvice({
        advice: data.futureSelfAdvice,
        keyInsight: data.keyInsight,
        action: data.actionRecommendation,
      });

      if (onUpdateDigitalTwin) {
        onUpdateDigitalTwin({
          ...digitalTwin,
          futureSelfAdviceHistory: [
            {
              id: `fa-${Date.now()}`,
              query: q,
              advice: data.futureSelfAdvice,
              timestamp: 'Just now',
            },
            ...digitalTwin.futureSelfAdviceHistory,
          ],
        });
      }
    } catch (err) {
      console.error('Future self call failed:', err);
    } finally {
      setIsConsultingFuture(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 max-w-5xl mx-auto w-full text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Network className="w-6 h-6 text-sky-400" />
              Memory Graph & Digital Twin
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-800/60 font-medium">
              GraphRAG & Cognitive Twin
            </span>
          </div>
          <p className="text-sm text-slate-400">
            A structured cognitive representation of your evolving life, relationships, decision patterns, and future self.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'graph' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Memory Graph
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('digital-twin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'digital-twin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Digital Twin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('future-self')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'future-self' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ask Future Self
          </button>
        </div>
      </div>

      {activeTab === 'graph' && (
        <div className="space-y-6">
          {/* Architecture Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-slate-200">Graph Architecture:</span>
              <span>Neo4j / FalkorDB · Mem0 Graph Engine · GraphRAG Semantic Indexing</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Graph Syncing
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Graph Explorer */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative min-h-[380px] flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Interactive Node Visualizer
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {nodes.length} Connected Entities
                </span>
              </div>

              {/* Graphical Node Map */}
              <div className="relative py-6 flex flex-col items-center justify-center gap-8">
                {/* Central Root Node (User) */}
                <button
                  type="button"
                  onClick={() => setSelectedNodeId('node-user')}
                  className={`relative z-10 px-6 py-3 rounded-2xl border font-bold text-sm transition-all shadow-xl ${
                    selectedNodeId === 'node-user'
                      ? 'bg-blue-600 border-blue-400 text-white scale-110 ring-4 ring-blue-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{userName} (Root Entity)</span>
                  </div>
                </button>

                {/* Satellite Nodes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                  {nodes
                    .filter((n) => n.id !== 'node-user')
                    .map((node) => {
                      const isSelected = node.id === selectedNodeId;
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-slate-800 border-sky-400 text-white ring-2 ring-sky-500/30 shadow-lg scale-105'
                              : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono uppercase text-sky-400 font-semibold">
                              {node.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {node.connections.length} edges
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-white truncate">
                            {node.label}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {node.details}
                          </p>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Hierarchy Tree Representation */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 font-mono text-[11px] text-slate-400 overflow-x-auto">
                <span className="text-slate-300 font-semibold block mb-1">Tree Topology:</span>
                <div>User</div>
                <div className="pl-4">├── Family (Sister Maya)</div>
                <div className="pl-4">├── Friends (David, Barnaby)</div>
                <div className="pl-4">├── Work (Startup venture, Beta launch)</div>
                <div className="pl-4">├── Goals (SaaS product, Sleep rhythm)</div>
                <div className="pl-4">├── Habits (Morning coffee, Afternoon walk)</div>
                <div className="pl-4">└── Projects (Haven OS, Sourdough)</div>
              </div>
            </div>

            {/* Selected Node Details Drawer */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Node Inspector
                </span>

                <h3 className="text-lg font-bold text-white mb-1">{selectedNode.label}</h3>
                <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 border border-slate-700">
                  Category: {selectedNode.category}
                </span>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block mb-1">
                      Entity Details:
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      {selectedNode.details}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-300 block mb-1">
                      Semantic Connections:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.connections.map((c) => (
                        <span
                          key={c}
                          className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {c.replace('node-', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {onOpenChatWithPrompt && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenChatWithPrompt(
                      `Let's explore my memory graph around "${selectedNode.label}". What insights or patterns do you notice about how it connects to my other goals?`
                    )
                  }
                  className="mt-6 w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  Query Memory in Chat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'digital-twin' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Digital Twin Overview */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              Digital Twin: AI Representation of You
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Haven builds an ongoing psychological and behavioral model of your strengths, decision patterns, and values to simulate long-term advice.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed mb-6 italic">
              "{digitalTwin.personalitySummary}"
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Values */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  Core Values
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {digitalTwin.coreValues.map((v, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Decision Patterns */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
                  Decision Patterns
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {digitalTwin.decisionPatterns.map((d, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Strengths */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                  Key Strengths
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {digitalTwin.strengths.map((s, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Growth Areas */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                  Growth Areas / Blindspots
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {digitalTwin.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'future-self' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              "What would my future self advise me to do?"
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Speaking with you from 2031, grounded in your core values, your triumphs over early startup doubt, and what truly mattered in retrospect.
            </p>

            {/* Quick dilemma suggestions */}
            <div className="mb-4">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Sample Dilemmas:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Should I polish the beta another week or ship it now?',
                  'Feeling exhausted from building alone. How did we push through?',
                  'Am I overthinking my life timeline?',
                ].map((sample, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setFutureQuery(sample);
                      handleAskFutureSelf(sample);
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors text-left"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>

            {/* Query Input */}
            <div className="space-y-3">
              <textarea
                rows={3}
                placeholder="Ask your future self anything about your current dilemma, fear, or crossroads..."
                value={futureQuery}
                onChange={(e) => setFutureQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <button
                type="button"
                onClick={() => handleAskFutureSelf()}
                disabled={isConsultingFuture || !futureQuery.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md disabled:opacity-50 transition-all"
              >
                {isConsultingFuture ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Channeling Future Self Perspective...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Ask Future Self</span>
                  </>
                )}
              </button>
            </div>

            {/* Response Card */}
            {latestFutureAdvice && (
              <div className="mt-6 p-5 rounded-2xl bg-blue-950/40 border border-blue-600/40 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Perspective from 2031 ({userName}'s Future Self):</span>
                </div>

                <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap font-sans">
                  {latestFutureAdvice.advice}
                </p>

                {latestFutureAdvice.keyInsight && (
                  <div className="pt-2 border-t border-blue-800/40 text-xs">
                    <span className="font-semibold text-blue-200">Key Insight: </span>
                    <span className="text-blue-100">{latestFutureAdvice.keyInsight}</span>
                  </div>
                )}

                {latestFutureAdvice.action && (
                  <div className="p-2.5 rounded-xl bg-blue-900/60 text-xs font-medium text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Action: {latestFutureAdvice.action}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
