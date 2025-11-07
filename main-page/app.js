// グローバル変数
let terms = [];
let currentQuestion = '';
let currentTermIndex = null; // 現在学習中の用語のインデックス
let currentQuizMode = null; // 'practice' または 'levelup'
let learningHistory = [];

// レベルシステムの定義
const LEVEL_CONFIG = {
  1: { name: 'Lv1 初回', minHours: 0, maxHours: 0, color: '#ff6b6b' },
  2: { name: 'Lv2 短期', minHours: 2, maxHours: 5, color: '#ff8c42' },
  3: { name: 'Lv3 1日', minHours: 24, maxHours: 48, color: '#ffd93d' },
  4: { name: 'Lv4 3日', minHours: 72, maxHours: 96, color: '#6bcf7f' },
  5: { name: 'Lv5 1週', minHours: 168, maxHours: 192, color: '#4d96ff' },
  6: { name: 'Lv6 2週', minHours: 336, maxHours: 360, color: '#9d4edd' },
  7: { name: 'Lv7 完璧', minHours: 744, maxHours: 768, color: '#ff006e' }
};

// ローカルストレージからデータを読み込む
function loadData() {
  const savedTerms = localStorage.getItem('terms');
  const savedHistory = localStorage.getItem('learningHistory');
  
  if (savedTerms) {
    terms = JSON.parse(savedTerms);
    // 既存データにレベル情報がない場合は追加
    terms = terms.map(term => ({
      ...term,
      level: term.level || 0,
      nextReviewDate: term.nextReviewDate || null,
      lastReviewDate: term.lastReviewDate || null,
      correctCount: term.correctCount || 0,
      totalAttempts: term.totalAttempts || 0
    }));
  }
  
  if (savedHistory) {
    learningHistory = JSON.parse(savedHistory);
  }
}

// データを保存
function saveData() {
  localStorage.setItem('terms', JSON.stringify(terms));
  localStorage.setItem('learningHistory', JSON.stringify(learningHistory));
}

// ナビゲーション機能
function navigateTo(section) {
  // すべてのセクションを非表示
  document.querySelectorAll('.content-section').forEach(sec => {
    sec.classList.remove('active');
  });
  
  // すべてのナビアイテムを非アクティブ
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // 選択されたセクションを表示
  document.getElementById(`section-${section}`).classList.add('active');
  
  // 選択されたナビアイテムをアクティブ
  document.querySelector(`[data-section="${section}"]`).classList.add('active');
  
  // セクション別の初期化処理
  if (section === 'register') {
    displayTerms();
  } else if (section === 'quiz') {
    initQuizSection();
  } else if (section === 'history') {
    displayHistory();
  } else if (section === 'dictionary') {
    displayDictionary();
  }
}

// === レベルシステム関連機能 ===
function calculateNextReviewDate(currentLevel) {
  const now = new Date();
  const config = LEVEL_CONFIG[currentLevel + 1];
  
  if (!config || currentLevel >= 7) {
    return null; // レベル7に到達したら復習不要
  }
  
  // 次回復習日を計算（最小時間と最大時間の中間値を使用）
  const hoursUntilNextReview = (config.minHours + config.maxHours) / 2;
  const nextDate = new Date(now.getTime() + hoursUntilNextReview * 60 * 60 * 1000);
  
  return nextDate.toISOString();
}

function isReadyForReview(term) {
  if (term.level === 0) return true; // Lv0は未学習なので常にレビュー可能
  if (term.level >= 7) return false; // Lv7は完璧なので復習不要
  if (!term.nextReviewDate) return true;
  
  const now = new Date();
  const nextReview = new Date(term.nextReviewDate);
  
  return now >= nextReview;
}

function getLevelBadgeHTML(level) {
  if (level === 0) {
    return '<span class="level-badge level-0">未学習</span>';
  }
  const config = LEVEL_CONFIG[level];
  return `<span class="level-badge" style="background: ${config.color}">${config.name}</span>`;
}

function getNextReviewText(term) {
  if (term.level === 0) return '初回学習';
  if (term.level >= 7) return '完璧！';
  if (!term.nextReviewDate) return '復習可能';
  
  const now = new Date();
  const nextReview = new Date(term.nextReviewDate);
  
  if (now >= nextReview) {
    return '<span class="ready-review">復習可能！</span>';
  }
  
  const diffMs = nextReview - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `あと${diffDays}日後`;
  } else if (diffHours > 0) {
    return `あと${diffHours}時間後`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `あと${diffMinutes}分後`;
  }
}

// === 用語登録機能 ===
function addTerm() {
  const termName = document.getElementById('termName').value.trim();
  const termDescription = document.getElementById('termDescription').value.trim();
  
  if (!termName || !termDescription) {
    alert('用語名と説明を両方入力してください。');
    return;
  }
  
  terms.push({
    name: termName,
    description: termDescription,
    addedDate: new Date().toISOString(),
    level: 0,
    nextReviewDate: null,
    lastReviewDate: null,
    correctCount: 0,
    totalAttempts: 0
  });
  
  saveData();
  
  // 入力フィールドをクリア
  document.getElementById('termName').value = '';
  document.getElementById('termDescription').value = '';
  
  // リストを更新
  displayTerms();
  
  alert(`「${termName}」を追加しました！`);
}

function displayTerms() {
  const termsList = document.getElementById('termsList');
  termsList.innerHTML = '';
  
  if (terms.length === 0) {
    termsList.innerHTML = '<p class="no-data">まだ用語が登録されていません</p>';
    return;
  }
  
  terms.forEach((term, index) => {
    const termCard = document.createElement('div');
    termCard.className = 'term-card';
    
    const progress = term.level > 0 ? (term.level / 7) * 100 : 0;
    
    termCard.innerHTML = `
      <div class="term-header">
        <h4>${term.name}</h4>
        ${getLevelBadgeHTML(term.level)}
      </div>
      <div class="level-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%; background: ${LEVEL_CONFIG[term.level] ? LEVEL_CONFIG[term.level].color : '#ccc'}"></div>
        </div>
        <span class="progress-text">${term.level}/7</span>
      </div>
      <p>${term.description}</p>
      <div class="term-stats">
        <span>📅 ${getNextReviewText(term)}</span>
        <span>✅ ${term.correctCount}/${term.totalAttempts}回正解</span>
      </div>
      <button onclick="deleteTerm(${index})" class="btn btn-danger">削除</button>
    `;
    termsList.appendChild(termCard);
  });
}

function deleteTerm(index) {
  if (confirm(`「${terms[index].name}」を削除してもよろしいですか？`)) {
    terms.splice(index, 1);
    saveData();
    displayTerms();
  }
}

// === 問題を解く機能 ===
function initQuizSection() {
  const noTermsMessage = document.getElementById('noTermsMessage');
  const quizContent = document.getElementById('quizContent');
  
  if (terms.length === 0) {
    noTermsMessage.style.display = 'block';
    quizContent.style.display = 'none';
  } else {
    noTermsMessage.style.display = 'none';
    quizContent.style.display = 'block';
    
    // 復習可能な用語数を表示
    const reviewableTerms = terms.filter(term => isReadyForReview(term));
    const reviewCountEl = document.getElementById('reviewableCount');
    if (reviewCountEl) {
      if (reviewableTerms.length > 0) {
        reviewCountEl.textContent = `復習可能: ${reviewableTerms.length}件`;
        reviewCountEl.style.display = 'inline-block';
      } else {
        reviewCountEl.textContent = '復習可能な用語がありません';
        reviewCountEl.style.background = '#999';
        reviewCountEl.style.display = 'inline-block';
      }
    }
    
    // クイズの初期状態を表示
    document.getElementById('quizStart').style.display = 'block';
    document.getElementById('quizGenerating').style.display = 'none';
    document.getElementById('quizQuestion').style.display = 'none';
    document.getElementById('quizGrading').style.display = 'none';
    document.getElementById('quizResult').style.display = 'none';
  }
}

async function startQuiz(mode) {
  currentQuizMode = mode;
  
  let selectedTerms;
  
  if (mode === 'practice') {
    // 練習モード: すべての用語から出題
    selectedTerms = terms;
    
    if (selectedTerms.length === 0) {
      alert('用語が登録されていません。');
      return;
    }
  } else if (mode === 'levelup') {
    // レベルアップモード: 復習可能な用語のみ
    selectedTerms = terms.filter((term, index) => {
      const ready = isReadyForReview(term);
      if (ready) {
        console.log(`復習可能: ${term.name} (Lv${term.level})`);
      }
      return ready;
    });
    
    if (selectedTerms.length === 0) {
      alert('現在復習可能な用語がありません。後でもう一度お試しください。');
      return;
    }
  }
  
  // ランダムに用語を選択
  const randomTerm = selectedTerms[Math.floor(Math.random() * selectedTerms.length)];
  currentTermIndex = terms.findIndex(t => t.name === randomTerm.name);
  
  // 状態を切り替え
  document.getElementById('quizStart').style.display = 'none';
  document.getElementById('quizGenerating').style.display = 'block';
  document.getElementById('quizQuestion').style.display = 'none';
  document.getElementById('quizResult').style.display = 'none';
  
  try {
    const termsContext = `用語: ${randomTerm.name}\n説明: ${randomTerm.description}`;
    
    const response = await fetch('http://localhost:3000/api/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ terms: termsContext })
    });
    
    if (!response.ok) {
      throw new Error('問題の生成に失敗しました');
    }
    
    const data = await response.json();
    currentQuestion = data.question;
    
    // 問題を表示
    const modeBadge = mode === 'practice' 
      ? '<span class="mode-badge practice">📝 練習モード</span>' 
      : '<span class="mode-badge levelup">🎯 レベルアップモード</span>';
    
    document.getElementById('questionText').innerHTML = `
      ${modeBadge}
      <div class="quiz-term-info">
        ${getLevelBadgeHTML(randomTerm.level)}
        <span class="quiz-term-name">${randomTerm.name}</span>
      </div>
      <p>${currentQuestion}</p>
    `;
    document.getElementById('userAnswer').value = '';
    document.getElementById('quizGenerating').style.display = 'none';
    document.getElementById('quizQuestion').style.display = 'block';
    
  } catch (error) {
    console.error('Error:', error);
    alert('問題の生成中にエラーが発生しました。サーバーが起動しているか確認してください。');
    document.getElementById('quizGenerating').style.display = 'none';
    document.getElementById('quizStart').style.display = 'block';
    currentTermIndex = null;
  }
}

async function submitAnswer() {
  const userAnswer = document.getElementById('userAnswer').value.trim();
  
  if (!userAnswer) {
    alert('回答を入力してください。');
    return;
  }
  
  if (currentTermIndex === null) {
    alert('エラー: 用語情報が見つかりません');
    return;
  }
  
  // 採点中の表示
  document.getElementById('quizQuestion').style.display = 'none';
  document.getElementById('quizGrading').style.display = 'block';
  
  try {
    const currentTerm = terms[currentTermIndex];
    const termsContext = `用語: ${currentTerm.name}\n説明: ${currentTerm.description}`;
    
    const response = await fetch('http://localhost:3000/api/grade-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        terms: termsContext,
        question: currentQuestion,
        userAnswer: userAnswer
      })
    });
    
    if (!response.ok) {
      throw new Error('採点に失敗しました');
    }
    
    const data = await response.json();
    
    // 用語のレベルを更新（70点以上で合格）
    const passed = data.score >= 70;
    const oldLevel = currentTerm.level;
    
    let levelUpMessage = '';
    let levelChangeText = '';
    
    // モード別の処理
    if (currentQuizMode === 'practice') {
      // 練習モード: レベルに影響しない
      levelUpMessage = `<div class="practice-info">
        📝 練習モードのため、レベルには影響しません
      </div>`;
      levelChangeText = `練習 (Lv${oldLevel}維持)`;
      
      // 統計情報のみ更新
      terms[currentTermIndex].totalAttempts++;
      if (passed) {
        terms[currentTermIndex].correctCount++;
      }
      
    } else if (currentQuizMode === 'levelup') {
      // レベルアップモード: レベルに影響する
      terms[currentTermIndex].totalAttempts++;
      terms[currentTermIndex].lastReviewDate = new Date().toISOString();
      
      if (passed) {
        // 正解: レベルアップ
        terms[currentTermIndex].correctCount++;
        
        if (currentTerm.level < 7) {
          terms[currentTermIndex].level++;
          terms[currentTermIndex].nextReviewDate = calculateNextReviewDate(currentTerm.level);
          
          const newLevel = terms[currentTermIndex].level;
          levelUpMessage = `<div class="level-up-animation">
            🎉 レベルアップ！ ${oldLevel} → ${newLevel}
          </div>`;
          levelChangeText = `${oldLevel} → ${newLevel}`;
          
          if (newLevel === 7) {
            levelUpMessage = `<div class="level-up-animation level-max">
              🏆 完璧にマスターしました！Lv7達成！
            </div>`;
          }
        }
      } else {
        // 不正解: レベルリセット
        terms[currentTermIndex].level = 0;
        terms[currentTermIndex].nextReviewDate = null;
        levelUpMessage = `<div class="level-reset-animation">
          ❌ レベルがリセットされました... ${oldLevel} → 0
        </div>`;
        levelChangeText = `${oldLevel} → 0 (リセット)`;
      }
    }
    
    // 学習履歴に追加
    learningHistory.unshift({
      date: new Date().toISOString(),
      termName: currentTerm.name,
      question: currentQuestion,
      userAnswer: userAnswer,
      score: data.score,
      feedback: data.feedback,
      modelAnswer: data.modelAnswer,
      mode: currentQuizMode === 'practice' ? '練習' : 'レベルアップ',
      levelChange: levelChangeText
    });
    
    // 履歴は最新50件まで保存
    if (learningHistory.length > 50) {
      learningHistory = learningHistory.slice(0, 50);
    }
    
    saveData();
    
    // 結果を表示
    document.getElementById('scoreValue').textContent = data.score;
    document.getElementById('feedbackText').innerHTML = levelUpMessage + data.feedback;
    document.getElementById('userAnswerDisplay').textContent = userAnswer;
    document.getElementById('modelAnswerDisplay').textContent = data.modelAnswer;
    
    document.getElementById('quizGrading').style.display = 'none';
    document.getElementById('quizResult').style.display = 'block';
    
  } catch (error) {
    console.error('Error:', error);
    alert('採点中にエラーが発生しました。サーバーが起動しているか確認してください。');
    document.getElementById('quizGrading').style.display = 'none';
    document.getElementById('quizQuestion').style.display = 'block';
  }
}

// === 学習記録機能 ===
function displayHistory() {
  // 統計情報の更新
  const totalQuestions = learningHistory.length;
  const averageScore = totalQuestions > 0 
    ? Math.round(learningHistory.reduce((sum, h) => sum + h.score, 0) / totalQuestions)
    : 0;
  const totalTerms = terms.length;
  
  document.getElementById('totalQuestions').textContent = totalQuestions;
  document.getElementById('averageScore').textContent = averageScore;
  document.getElementById('totalTerms').textContent = totalTerms;
  
  // 履歴リストの表示
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  
  if (learningHistory.length === 0) {
    historyList.innerHTML = '<p class="no-data">まだ学習履歴がありません</p>';
    return;
  }
  
  learningHistory.forEach((item, index) => {
    const date = new Date(item.date);
    const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="history-item-header">
        <div class="history-item-date">${dateStr}</div>
        <div class="history-item-score">${item.score}点</div>
      </div>
      ${item.termName ? `<div class="history-item-term">📚 ${item.termName} ${item.mode ? `[${item.mode}]` : ''} ${item.levelChange ? `(${item.levelChange})` : ''}</div>` : ''}
      <div class="history-item-question">${item.question.substring(0, 100)}${item.question.length > 100 ? '...' : ''}</div>
    `;
    historyList.appendChild(historyItem);
  });
}

function clearHistory() {
  if (confirm('学習履歴をすべて削除してもよろしいですか？')) {
    learningHistory = [];
    saveData();
    displayHistory();
    alert('学習履歴を削除しました。');
  }
}

// === 用語集機能 ===
function displayDictionary() {
  const dictionaryList = document.getElementById('dictionaryList');
  const noDictionaryData = document.getElementById('noDictionaryData');
  
  if (terms.length === 0) {
    dictionaryList.style.display = 'none';
    noDictionaryData.style.display = 'block';
    return;
  }
  
  dictionaryList.style.display = 'grid';
  noDictionaryData.style.display = 'none';
  dictionaryList.innerHTML = '';
  
  terms.forEach(term => {
    const dictItem = document.createElement('div');
    dictItem.className = 'dictionary-item';
    const progress = term.level > 0 ? (term.level / 7) * 100 : 0;
    dictItem.innerHTML = `
      <div class="term-header">
        <h4>${term.name}</h4>
        ${getLevelBadgeHTML(term.level)}
      </div>
      <div class="level-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%; background: ${LEVEL_CONFIG[term.level] ? LEVEL_CONFIG[term.level].color : '#ccc'}"></div>
        </div>
        <span class="progress-text">${term.level}/7</span>
      </div>
      <p>${term.description}</p>
      <div class="term-stats">
        <span>📅 ${getNextReviewText(term)}</span>
      </div>
    `;
    dictionaryList.appendChild(dictItem);
  });
}

function searchTerms() {
  const searchValue = document.getElementById('searchTerm').value.toLowerCase();
  const dictionaryList = document.getElementById('dictionaryList');
  
  dictionaryList.innerHTML = '';
  
  const filteredTerms = terms.filter(term => 
    term.name.toLowerCase().includes(searchValue) || 
    term.description.toLowerCase().includes(searchValue)
  );
  
  if (filteredTerms.length === 0) {
    dictionaryList.innerHTML = '<p class="no-data">該当する用語が見つかりませんでした</p>';
    return;
  }
  
  filteredTerms.forEach(term => {
    const dictItem = document.createElement('div');
    dictItem.className = 'dictionary-item';
    const progress = term.level > 0 ? (term.level / 7) * 100 : 0;
    dictItem.innerHTML = `
      <div class="term-header">
        <h4>${term.name}</h4>
        ${getLevelBadgeHTML(term.level)}
      </div>
      <div class="level-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%; background: ${LEVEL_CONFIG[term.level] ? LEVEL_CONFIG[term.level].color : '#ccc'}"></div>
        </div>
        <span class="progress-text">${term.level}/7</span>
      </div>
      <p>${term.description}</p>
      <div class="term-stats">
        <span>📅 ${getNextReviewText(term)}</span>
      </div>
    `;
    dictionaryList.appendChild(dictItem);
  });
}

// === 初期化 ===
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  navigateTo('register');
});
