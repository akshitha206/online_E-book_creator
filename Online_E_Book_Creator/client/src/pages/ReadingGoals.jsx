
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  BookOpen,
  Target,
  Flame,
  Trophy,
  Clock3,
  CheckCircle2,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  Medal
} from 'lucide-react';

import './ReadingGoals.css';

const SESSIONS_KEY = 'bookcraft-reading-sessions';
const GOAL_KEY = 'bookcraft-daily-reading-goal';
const DEFAULT_GOAL = 30;

function readSessions() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function getDateKey(date) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return '';

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const totalMinutes = Math.floor(safeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
}

function getStreaks(dailyTotals) {
  const dates = Object.keys(dailyTotals)
    .filter(date => dailyTotals[date] > 0)
    .sort();

  if (dates.length === 0) {
    return { current: 0, longest: 0 };
  }

  const dateSet = new Set(dates);
  let longest = 0;
  let running = 0;
  let previous = null;

  dates.forEach(date => {
    const currentDate = new Date(`${date}T00:00:00`);

    if (previous) {
      const difference = Math.round(
        (currentDate - previous) / 86400000
      );

      running = difference === 1 ? running + 1 : 1;
    } else {
      running = 1;
    }

    longest = Math.max(longest, running);
    previous = currentDate;
  });

  const today = getDateKey(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const yesterday = getDateKey(yesterdayDate);

  let current = 0;
  let checkDate = dateSet.has(today) ? today : yesterday;

  while (dateSet.has(checkDate)) {
    current += 1;

    const previousDate = new Date(`${checkDate}T00:00:00`);
    previousDate.setDate(previousDate.getDate() - 1);
    checkDate = getDateKey(previousDate);
  }

  return { current, longest };
}

function ReadingGoals() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState(readSessions);

  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = Number(localStorage.getItem(GOAL_KEY));
    return saved >= 5 && saved <= 600 ? saved : DEFAULT_GOAL;
  });

  const [customGoal, setCustomGoal] = useState(String(dailyGoal));
  const [editingGoal, setEditingGoal] = useState(false);

  const refreshSessions = useCallback(() => {
    setSessions(readSessions());
  }, []);

  useEffect(() => {
    window.addEventListener(
      'bookcraft-sessions-updated',
      refreshSessions
    );
    window.addEventListener('storage', refreshSessions);
    window.addEventListener('focus', refreshSessions);

    return () => {
      window.removeEventListener(
        'bookcraft-sessions-updated',
        refreshSessions
      );
      window.removeEventListener('storage', refreshSessions);
      window.removeEventListener('focus', refreshSessions);
    };
  }, [refreshSessions]);

  const dailyTotals = useMemo(() => {
    const totals = {};

    sessions.forEach(session => {
      const date = getDateKey(session.startedAt);
      const duration = Number(session.durationSeconds) || 0;

      if (!date || duration <= 0) return;

      totals[date] = (totals[date] || 0) + duration;
    });

    return totals;
  }, [sessions]);

  const totalSeconds = useMemo(
    () =>
      sessions.reduce(
        (total, session) =>
          total + Math.max(0, Number(session.durationSeconds) || 0),
        0
      ),
    [sessions]
  );

  const totalSessions = sessions.filter(
    session => Number(session.durationSeconds) > 0
  ).length;

  const todayKey = getDateKey(new Date());
  const todaySeconds = dailyTotals[todayKey] || 0;
  const goalSeconds = dailyGoal * 60;

  const progress = Math.min(
    100,
    Math.round((todaySeconds / goalSeconds) * 100)
  );

  const goalCompleted = todaySeconds >= goalSeconds;
  const goalRemaining = Math.max(0, goalSeconds - todaySeconds);

  const streaks = useMemo(
    () => getStreaks(dailyTotals),
    [dailyTotals]
  );

  const weeklyHistory = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));

      const key = getDateKey(date);
      const seconds = dailyTotals[key] || 0;

      return {
        key,
        label: date.toLocaleDateString('en-US', {
          weekday: 'short'
        }),
        minutes: Math.floor(seconds / 60),
        completed: seconds >= goalSeconds,
        today: key === todayKey
      };
    });
  }, [dailyTotals, goalSeconds, todayKey]);

  const completedDays = Object.values(dailyTotals).filter(
    seconds => seconds >= goalSeconds
  ).length;

  const achievements = [
    {
      title: 'First Steps',
      description: 'Complete your first reading session.',
      icon: BookOpen,
      unlocked: totalSessions >= 1
    },
    {
      title: 'One Hour Reader',
      description: 'Read for a total of one hour.',
      icon: Clock3,
      unlocked: totalSeconds >= 3600
    },
    {
      title: 'Dedicated Reader',
      description: 'Reach five hours of total reading.',
      icon: Medal,
      unlocked: totalSeconds >= 18000
    },
    {
      title: 'Goal Crusher',
      description: 'Complete your daily reading goal.',
      icon: Target,
      unlocked: completedDays >= 1
    },
    {
      title: 'On a Roll',
      description: 'Build a three-day reading streak.',
      icon: Flame,
      unlocked: streaks.longest >= 3
    },
    {
      title: 'Weekly Champion',
      description: 'Build a seven-day reading streak.',
      icon: Trophy,
      unlocked: streaks.longest >= 7
    },
    {
      title: 'Session Champion',
      description: 'Complete ten reading sessions.',
      icon: Sparkles,
      unlocked: totalSessions >= 10
    }
  ];

  const saveGoal = () => {
    const value = Number(customGoal);

    if (!Number.isInteger(value) || value < 5 || value > 600) {
      alert('Please enter a goal between 5 and 600 minutes.');
      return;
    }

    setDailyGoal(value);
    setCustomGoal(String(value));
    localStorage.setItem(GOAL_KEY, String(value));
    setEditingGoal(false);
  };

  const selectGoal = value => {
    setDailyGoal(value);
    setCustomGoal(String(value));
    localStorage.setItem(GOAL_KEY, String(value));
  };

  const maxWeeklyMinutes = Math.max(
    1,
    dailyGoal,
    ...weeklyHistory.map(day => day.minutes)
  );

  const unlockedCount = achievements.filter(
    item => item.unlocked
  ).length;

  return (
    <div className="goals-page">
      <header className="goals-header">
        <button
          className="goals-back-button"
          onClick={() => navigate('/library')}
        >
          <ArrowLeft size={19} />
          Back to My Library
        </button>

        <div className="goals-brand">
          <BookOpen size={25} />
          <span>BookCraft</span>
        </div>
      </header>

      <main className="goals-container">
        <section className="goals-intro">
          <span className="goals-eyebrow">
            YOUR READING JOURNEY
          </span>
          <h1>Reading Goals</h1>
          <p>
            Build a consistent reading habit, track your progress
            and celebrate every milestone.
          </p>
        </section>

        <section className="daily-goal-card">
          <div className="daily-goal-content">
            <div className="daily-goal-heading">
              <div className="goal-icon">
                <Target size={27} />
              </div>

              <div>
                <span>DAILY READING TARGET</span>
                <h2>{dailyGoal} minutes a day</h2>
              </div>
            </div>

            <div className="goal-progress-info">
              <div>
                <strong>{formatTime(todaySeconds)}</strong>
                <span> read today</span>
              </div>

              <strong>{progress}%</strong>
            </div>

            <div className="goal-progress-track">
              <div
                className="goal-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="goal-progress-footer">
              {goalCompleted ? (
                <span className="goal-success">
                  <CheckCircle2 size={17} />
                  Daily goal completed. Great work!
                </span>
              ) : (
                <span>
                  {formatTime(goalRemaining)} left to reach your goal
                </span>
              )}

              <button
                onClick={() => setEditingGoal(!editingGoal)}
              >
                {editingGoal ? 'Close' : 'Edit goal'}
              </button>
            </div>

            {editingGoal && (
              <div className="goal-editor">
                <p>Choose your daily reading target</p>

                <div className="goal-presets">
                  {[15, 30, 45, 60, 90].map(value => (
                    <button
                      key={value}
                      className={dailyGoal === value ? 'selected' : ''}
                      onClick={() => selectGoal(value)}
                    >
                      {value} min
                    </button>
                  ))}
                </div>

                <div className="goal-custom-input">
                  <input
                    type="number"
                    min="5"
                    max="600"
                    value={customGoal}
                    onChange={event =>
                      setCustomGoal(event.target.value)
                    }
                    placeholder="Custom minutes"
                  />

                  <button onClick={saveGoal}>
                    Save Goal
                  </button>
                </div>

                <small>
                  Choose a goal between 5 and 600 minutes.
                </small>
              </div>
            )}
          </div>

          <div className="daily-goal-illustration">
            <div className="goal-circle">
              <Target size={76} strokeWidth={1.4} />
            </div>
            <span>One page at a time.</span>
          </div>
        </section>

        <section className="goal-stats-grid">
          <article className="goal-stat-card">
            <div className="goal-stat-icon orange">
              <Flame size={23} />
            </div>
            <span>Current Streak</span>
            <strong>{streaks.current} days</strong>
            <small>Keep the momentum going!</small>
          </article>

          <article className="goal-stat-card">
            <div className="goal-stat-icon purple">
              <Trophy size={23} />
            </div>
            <span>Longest Streak</span>
            <strong>{streaks.longest} days</strong>
            <small>Your personal record</small>
          </article>

          <article className="goal-stat-card">
            <div className="goal-stat-icon blue">
              <Clock3 size={23} />
            </div>
            <span>Total Reading Time</span>
            <strong>{formatTime(totalSeconds)}</strong>
            <small>Across all sessions</small>
          </article>

          <article className="goal-stat-card">
            <div className="goal-stat-icon green">
              <CheckCircle2 size={23} />
            </div>
            <span>Goals Completed</span>
            <strong>{completedDays} days</strong>
            <small>Days you reached your target</small>
          </article>
        </section>

        <section className="weekly-goals-section">
          <div className="goals-section-heading">
            <div>
              <span>YOUR CONSISTENCY</span>
              <h2>Last 7 Days</h2>
            </div>

            <span className="weekly-goal-label">
              Target: {dailyGoal} min/day
            </span>
          </div>

          <div className="weekly-chart">
            {weeklyHistory.map(day => {
              const height = Math.max(
                day.minutes > 0 ? 5 : 0,
                Math.min(
                  100,
                  (day.minutes / maxWeeklyMinutes) * 100
                )
              );

              return (
                <div className="weekly-day" key={day.key}>
                  <div className="weekly-bar-area">
                    <span className="weekly-minutes">
                      {day.minutes > 0 ? `${day.minutes}m` : ''}
                    </span>

                    <div
                      className={`weekly-bar ${
                        day.completed ? 'completed' : ''
                      } ${day.today ? 'today' : ''}`}
                      style={{ height: `${height}%` }}
                      title={`${day.minutes} minutes`}
                    >
                      {day.completed && (
                        <CheckCircle2 size={15} />
                      )}
                    </div>
                  </div>

                  <span
                    className={
                      day.today
                        ? 'weekly-day-label today'
                        : 'weekly-day-label'
                    }
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="weekly-legend">
            <span>
              <i className="legend-dot completed-dot" />
              Daily goal reached
            </span>
            <span>
              <i className="legend-dot" />
              Reading activity
            </span>
          </div>
        </section>

        <section className="achievements-section">
          <div className="goals-section-heading">
            <div>
              <span>REWARDS AND MILESTONES</span>
              <h2>Achievements</h2>
            </div>

            <span className="achievement-count">
              {unlockedCount}/{achievements.length} unlocked
            </span>
          </div>

          <div className="achievement-grid">
            {achievements.map(achievement => {
              const Icon = achievement.icon;

              return (
                <article
                  className={`achievement-card ${
                    achievement.unlocked ? 'unlocked' : 'locked'
                  }`}
                  key={achievement.title}
                >
                  <div className="achievement-icon">
                    {achievement.unlocked ? (
                      <Icon size={27} />
                    ) : (
                      <LockKeyhole size={25} />
                    )}
                  </div>

                  <div>
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                  </div>

                  <span className="achievement-status">
                    {achievement.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </article>
              );
            })}
          </div>
        </section>

        <div className="goals-footer">
          <RefreshCw size={15} />
          Reading statistics update automatically as you read.
        </div>
      </main>
    </div>
  );
}

export default ReadingGoals;
