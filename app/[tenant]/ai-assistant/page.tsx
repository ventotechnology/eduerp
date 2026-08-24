'use client';

import React, { useState } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { processAiManagementQuery, generateAiQuestionSet } from '@/lib/ai-assistant';
import { AiChatMessage } from '@/lib/types';
import {
  Bot,
  Sparkles,
  Send,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Plus
} from 'lucide-react';

export default function AiAssistantPage() {
  const { branding, activeRole } = useTenant();

  const [activeMode, setActiveMode] = useState<'chat' | 'questionGen'>('chat');

  // AI Chat State
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'assistant',
      text: `Hello! I am your **EduERP AI Management Copilot** for ${branding.name}.\n\nI have real-time RBAC read-access across your campus databases: attendance rates, fees & dues collection, academic examinations, faculty workloads, and early-warning dropout risks.\n\nHow can I help you today?`,
      timestamp: '11:00 AM',
      suggestedActions: [
        'How many students are absent today?',
        'How much tuition is outstanding this month?',
        'Which students are at high risk of academic shortfall?',
        'Show Grade 4 Green Section performance'
      ]
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // AI Question Generator State
  const [qSubject, setQSubject] = useState('Physics / Science');
  const [qTopic, setQTopic] = useState('Newtonian Mechanics & Momentum');
  const [qDifficulty, setQDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: AiChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: query,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const aiResponse = processAiManagementQuery(query, activeRole, branding.name);
      setMessages((prev) => [...prev, aiResponse]);
    }, 800);
  };

  const handleGenerateQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    const questions = generateAiQuestionSet(qSubject, qTopic, qDifficulty);
    setGeneratedQuestions(questions);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              RBAC Governed AI Assistant
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            AI Management Copilot & Question Bank Generator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ask natural language administrative queries or automatically draft multi-type examination questions with teacher review workflows.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            onClick={() => setActiveMode('chat')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeMode === 'chat' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            AI Management Chat
          </button>
          <button
            onClick={() => setActiveMode('questionGen')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeMode === 'questionGen' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            AI Question Generator
          </button>
        </div>
      </div>

      {activeMode === 'chat' ? (
        /* AI Chat Container */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[550px] overflow-hidden">
          {/* Chat Messages Log */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-xl p-4 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                  {/* Suggested Action Chips */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Suggested Inquiries:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((action) => (
                          <button
                            key={action}
                            onClick={() => handleSendMessage(action)}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-600 transition"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[9px] text-slate-400 block mt-2 text-right">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-xs text-purple-600 animate-pulse font-medium">
                <Bot className="w-4 h-4" />
                <span>AI Copilot is analyzing campus database records...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask administrative questions (e.g. 'Show Grade 9 Green attendance' or 'List overdue fees')..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* AI Question Bank Generator */
        <div className="space-y-6">
          <form
            onSubmit={handleGenerateQuestions}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
          >
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
              <input
                type="text"
                value={qSubject}
                onChange={(e) => setQSubject(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Topic / Chapter</label>
              <input
                type="text"
                value={qTopic}
                onChange={(e) => setQTopic(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
              <select
                value={qDifficulty}
                onChange={(e) => setQDifficulty(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Questions</span>
              </button>
            </div>
          </form>

          {/* Generated Questions List */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                Drafted Examination Questions (Requires Teacher Approval to Publish)
              </h3>
              <div className="space-y-3">
                {generatedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-600">
                        Q{idx + 1} ({q.type} • {q.marks} Mark)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {q.difficulty}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-900 dark:text-white">{q.questionText}</p>

                    {q.options && (
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        {q.options.map((opt: string) => (
                          <span
                            key={opt}
                            className={`p-2 rounded border ${
                              opt === q.correctAnswer
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}

                    {q.rubrics && (
                      <p className="text-[11px] text-slate-500 italic pt-1">
                        <strong>Grading Rubric:</strong> {q.rubrics}
                      </p>
                    )}

                    <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                      <button className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                        Edit
                      </button>
                      <button className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
                        Approve & Add to Question Bank
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
