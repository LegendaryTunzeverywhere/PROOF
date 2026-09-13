import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Reveal } from './Reveal';
import { pathsService } from '../services/paths.service';
import { useLanguage } from '../context/LanguageContext';
import { TutorModal } from './TutorModal';
import { ChatBubbleLeftRightIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { ChessBoard } from './chess/ChessBoard';
import { ChessLessonReplay } from './chess/ChessLessonReplay';

interface LessonViewProps {
  pathId: string;
  skill: string;
  topic: string;
}

interface LessonData {
  title: string;
  tldr: string;
  sections: Array<{ h: string; body: string }>;
  example?: { 
    lang: string; 
    code?: string;
    fen?: string;
    description?: string;
  };
  ask?: string;
  keyPoints: string[];
  misconception?: string;
  quiz?: Array<{ q: string; choices: string[]; answerIdx: number; why?: string }>;
  practice?: Array<{ q: string; choices: string[]; answerIdx: number; why?: string }>;
  recall?: string[];
}

type Stage = 'hook' | 'learn' | 'quiz' | 'recall' | 'practice' | 'complete';

function normalizeLessonData(data: any, skill: string, topic: string): LessonData {
  const raw = { ...(data || {}), ...(data?.lesson || {}) };
  const sections = Array.isArray(raw.sections)
    ? raw.sections.map((section: any) => ({
        h: section.h || section.heading || 'Lesson section',
        body: section.body || (Array.isArray(section.paragraphs) ? section.paragraphs.join('\n\n') : ''),
      })).filter((section: { h: string; body: string }) => section.body)
    : [];
  const normalizeQuestion = (question: any) => ({
    q: question.q || question.question || 'Check your understanding.',
    choices: Array.isArray(question.choices) ? question.choices : (Array.isArray(question.options) ? question.options : []),
    answerIdx: Number.isInteger(question.answerIdx) ? question.answerIdx : (Number.isInteger(question.correctIndex) ? question.correctIndex : 0),
    why: question.why || question.explanation || question.hint,
  });

  return {
    ...raw,
    skillSlug: raw.skillSlug || skill,
    topicSlug: raw.topicSlug || topic,
    title: raw.title || topic.replace(/-/g, ' '),
    tldr: raw.tldr || raw.summary || 'Study this topic, connect it to the document, and explain it in your own words.',
    sections,
    keyPoints: Array.isArray(raw.keyPoints) ? raw.keyPoints : [],
    quiz: Array.isArray(raw.quiz) ? raw.quiz.map(normalizeQuestion).filter((question: any) => question.choices.length > 0) : [],
    practice: Array.isArray(raw.practice) ? raw.practice.map(normalizeQuestion).filter((question: any) => question.choices.length > 0) : [],
    recall: Array.isArray(raw.recall) ? raw.recall : [],
  };
}

export function LessonView({ pathId, skill, topic }: LessonViewProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dayIndex = searchParams.get('day') || '1';
  const { language } = useLanguage();

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true); // Start true, will be set false when data loads
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('hook');
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [practiceAnswers, setPracticeAnswers] = useState<(number | null)[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [showPracticeResults, setShowPracticeResults] = useState(false);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [accessChecking, setAccessChecking] = useState(true);
  const [lockedByLesson, setLockedByLesson] = useState<string | null>(null);

  useEffect(() => {
    console.log('[LessonView] Component mounted/updated. Skill:', skill, 'Topic:', topic);
    // Reset state when topic changes
    setLesson(null);
    setLoading(true);
    setError(null);
    setAccessChecking(true);
    setLockedByLesson(null);
    loadLesson();
    void checkLessonAccess();
  }, [language, skill, topic]); // Reload lesson content when the locale changes.

  const checkLessonAccess = async () => {
    try {
      const response = await pathsService.getPath(pathId);
      const studies = response.path.days.flatMap((day: any) =>
        day.items
          .map((item: any) => ({ day, item }))
          .filter(({ item }: { item: any }) => item.kind === 'study')
      );
      const currentIndex = studies.findIndex(({ day, item }: { day: any; item: any }) =>
        day.index === Number(dayIndex) && item.topic === topic
      );
      if (currentIndex > 0) {
        const unfinished = studies.slice(0, currentIndex).find(({ item }: { item: any }) => !item.practiceDone);
        if (unfinished) setLockedByLesson(unfinished.item.title || 'the previous lesson');
      }
    } catch (accessError) {
      // Normal navigation is locked in the path view. A transient progress
      // request must not make a previously available lesson unusable.
      console.warn('[LessonView] Could not verify lesson order:', accessError);
    } finally {
      setAccessChecking(false);
    }
  };

  const loadLesson = async () => {
    console.log('[LessonView] Loading lesson:', skill, topic);
    try {
      // Check cache first
      const cacheKey = `lesson_${language}_${skill}_${topic}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        console.log('[LessonView] Cache HIT:', cacheKey);
        try {
          const cachedLesson = normalizeLessonData(JSON.parse(cached), skill, topic);
          console.log('[LessonView] Setting lesson from cache');
          setLesson(cachedLesson);
          setLoading(false);
          console.log('[LessonView] Loading state set to false (cached)');
          
          if (cachedLesson.quiz) {
            setQuizAnswers(new Array(cachedLesson.quiz.length).fill(null));
          }
          if (cachedLesson.practice) {
            setPracticeAnswers(new Array(cachedLesson.practice.length).fill(null));
          }
          
          // Still fetch in background to update cache (but don't show loading)
          fetchAndCacheLesson(cacheKey, false);
          return;
        } catch (e) {
          // Invalid cache, fetch normally
          console.warn('[LessonView] Invalid cache, refetching:', e);
        }
      }
      
      console.log('[LessonView] Cache MISS, fetching:', cacheKey);
      // No cache, fetch and update UI
      await fetchAndCacheLesson(cacheKey, true);
      console.log('[LessonView] Fetch complete');
    } catch (err: any) {
      console.error('[LessonView] Failed to load lesson:', err);
      setError(err.message || 'Failed to load lesson');
      setLoading(false);
    }
  };
  
  const fetchAndCacheLesson = async (cacheKey: string, updateUI: boolean = true) => {
    console.log('[LessonView] Fetching:', cacheKey, 'updateUI:', updateUI);
    try {
      const response = await fetch(`/api/lesson/${skill}/${topic}?lang=${language}`, {
        credentials: 'include',
      });

      console.log('[LessonView] Response status:', response.status);
      if (!response.ok) throw new Error('Lesson not found');
      
      const data = await response.json();
      console.log('[LessonView] Data received:', Object.keys(data));
      
      // Flatten the lesson structure
      const flatLesson = normalizeLessonData(data, skill, topic);
      
      console.log('[LessonView] Flattened lesson:', Object.keys(flatLesson));
      
      // Cache for session
      sessionStorage.setItem(cacheKey, JSON.stringify(flatLesson));
      console.log('[LessonView] Saved to cache');
      
      if (updateUI) {
        console.log('[LessonView] Updating UI with lesson');
        setLesson(flatLesson);
        
        if (flatLesson.quiz) {
          setQuizAnswers(new Array(flatLesson.quiz.length).fill(null));
        }
        if (flatLesson.practice) {
          setPracticeAnswers(new Array(flatLesson.practice.length).fill(null));
        }
        
        setLoading(false);
        console.log('[LessonView] Loading state set to false (fetched)');
      } else {
        console.log('[LessonView] Skipping UI update (background refresh)');
      }
    } catch (error) {
      console.error('[LessonView] Fetch error:', error);
      if (updateUI) {
        throw error; // Re-throw to be caught by loadLesson
      }
      // Silent fail for background updates
      console.warn('[LessonView] Background cache update failed:', error);
    }
  };

  const handleQuizAnswer = (questionIdx: number, choiceIdx: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIdx] = choiceIdx;
    setQuizAnswers(newAnswers);
  };

  const handlePracticeAnswer = (questionIdx: number, choiceIdx: number) => {
    const newAnswers = [...practiceAnswers];
    newAnswers[questionIdx] = choiceIdx;
    setPracticeAnswers(newAnswers);
  };

  const checkQuiz = () => {
    setShowQuizResults(true);
  };

  const checkPractice = async () => {
    setShowPracticeResults(true);
    
    // Mark lesson as complete
    try {
      await pathsService.updateProgress(pathId, {
        dayIndex: parseInt(dayIndex),
        topicSlug: topic,
        part: 'lesson',
      });
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const completeLesson = async () => {
    try {
      await pathsService.updateProgress(pathId, {
        dayIndex: parseInt(dayIndex),
        topicSlug: topic,
        part: 'practice',
      });
      navigate(`/learn/path/${pathId}`);
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    }
  };

  if ((loading && !lesson) || accessChecking) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="space-y-6">
          {/* Skeleton loading */}
          <div className="animate-pulse">
            <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            <span className="ml-3 text-muted">Loading lesson...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
          <p className="font-semibold text-bad">Failed to load lesson</p>
          <p className="mt-2 text-sm text-bad">{error}</p>
          <Link
            to={`/learn/path/${pathId}`}
            className="mt-4 inline-block rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Path
          </Link>
        </div>
      </div>
    );
  }

  if (lockedByLesson) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-elevated text-muted">
            <LockClosedIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-ink">Finish the previous lesson first</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">Complete the practice in “{lockedByLesson}” to unlock this lesson. This keeps the path in a useful learning order.</p>
          <Link to={`/learn/path/${pathId}`} className="mt-6 inline-flex h-11 items-center rounded-lg bg-ink px-4 text-sm font-bold text-surface transition-colors hover:bg-brand">
            Back to path
          </Link>
        </div>
      </div>
    );
  }

  const stages: Array<{ key: Stage; label: string; icon: string }> = [
    { key: 'hook', label: 'Hook', icon: '🧭' },
    { key: 'learn', label: 'Learn', icon: '📖' },
    { key: 'quiz', label: 'Quiz', icon: '❓' },
    { key: 'recall', label: 'Recall', icon: '🧠' },
    { key: 'practice', label: 'Practice', icon: '✍️' },
  ];

  const currentStageIndex = stages.findIndex(s => s.key === stage);

  return (
    <>
      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Header */}
        <Reveal>
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <Link
              to={`/learn/path/${pathId}`}
              className="text-sm font-semibold text-muted transition-colors hover:text-brand"
            >
              ← Back to Path
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTutorOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                Ask Tutor
              </button>
              <div className="text-sm text-muted">Day {dayIndex}</div>
            </div>
          </div>
        </Reveal>

        {/* Progress Stages */}
        <Reveal delay={0.05}>
          <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 sm:p-4">
            {stages.map((s, idx) => (
              <button
                key={s.key}
                onClick={() => setStage(s.key)}
                disabled={idx > currentStageIndex}
                className={`flex flex-col items-center gap-1 transition-opacity ${
                  idx <= currentStageIndex ? 'opacity-100' : 'opacity-40'
                } ${stage === s.key ? 'scale-110' : ''}`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition-all ${
                    stage === s.key
                      ? 'bg-brand text-white'
                      : idx < currentStageIndex
                      ? 'bg-ok-soft text-ok'
                      : 'bg-elevated text-muted'
                  }`}
                >
                  {idx < currentStageIndex && stage !== s.key ? '✓' : s.icon}
                </div>
                <span className="text-xs font-medium text-muted">{s.label}</span>
              </button>
            ))}
          </div>
        </Reveal>

        {/* Lesson Title */}
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">{lesson.title}</h1>
            <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">{lesson.tldr}</p>
          </div>
        </Reveal>

        {/* Hook Stage */}
        {stage === 'hook' && (
          <Reveal delay={0.15}>
            <div className="space-y-4">
              <div className="rounded-2xl border border-brand-soft bg-brand-soft/20 p-4 sm:p-6">
                <h2 className="mb-3 text-lg font-bold text-ink sm:text-xl">🧭 Let's get oriented</h2>
                {lesson.ask && (
                  <div className="mb-4 rounded-lg border border-line bg-elevated p-3 sm:p-4">
                    <p className="font-semibold text-ink">Think about this:</p>
                    <p className="mt-2 text-sm text-muted sm:text-base">{lesson.ask}</p>
                  </div>
                )}
                <p className="text-sm text-muted sm:text-base">
                  Take a moment to think about what you already know. This helps your brain make connections to new information.
                </p>
              </div>
              <button
                onClick={() => setStage('learn')}
                className="w-full rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                Start Learning →
              </button>
            </div>
          </Reveal>
        )}

        {/* Learn Stage */}
        {stage === 'learn' && (
          <Reveal delay={0.15}>
            <div className="space-y-6">
              {lesson.sections && lesson.sections.length > 0 ? (
                lesson.sections.map((section, idx) => (
                  <div key={idx} className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
                    <h3 className="mb-3 text-lg font-bold text-ink sm:text-xl">{section.h}</h3>
                    <p className="text-sm leading-relaxed text-muted sm:text-base">{section.body}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
                  <p className="text-muted">No lesson content available. Please try another lesson.</p>
                </div>
              )}

              {skill === 'chess' && (
                <ChessLessonReplay topic={topic} exampleFen={lesson.example?.fen} />
              )}

              {lesson.example && (skill !== 'chess' || lesson.example.code) && (
                <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
                  <h3 className="mb-3 text-lg font-bold text-ink sm:text-xl">💡 Example</h3>
                  
                  {lesson.example.lang === 'fen' && lesson.example.fen ? (
                    // Chess board example
                    <div className="space-y-4">
                      <div className="mx-auto max-w-lg">
                        <ChessBoard
                          initialFen={lesson.example.fen}
                          disabled={true}
                          showCoordinates={true}
                        />
                      </div>
                      {lesson.example.description && (
                        <p className="text-sm text-muted text-center">
                          {lesson.example.description}
                        </p>
                      )}
                    </div>
                  ) : lesson.example.code ? (
                    // Code example
                    <div className="rounded-lg border border-line bg-elevated p-4">
                      {lesson.example.lang && (
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-md bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">
                            {lesson.example.lang.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <pre className="overflow-x-auto text-sm text-ink">
                        <code>{lesson.example.code}</code>
                      </pre>
                    </div>
                  ) : null}
                </div>
              )}

              {lesson.misconception && (
                <div className="rounded-2xl border border-warn-soft bg-warn-soft/20 p-4 sm:p-6">
                  <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-warn sm:text-lg">
                    ⚠️ Common Misconception
                  </h3>
                  <p className="text-sm text-muted sm:text-base">{lesson.misconception}</p>
                </div>
              )}

              <div className="rounded-2xl border border-ok-soft bg-ok-soft/20 p-4 sm:p-6">
                <h3 className="mb-3 text-base font-bold text-ok sm:text-lg">✓ Key Points</h3>
                <ul className="space-y-2">
                  {lesson.keyPoints && lesson.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted sm:text-base">
                      <span className="mt-1 text-ok">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setStage(
                  lesson.quiz?.length ? 'quiz' : lesson.recall?.length ? 'recall' : 'practice'
                )}
                className="w-full rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                {lesson.quiz?.length ? 'Test Your Understanding →' : 'Practice what you learned →'}
              </button>
            </div>
          </Reveal>
        )}

        {/* Quiz Stage */}
        {stage === 'quiz' && lesson.quiz && lesson.quiz.length > 0 && (
          <Reveal delay={0.15}>
            <div className="space-y-6">
              <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
                <h2 className="mb-4 text-xl font-bold text-ink sm:text-2xl">❓ Quick Check</h2>
                <p className="text-sm text-muted sm:text-base">Answer these questions to check your understanding.</p>
              </div>

              {lesson.quiz.map((q, qIdx) => (
                <div key={qIdx} className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
                  <p className="mb-4 text-sm font-semibold text-ink sm:text-base">
                    {qIdx + 1}. {q.q}
                  </p>
                  <div className="space-y-2">
                    {q.choices.map((choice, cIdx) => {
                      const isSelected = quizAnswers[qIdx] === cIdx;
                      const isCorrect = cIdx === q.answerIdx;
                      const showResult = showQuizResults && isSelected;

                      return (
                        <button
                          key={cIdx}
                          onClick={() => !showQuizResults && handleQuizAnswer(qIdx, cIdx)}
                          disabled={showQuizResults}
                          className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                            showResult
                              ? isCorrect
                                ? 'border-ok bg-ok-soft text-ok'
                                : 'border-bad bg-bad-soft text-bad'
                              : isSelected
                              ? 'border-brand bg-brand-soft text-brand'
                              : 'border-line bg-elevated text-ink hover:border-brand hover:bg-brand-soft/50'
                          }`}
                        >
                          {'ABCD'[cIdx]}. {choice}
                          {showResult && (isCorrect ? ' ✓' : ' ✗')}
                        </button>
                      );
                    })}
                  </div>
                  {showQuizResults && q.why && (
                    <div className="mt-3 rounded-lg bg-elevated p-3 text-xs text-muted">
                      💡 {q.why}
                    </div>
                  )}
                </div>
              ))}

              {!showQuizResults ? (
                <button
                  onClick={checkQuiz}
                  disabled={quizAnswers.includes(null)}
                  className="w-full rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
                >
                  Check Answers
                </button>
              ) : (
                <button
                  onClick={() => setStage('recall')}
                  className="w-full rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-deep"
                >
                  Continue →
                </button>
              )}
            </div>
          </Reveal>
        )}

        {/* Recall Stage */}
        {stage === 'recall' && lesson.recall && lesson.recall.length > 0 && (
          <Reveal delay={0.15}>
            <div className="space-y-6">
              <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
                <h2 className="mb-4 text-xl font-bold text-ink sm:text-2xl">🧠 Active Recall</h2>
                <p className="text-sm text-muted sm:text-base">
                  Try to answer these from memory. The act of retrieving information strengthens your understanding.
                </p>
              </div>

              {lesson.recall.map((prompt, idx) => (
                <div key={idx} className="rounded-2xl border border-brand-soft bg-brand-soft/20 p-4 sm:p-6">
                  <p className="mb-3 text-sm font-semibold text-ink sm:text-base">{prompt}</p>
                  <textarea
                    placeholder="Type or think through your answer..."
                    className="w-full rounded-lg border border-line bg-white p-3 text-sm text-ink focus:border-brand focus:outline-none"
                    rows={3}
                  />
                </div>
              ))}

              <button
                onClick={() => setStage('practice')}
                className="w-full rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                Ready for Practice →
              </button>
            </div>
          </Reveal>
        )}

        {/* Practice Stage */}
        {stage === 'practice' && lesson.practice && lesson.practice.length > 0 && (
          <Reveal delay={0.15}>
            <div className="space-y-6">
              <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
                <h2 className="mb-4 text-xl font-bold text-ink sm:text-2xl">✍️ Practice</h2>
                <p className="text-sm text-muted sm:text-base">Apply what you learned with these exercises.</p>
              </div>

              {lesson.practice.map((q, qIdx) => (
                <div key={qIdx} className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
                  <p className="mb-4 text-sm font-semibold text-ink sm:text-base">
                    {qIdx + 1}. {q.q}
                  </p>
                  <div className="space-y-2">
                    {q.choices.map((choice, cIdx) => {
                      const isSelected = practiceAnswers[qIdx] === cIdx;
                      const isCorrect = cIdx === q.answerIdx;
                      const showResult = showPracticeResults && isSelected;

                      return (
                        <button
                          key={cIdx}
                          onClick={() => !showPracticeResults && handlePracticeAnswer(qIdx, cIdx)}
                          disabled={showPracticeResults}
                          className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                            showResult
                              ? isCorrect
                                ? 'border-ok bg-ok-soft text-ok'
                                : 'border-bad bg-bad-soft text-bad'
                              : isSelected
                              ? 'border-brand bg-brand-soft text-brand'
                              : 'border-line bg-elevated text-ink hover:border-brand hover:bg-brand-soft/50'
                          }`}
                        >
                          {'ABCD'[cIdx]}. {choice}
                          {showResult && (isCorrect ? ' ✓' : ' ✗')}
                        </button>
                      );
                    })}
                  </div>
                  {showPracticeResults && q.why && (
                    <div className="mt-3 rounded-lg bg-elevated p-3 text-xs text-muted">
                      💡 {q.why}
                    </div>
                  )}
                </div>
              ))}

              {!showPracticeResults ? (
                <button
                  onClick={checkPractice}
                  disabled={practiceAnswers.includes(null)}
                  className="w-full rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
                >
                  Submit Practice
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-ok bg-ok-soft p-6 text-center">
                    <div className="mb-2 text-4xl">✨</div>
                    <h3 className="text-xl font-bold text-ok">Lesson Complete!</h3>
                    <p className="mt-2 text-sm text-ok">Great work! You've earned XP for completing this lesson.</p>
                  </div>
                  <button
                    onClick={completeLesson}
                    className="w-full rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-deep"
                  >
                    Back to Path
                  </button>
                </div>
              )}
            </div>
          </Reveal>
        )}
      </div>
      <TutorModal
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        skillSlug={skill}
        topicSlug={topic}
        pathId={pathId}
        lessonTitle={lesson?.title || ''}
      />
    </>
  );
}
