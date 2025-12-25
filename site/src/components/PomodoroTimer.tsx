import React, { useState, useEffect, useRef } from 'react';

// Types
interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface Stats {
  pomodorosCompleted: number;
  totalMinutes: number;
}

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

// Storage utilities
const STORAGE_KEYS = {
  SETTINGS: 'pomodoro_settings',
  TASKS: 'pomodoro_tasks',
  STATS: 'pomodoro_stats',
};

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// Constants
const DEFAULT_SETTINGS: TimerSettings = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
};

const MODE_LABELS: Record<TimerMode, string> = {
  pomodoro: 'Focus Time',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

export default function PomodoroTimer() {
  // State
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [settings, setSettings] = useState<TimerSettings>(() =>
    loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );
  const [tasks, setTasks] = useState<Task[]>(() =>
    loadFromStorage(STORAGE_KEYS.TASKS, [
      { id: '1', text: '', completed: false },
      { id: '2', text: '', completed: false },
      { id: '3', text: '', completed: false },
    ])
  );
  const [stats, setStats] = useState<Stats>(() =>
    loadFromStorage(STORAGE_KEYS.STATS, { pomodorosCompleted: 0, totalMinutes: 0 })
  );
  
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  const intervalRef = useRef<number | null>(null);

  // Get current timer duration
  const getCurrentDuration = () => {
    switch (mode) {
      case 'pomodoro': return settings.pomodoro * 60;
      case 'shortBreak': return settings.shortBreak * 60;
      case 'longBreak': return settings.longBreak * 60;
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get active task (first uncompleted task with text)
  const getActiveTask = (): Task | null => {
    return tasks.find(task => !task.completed && task.text.trim()) || null;
  };

  // Get timer label
  const getTimerLabel = (): React.ReactNode => {
    if (mode === 'pomodoro') {
      const activeTask = getActiveTask();
      if (activeTask) {
        return (
          <>
            <strong>{activeTask.text}</strong> Focus Time
          </>
        );
      }
    }
    return MODE_LABELS[mode];
  };

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Reorder tasks
  const reorderTasks = (fromIndex: number, toIndex: number) => {
    const newTasks = [...tasks];
    const [removed] = newTasks.splice(fromIndex, 1);
    newTasks.splice(toIndex, 0, removed);
    setTasks(newTasks);
    saveToStorage(STORAGE_KEYS.TASKS, newTasks);
  };

  // Handle drag start
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === taskId) return;

    const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex(t => t.id === taskId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      reorderTasks(draggedIndex, targetIndex);
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  // Start timer
  const startTimer = () => {
    setIsRunning(true);
    setSessionStartTime(Date.now());
  };

  // Pause timer
  const pauseTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Reset timer
  const resetTimer = () => {
    pauseTimer();
    setTimeLeft(getCurrentDuration());
    setSessionStartTime(null);
  };

  // End session early and track time
  const endEarly = () => {
    if (!sessionStartTime || !isRunning) return;

    const timeSpentSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    const timeSpentMinutes = Math.round(timeSpentSeconds / 60);

    if (mode === 'pomodoro' && timeSpentMinutes > 0) {
      const newStats = {
        ...stats,
        totalMinutes: stats.totalMinutes + timeSpentMinutes,
      };
      setStats(newStats);
      saveToStorage(STORAGE_KEYS.STATS, newStats);
    }

    resetTimer();
  };

  // Complete timer
  const completeTimer = () => {
    pauseTimer();

    if (mode === 'pomodoro') {
      const newStats = {
        pomodorosCompleted: stats.pomodorosCompleted + 1,
        totalMinutes: stats.totalMinutes + settings.pomodoro,
      };
      setStats(newStats);
      saveToStorage(STORAGE_KEYS.STATS, newStats);
    }

    // Notify
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', {
        body: `${MODE_LABELS[mode]} completed!`,
      });
    }

    // Auto-switch mode
    if (mode === 'pomodoro') {
      const nextMode = stats.pomodorosCompleted % 4 === 0 ? 'longBreak' : 'shortBreak';
      switchMode(nextMode);
    } else {
      switchMode('pomodoro');
    }
  };

  // Switch mode
  const switchMode = (newMode: TimerMode) => {
    pauseTimer();
    setMode(newMode);
    const duration = newMode === 'pomodoro' ? settings.pomodoro * 60 :
                     newMode === 'shortBreak' ? settings.shortBreak * 60 :
                     settings.longBreak * 60;
    setTimeLeft(duration);
    setSessionStartTime(null);
  };

  // Update task
  const updateTask = (id: string, text: string) => {
    const newTasks = tasks.map(task =>
      task.id === id ? { ...task, text } : task
    );
    setTasks(newTasks);
    saveToStorage(STORAGE_KEYS.TASKS, newTasks);
  };

  // Toggle task completion
  const toggleTaskComplete = (id: string) => {
    const newTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(newTasks);
    saveToStorage(STORAGE_KEYS.TASKS, newTasks);
  };

  // Save settings
  const saveSettings = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    saveToStorage(STORAGE_KEYS.SETTINGS, newSettings);
    if (!isRunning) {
      setTimeLeft(newSettings.pomodoro * 60);
    }
    setShowSettings(false);
  };

  // Reset stats
  const resetStats = () => {
    if (confirm('Reset all statistics? This cannot be undone.')) {
      const newStats = { pomodorosCompleted: 0, totalMinutes: 0 };
      setStats(newStats);
      saveToStorage(STORAGE_KEYS.STATS, newStats);
    }
  };

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            completeTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Update document title
  useEffect(() => {
    document.title = `${formatTime(timeLeft)} - Pomodoro Timer`;
  }, [timeLeft]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">🍅 Pomodoro Timer</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 hover:bg-gray-800 rounded-lg transition text-xl"
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-8">
        {(['pomodoro', 'shortBreak', 'longBreak'] as TimerMode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-2 px-4 rounded-lg transition ${
              mode === m
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {m === 'pomodoro' ? 'Pomodoro' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="text-center mb-8">
        <div className="text-8xl font-bold mb-4">{formatTime(timeLeft)}</div>
        <div className="text-2xl text-gray-400">{getTimerLabel()}</div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 justify-center mb-12">
        <button
          onClick={isRunning ? pauseTimer : startTimer}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-lg font-medium"
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={resetTimer}
          className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
        >
          Reset
        </button>
        {isRunning && mode === 'pomodoro' && (
          <button
            onClick={endEarly}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            End Early
          </button>
        )}
      </div>

      {/* Tasks */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Today's Focus Tasks</h2>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              draggable
              onDragStart={() => handleDragStart(task.id)}
              onDragOver={(e) => handleDragOver(e, task.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-4 rounded-lg transition cursor-move ${
                !task.completed && task.text.trim() && task === getActiveTask()
                  ? 'bg-blue-900/30 border-2 border-blue-600'
                  : 'bg-gray-800'
              } ${task.completed ? 'opacity-60' : ''} ${
                draggedTaskId === task.id ? 'opacity-50' : ''
              }`}
            >
              <div className="text-gray-500 cursor-grab active:cursor-grabbing">⋮⋮</div>
              <button
                onClick={() => toggleTaskComplete(task.id)}
                className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                  task.completed
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                {task.completed && '✓'}
              </button>
              <input
                type="text"
                value={task.text}
                onChange={(e) => updateTask(task.id, e.target.value)}
                placeholder={`Task ${index + 1}`}
                maxLength={60}
                className={`flex-1 bg-transparent border-none outline-none text-lg ${
                  task.completed ? 'line-through' : ''
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 items-center justify-center">
        <div className="flex-1 bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-blue-500 mb-2">
            {stats.pomodorosCompleted}
          </div>
          <div className="text-gray-400">Pomodoros</div>
        </div>
        <div className="flex-1 bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-blue-500 mb-2">
            {stats.totalMinutes}
          </div>
          <div className="text-gray-400">Minutes</div>
        </div>
        <button
          onClick={resetStats}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-sm"
        >
          Reset Stats
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// Settings Modal Component
function SettingsModal({
  settings,
  onSave,
  onClose,
}: {
  settings: TimerSettings;
  onSave: (settings: TimerSettings) => void;
  onClose: () => void;
}) {
  const [pomodoro, setPomodoro] = useState(settings.pomodoro);
  const [shortBreak, setShortBreak] = useState(settings.shortBreak);
  const [longBreak, setLongBreak] = useState(settings.longBreak);

  const handleSave = () => {
    if (pomodoro >= 1 && pomodoro <= 60 &&
        shortBreak >= 1 && shortBreak <= 30 &&
        longBreak >= 1 && longBreak <= 60) {
      onSave({ pomodoro, shortBreak, longBreak });
    } else {
      alert('Please enter valid durations');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-semibold">Timer Settings</h2>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded text-2xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block mb-2 font-medium">Pomodoro Duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={pomodoro}
              onChange={(e) => setPomodoro(Number(e.target.value))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Short Break Duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={shortBreak}
              onChange={(e) => setShortBreak(Number(e.target.value))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Long Break Duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={longBreak}
              onChange={(e) => setLongBreak(Number(e.target.value))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-700">
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium"
          >
            Save Settings
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
