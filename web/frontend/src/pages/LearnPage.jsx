import React, { useState } from 'react';
import { BookOpen, CheckCircle, Target, ArrowRight, Lightbulb, Sparkles, Layers } from 'lucide-react';
import { INITIAL_PATTERNS } from '../services/languageDataService';

export default function LearnPage() {
  const [difficulty, setDifficulty] = useState('Beginner');
  const [selectedPattern, setSelectedPattern] = useState(INITIAL_PATTERNS[0]);
  const [userCustomSentence, setUserCustomSentence] = useState('');
  const [patternFeedback, setPatternFeedback] = useState('');
  
  // Daily Goals State
  const [goals, setGoals] = useState({
    wordsLearned: 3,
    wordsGoal: 5,
    sentencesPracticed: 4,
    sentencesGoal: 5,
    conversationDone: 1,
    conversationGoal: 1
  });

  // Beginner Explanations Catalog
  const beginnerLessons = [
    {
      title: "Present Perfect Continuous: 'I have been working...'",
      sentence: "I have been working here for two years.",
      hindi: "मैं यहाँ दो साल से काम कर रहा हूँ।",
      explanation: "Think of an action that started in the past (2 years ago) and is still continuing right now in this exact moment. English uses 'have been + -ing' and Hindi uses 'से + कर रहा हूँ'.",
      examples: [
        "I have been waiting for 10 minutes. (10 मिनट से इंतज़ार कर रहा हूँ)",
        "She has been studying since morning. (वह सुबह से पढ़ाई कर रही है)"
      ]
    },
    {
      title: "Natural Availability vs 'Free': Avoid 'स्वतंत्र'",
      sentence: "Are you free now?",
      hindi: "क्या तुम अभी फ्री हो?",
      explanation: "In textbook Hindi, 'free' is often translated as 'स्वतंत्र' (independent/liberated). However, in everyday texting and conversation, always use 'फ्री' or 'खाली'. Calling a friend 'स्वतंत्र' sounds unnaturally robotic!",
      examples: [
        "Natural: क्या तुम अभी फ्री हो?",
        "Avoid: क्या तुम अभी स्वतंत्र हो?"
      ]
    },
    {
      title: "Past Tense: 'Yesterday' vs 'Am Going'",
      sentence: "Yesterday, I went to the market.",
      hindi: "कल मैं बाज़ार गया था।",
      explanation: "When you mention 'yesterday' (कल), the action is finished in the past. In English, never say 'Yesterday I am going' — you must use the past form 'went'.",
      examples: [
        "Correct: Yesterday I went home.",
        "Incorrect: Yesterday I go / am going home."
      ]
    }
  ];

  // 3-Language Bridge Tri-Lingual Table
  const bridgePhrases = [
    { en: "Where are you going?", hi: "तुम कहाँ जा रहे हो?", te: "నువ్వు ఎక్కడికి వెళ్తున్నావు?" },
    { en: "I am at home right now.", hi: "मैं अभी घर पर हूँ।", te: "నేను ప్రస్తుతం ఇంట్లోనే ఉన్నాను." },
    { en: "Take care and see you soon.", hi: "अपना ख्याल रखना और जल्दी मिलते हैं।", te: "జాగ్రత్తగా ఉండు, త్వరలో కలుద్దాం." },
    { en: "Can you please call me?", hi: "क्या आप कृपया मुझे कॉल कर सकते हैं?", te: "మీరు దయచేసి నాకు కాల్ చేయగలరా?" },
    { en: "I will definitely be there.", hi: "मैं पक्का वहाँ पहुँचूँगा।", te: "నేను ఖచ్చితంగా అక్కడ ఉంటాను." }
  ];

  const handleTestPattern = () => {
    if (!userCustomSentence.trim()) return;
    const lower = userCustomSentence.toLowerCase();
    if (selectedPattern.id === 'pattern-1' && lower.includes('i want to')) {
      setPatternFeedback('✓ Excellent! Your sentence matches the "I want to + [verb]" pattern perfectly.');
    } else if (selectedPattern.id === 'pattern-2' && lower.includes('can you please')) {
      setPatternFeedback('✓ Perfect polite request formulation!');
    } else if (selectedPattern.id === 'pattern-3' && lower.includes('have been')) {
      setPatternFeedback('✓ Great job! Correct continuous aspect applied.');
    } else {
      setPatternFeedback('✓ Good attempt! Make sure to begin with the core pattern formula.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Title & Level Picker */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Language Learning & Patterns</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Learn natural conversational structures, grammar formulas, and the three-language bridge.
          </p>
        </div>

        {/* Difficulty Level Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Level:</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <option value="Beginner">Beginner</option>
            <option value="Elementary">Elementary</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Upper Intermediate">Upper Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Daily Learning Goals Banner */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: 'var(--surface-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Target size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Today's Learning Goal</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span>Learn 5 Vocabulary Words</span>
              <strong>{goals.wordsLearned} / {goals.wordsGoal}</strong>
            </div>
            <div style={{ height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(goals.wordsLearned / goals.wordsGoal) * 100}%`, height: '100%', background: 'var(--accent-gradient)' }} />
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span>Practice 5 Sentences</span>
              <strong>{goals.sentencesPracticed} / {goals.sentencesGoal}</strong>
            </div>
            <div style={{ height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(goals.sentencesPracticed / goals.sentencesGoal) * 100}%`, height: '100%', background: '#10b981' }} />
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span>1 Conversation Practice</span>
              <strong>{goals.conversationDone} / {goals.conversationGoal}</strong>
            </div>
            <div style={{ height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: '#f59e0b' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Explain Like I'm a Beginner */}
      <h3 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>
        Explain Like I'm a Beginner
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {beginnerLessons.map((item, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Lightbulb size={18} color="#f59e0b" />
              <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{item.title}</h4>
            </div>

            <div style={{ background: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '10px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.sentence}</div>
              <div style={{ color: 'var(--accent-primary)', fontSize: '0.85rem' }}>{item.hindi}</div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              {item.explanation}
            </p>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <strong>Examples:</strong>
              {item.examples.map((ex, i) => (
                <div key={i} style={{ marginTop: '2px' }}>• {ex}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Section 2: Essential Sentence Patterns & Interactive Builder */}
      <h3 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>
        Essential Sentence Patterns
      </h3>
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px' }}>
          {INITIAL_PATTERNS.map(pat => (
            <button
              key={pat.id}
              onClick={() => {
                setSelectedPattern(pat);
                setPatternFeedback('');
                setUserCustomSentence('');
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: selectedPattern.id === pat.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: selectedPattern.id === pat.id ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                color: selectedPattern.id === pat.id ? '#fff' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {pat.pattern}
            </button>
          ))}
        </div>

        {/* Selected Pattern Details */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Formula: {selectedPattern.pattern}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '10px' }}>
            {selectedPattern.explanation}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Hindi Formula</span>
              <strong>{selectedPattern.hindi_formula}</strong>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Telugu Formula</span>
              <strong>{selectedPattern.telugu_formula}</strong>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem' }}>
            <strong>Pattern Examples:</strong>
            {selectedPattern.examples.map((eg, i) => (
              <div key={i} style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                • <strong>{eg.english}</strong> → {eg.hindi} ({eg.telugu})
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Builder */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
            Build your own sentence using this pattern:
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="input-field"
              placeholder={`e.g. ${selectedPattern.practice_prompt || 'Type your sentence here...'}`}
              value={userCustomSentence}
              onChange={(e) => setUserCustomSentence(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestPattern()}
            />
            <button onClick={handleTestPattern} className="btn-primary" style={{ padding: '0 20px', flexShrink: 0 }}>
              Verify
            </button>
          </div>

          {patternFeedback && (
            <div style={{ marginTop: '10px', fontSize: '0.88rem', color: '#10b981', fontWeight: 600 }}>
              {patternFeedback}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: English • Hindi • Telugu Bridge */}
      <h3 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>
        Three-Language Bridge (English • Hindi • Telugu)
      </h3>
      <div className="glass-card" style={{ padding: '20px', overflowX: 'auto', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid var(--border-subtle)' }}>
              <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>English</th>
              <th style={{ padding: '10px 14px', color: 'var(--accent-primary)', fontWeight: 600 }}>Hindi (हिन्दी)</th>
              <th style={{ padding: '10px 14px', color: '#10b981', fontWeight: 600 }}>Telugu (తెలుగు)</th>
            </tr>
          </thead>
          <tbody>
            {bridgePhrases.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 500 }}>{row.en}</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>{row.hi}</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{row.te}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
