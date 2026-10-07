import React, { useState } from 'react';
import { Brain, CheckCircle, XCircle, Sparkles, MessageSquare, Award, ArrowRight, RotateCcw, HelpCircle, Check, Copy } from 'lucide-react';
import { INITIAL_MISTAKES, INITIAL_ROLEPLAYS, INITIAL_VOCABULARY } from '../services/languageDataService';
import { translationClient } from '../services/translationClient';

export default function PracticePage() {
  const [activeTab, setActiveTab] = useState('corrections'); // 'corrections', 'mistakes', 'wotd', 'tryfirst', 'roleplay'

  // Correct My English State
  const [correctionInput, setCorrectionInput] = useState('Yesterday I am going market.');
  const [correctionResult, setCorrectionResult] = useState(null);
  const [isCorrecting, setIsCorrecting] = useState(false);

  // Common Mistakes Quiz State
  const [currentMistakeIndex, setCurrentMistakeIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Try Yourself First State
  const [tryFirstIndex, setTryFirstIndex] = useState(0);
  const [userTryInput, setUserTryInput] = useState('');
  const [revealAnswer, setRevealAnswer] = useState(false);

  const tryFirstPrompts = [
    { hindi: "मैं कल ऑफिस गया था।", telugu: "నేను నిన్న ఆఫీస్‌కు వెళ్ళాను.", english: "I went to the office yesterday." },
    { hindi: "क्या तुम अभी फ्री हो?", telugu: "నువ్వు ఇప్పుడు ఖాళీగా ఉన్నావా?", english: "Are you free now?" },
    { hindi: "अपना ख्याल रखना।", telugu: "జాగ్రత్తగా ఉండు.", english: "Take care." },
    { hindi: "मैं तुम्हें कल कॉल करूँगा।", telugu: "నేను రేపు నీకు కాల్ చేస్తాను.", english: "I will call you tomorrow." }
  ];

  // Word of the Day State
  const wotd = {
    word: "Actually",
    hindi: "असल में",
    telugu: "నిజానికి",
    example: "Actually, I don't know the exact address.",
    example_hi: "असल में, मुझे सही पता नहीं मालूम।",
    quizQuestion: "Which Hindi word corresponds to 'Actually'?",
    options: ["असल में", "शायद", "हमेशा", "शायद ही"],
    correctAnswer: "असल में"
  };
  const [wotdSelected, setWotdSelected] = useState(null);

  // Roleplay Conversation State
  const [selectedRoleplay, setSelectedRoleplay] = useState(INITIAL_ROLEPLAYS[0]);
  const [roleplayMessages, setRoleplayMessages] = useState([
    { sender: 'persona', text: INITIAL_ROLEPLAYS[0].initial_message_en }
  ]);
  const [roleplayInput, setRoleplayInput] = useState('');
  const [roleplayReport, setRoleplayReport] = useState(null);

  // Handlers
  const handleRunCorrection = async () => {
    if (!correctionInput.trim()) return;
    setIsCorrecting(true);
    const res = await translationClient.correctText(correctionInput, 'en');
    setCorrectionResult(res);
    setIsCorrecting(false);
  };

  const handleSelectMistakeOption = (opt) => {
    setSelectedAnswer(opt);
    setShowExplanation(true);
  };

  const handleNextMistake = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentMistakeIndex((prev) => (prev + 1) % INITIAL_MISTAKES.length);
  };

  const handleRoleplaySend = async (textToSend = roleplayInput) => {
    const text = textToSend.trim();
    if (!text) return;

    const newMsgs = [...roleplayMessages, { sender: 'user', text }];
    setRoleplayMessages(newMsgs);
    setRoleplayInput('');

    // Call dynamic conversation partner turn (Gemini preferred with local fallback)
    const turnRes = await translationClient.getConversationTurn({
      scenario: selectedRoleplay,
      dialogueHistory: newMsgs,
      userMessage: text
    });

    const reply = turnRes.partnerReply || "That sounds great! Could you elaborate a bit more?";
    setRoleplayMessages([...newMsgs, {
      sender: 'persona',
      text: reply,
      engine: turnRes.engine
    }]);

    if (newMsgs.length >= 2) {
      const fb = turnRes.learningFeedback || {};
      setRoleplayReport({
        wellDone: fb.wellDone || "Great sentence flow, friendly greeting, and natural tone.",
        toImprove: fb.toImprove || "Try using idiomatic time connectors like 'in a bit'.",
        vocabularyBonus: fb.suggestedNextPhrases ? fb.suggestedNextPhrases.join(', ') : "elaborate, hang out, ping",
        engine: turnRes.engine
      });
    }
  };

  const currentMistake = INITIAL_MISTAKES[currentMistakeIndex];
  const currentTryFirst = tryFirstPrompts[tryFirstIndex];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Practice Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
        {[
          { id: 'corrections', label: 'Correct My English' },
          { id: 'mistakes', label: 'Common Mistakes' },
          { id: 'tryfirst', label: 'Try Yourself First' },
          { id: 'wotd', label: 'Word of the Day' },
          { id: 'roleplay', label: 'Conversation Practice' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              border: activeTab === tab.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: activeTab === tab.id ? 'var(--accent-gradient)' : 'var(--surface-card)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. CORRECT MY ENGLISH */}
      {activeTab === 'corrections' && (
        <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>Correct My English & Hindi</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '18px' }}>
            Check your sentences for common Indian English grammar pitfalls like "Yesterday I am going" or "Did you went".
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input
              type="text"
              className="input-field"
              value={correctionInput}
              onChange={(e) => setCorrectionInput(e.target.value)}
              placeholder="Enter sentence to verify..."
            />
            <button
              onClick={handleRunCorrection}
              disabled={isCorrecting || !correctionInput.trim()}
              className="btn-primary"
              style={{ padding: '0 24px', flexShrink: 0 }}
            >
              {isCorrecting ? 'Checking...' : 'Check'}
            </button>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Test typical mistakes:</span>
            {[
              "Yesterday I am going market.",
              "Did you went there?",
              "I am having two brothers.",
              "We will discuss about the project."
            ].map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCorrectionInput(s);
                }}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {correctionResult && (
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <CheckCircle size={20} color="#10b981" />
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#10b981' }}>
                  Better Formulation: "{correctionResult.corrected}"
                </h4>
              </div>

              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                <strong>Why:</strong> {correctionResult.explanation}
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '16px', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                📌 <strong>Grammar Rule:</strong> {correctionResult.rule}
              </div>

              {correctionResult.practice && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Quick Practice:</div>
                  <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{correctionResult.practice.question}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {correctionResult.practice.options.map((opt, i) => (
                      <button
                        key={i}
                        className="btn-secondary"
                        style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                        onClick={() => alert(opt === correctionResult.practice.correctAnswer ? '✓ Correct Answer!' : 'Try again!')}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. COMMON MISTAKES WORKBOOK */}
      {activeTab === 'mistakes' && currentMistake && (
        <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span className="badge-pill badge-on-device" style={{ marginBottom: '4px' }}>
                Mistake {currentMistakeIndex + 1} of {INITIAL_MISTAKES.length}
              </span>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Category: {currentMistake.category}</h3>
            </div>
            <button onClick={handleNextMistake} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
              Next Question →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>Incorrect</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{currentMistake.incorrect}</div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>Better</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{currentMistake.corrected}</div>
            </div>
          </div>

          {/* Interactive Fill-in-the-Blank */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '12px' }}>
              Practice: {currentMistake.practice_question}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {currentMistake.options.map((opt, i) => {
                const isSelected = selectedAnswer === opt;
                const isCorrect = opt === currentMistake.correct_answer;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectMistakeOption(opt)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? (isCorrect ? '1.5px solid #10b981' : '1.5px solid #ef4444') : '1px solid var(--border-subtle)',
                      background: isSelected ? (isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)') : 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div style={{ fontSize: '0.85rem', color: selectedAnswer === currentMistake.correct_answer ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                {selectedAnswer === currentMistake.correct_answer
                  ? `✓ Correct! ${currentMistake.explanation}`
                  : `✕ Not quite. Hint: ${currentMistake.hint}`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. TRY YOURSELF FIRST */}
      {activeTab === 'tryfirst' && (
        <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span className="badge-pill badge-on-device">Challenge {tryFirstIndex + 1} of {tryFirstPrompts.length}</span>
              <h3 style={{ fontSize: '1.2rem', margin: '4px 0 0 0' }}>Don't Translate Everything: Try Yourself First</h3>
            </div>
            <button
              onClick={() => {
                setTryFirstIndex((prev) => (prev + 1) % tryFirstPrompts.length);
                setUserTryInput('');
                setRevealAnswer(false);
              }}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              Next Prompt →
            </button>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>How would you say this in English?</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {currentTryFirst.hindi}
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              Telugu: {currentTryFirst.telugu}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Type your English attempt here..."
              value={userTryInput}
              onChange={(e) => setUserTryInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setRevealAnswer(true)}
            />
            <button
              onClick={() => setRevealAnswer(true)}
              className="btn-primary"
              style={{ padding: '0 20px', flexShrink: 0 }}
            >
              Show Answer
            </button>
          </div>

          {revealAnswer && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>NATURAL ENGLISH:</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                "{currentTryFirst.english}"
              </div>
              {userTryInput && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Your attempt: "{userTryInput}"
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. WORD OF THE DAY */}
      {activeTab === 'wotd' && (
        <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Award size={22} color="#f59e0b" />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Word of the Day</h3>
          </div>

          <div style={{ background: 'var(--accent-gradient)', color: '#fff', padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '20px', boxShadow: 'var(--shadow-glow)' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Daily Vocabulary Feature</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '6px 0' }}>{wotd.word}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Hindi: {wotd.hindi} • Telugu: {wotd.telugu}</div>
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '0.92rem' }}>
              Example: "{wotd.example}" ({wotd.example_hi})
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '18px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '10px' }}>
              Quick Quiz: {wotd.quizQuestion}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {wotd.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setWotdSelected(opt)}
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    borderColor: wotdSelected === opt ? (opt === wotd.correctAnswer ? '#10b981' : '#ef4444') : 'var(--border-subtle)',
                    background: wotdSelected === opt ? (opt === wotd.correctAnswer ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)') : 'var(--bg-secondary)'
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {wotdSelected && (
              <div style={{ marginTop: '10px', fontSize: '0.85rem', color: wotdSelected === wotd.correctAnswer ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                {wotdSelected === wotd.correctAnswer ? '✓ Correct! "असल में" means Actually.' : '✕ Incorrect. Try again!'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. CONVERSATION PRACTICE & ROLEPLAY */}
      {activeTab === 'roleplay' && (
        <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Conversation Practice & Role-Play</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Practice natural chatting with responsive conversational personas without embarrassment.
              </p>
            </div>

            {/* Scenario Picker */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {INITIAL_ROLEPLAYS.map(scen => (
                <button
                  key={scen.id}
                  onClick={() => {
                    setSelectedRoleplay(scen);
                    setRoleplayMessages([{ sender: 'persona', text: scen.initial_message_en }]);
                    setRoleplayReport(null);
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    background: selectedRoleplay.id === scen.id ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                    color: selectedRoleplay.id === scen.id ? '#fff' : 'var(--text-primary)'
                  }}
                >
                  {scen.icon} {scen.title}
                </button>
              ))}
            </div>
          </div>

          {/* Dialogue Box */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            height: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {roleplayMessages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: m.sender === 'user' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                  color: m.sender === 'user' ? '#fff' : 'var(--text-primary)',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  fontSize: '0.9rem'
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Suggested Reply Chips */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Ideas:</span>
            {selectedRoleplay.suggested_replies_en.map((rep, idx) => (
              <button
                key={idx}
                onClick={() => handleRoleplaySend(rep)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                "{rep}"
              </button>
            ))}
          </div>

          {/* User Input Row */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Respond in English or Hindi..."
              value={roleplayInput}
              onChange={(e) => setRoleplayInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRoleplaySend()}
            />
            <button
              onClick={() => handleRoleplaySend()}
              disabled={!roleplayInput.trim()}
              className="btn-primary"
              style={{ padding: '0 20px', flexShrink: 0 }}
            >
              Respond
            </button>
          </div>

          {/* Final Learning Report Card */}
          {roleplayReport && (
            <div className="animate-fade-in" style={{ marginTop: '20px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Award size={18} color="#10b981" />
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Learning Report Summary</h4>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <div>✓ <strong>What you did well:</strong> {roleplayReport.wellDone}</div>
                <div style={{ marginTop: '4px' }}>🎯 <strong>What to improve:</strong> {roleplayReport.toImprove}</div>
                <div style={{ marginTop: '4px' }}>💡 <strong>Bonus Vocabulary:</strong> {roleplayReport.vocabularyBonus}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
