const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());

// OpenAI APIキーの確認
if (!process.env.OPENAI_API_KEY) {
  console.error('エラー: OPENAI_API_KEYが設定されていません');
  console.log('.envファイルにOPENAI_API_KEY=your_api_keyを追加してください');
} else {
  console.log('✓ OpenAI APIキーが読み込まれました');
  console.log('APIキーの最初の10文字:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');
}

// 問題生成エンドポイント
app.post('/api/generate-question', async (req, res) => {
  try {
    const { terms } = req.body;
    
    if (!terms) {
      return res.status(400).json({ error: '用語が提供されていません' });
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'あなたは教育アプリケーションのための問題作成者です。提供された用語とその説明に基づいて、学習者の理解度を測るための問題を作成してください。'
          },
          {
            role: 'user',
            content: `以下の用語に基づいて、理解度を測る問題を1つ作成してください。問題文のみを出力してください。\n\n${terms}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const question = data.choices[0].message.content.trim();
    
    res.json({ question });
    
  } catch (error) {
    console.error('問題生成エラー:', error);
    res.status(500).json({ error: error.message || '問題の生成に失敗しました' });
  }
});

// 回答採点エンドポイント
app.post('/api/grade-answer', async (req, res) => {
  try {
    const { terms, question, userAnswer } = req.body;
    
    if (!terms || !question || !userAnswer) {
      return res.status(400).json({ error: '必要な情報が不足しています' });
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'あなたは教育アプリケーションの採点者です。学習者の回答を100点満点で採点し、詳細なフィードバックと模範解答を提供してください。JSON形式で返答してください: {"score": 数値, "feedback": "フィードバック文", "modelAnswer": "模範解答"}'
          },
          {
            role: 'user',
            content: `以下の情報に基づいて、学習者の回答を採点してください。\n\n【登録された用語】\n${terms}\n\n【問題】\n${question}\n\n【学習者の回答】\n${userAnswer}\n\nJSON形式で、スコア（0-100点）、フィードバック、模範解答を返してください。`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // JSON形式で返ってくることを期待
    let result;
    try {
      // JSON部分を抽出（マークダウンのコードブロックが含まれている場合に対応）
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(content);
      }
    } catch (parseError) {
      // JSON解析に失敗した場合のフォールバック
      result = {
        score: 50,
        feedback: content,
        modelAnswer: '模範解答の生成に失敗しました。'
      };
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('採点エラー:', error);
    res.status(500).json({ error: error.message || '採点に失敗しました' });
  }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'サーバーは正常に動作しています' });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
  console.log(`http://localhost:${PORT}`);
});
