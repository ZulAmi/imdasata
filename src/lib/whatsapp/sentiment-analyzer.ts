export interface SentimentResult {
  score: number; // -1 (negative) to 1 (positive)
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export class SentimentAnalyzer {
  private positiveWords = [
    'happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic',
    'joy', 'love', 'peace', 'calm', 'relaxed', 'grateful', 'thankful', 'blessed'
  ];

  private negativeWords = [
    'sad', 'bad', 'terrible', 'awful', 'horrible', 'depressed', 'anxious',
    'worried', 'scared', 'angry', 'frustrated', 'hopeless', 'worthless', 'lonely'
  ];

  async analyzeText(text: string): Promise<SentimentResult> {
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;

    words.forEach(word => {
      if (this.positiveWords.includes(word)) {
        positiveScore++;
      } else if (this.negativeWords.includes(word)) {
        negativeScore++;
      }
    });

    const totalWords = words.length;
    const netScore = (positiveScore - negativeScore) / Math.max(totalWords, 1);
    
    // Normalize score to -1 to 1 range
    const normalizedScore = Math.max(-1, Math.min(1, netScore * 5));
    
    let label: 'positive' | 'negative' | 'neutral';
    if (normalizedScore > 0.1) {
      label = 'positive';
    } else if (normalizedScore < -0.1) {
      label = 'negative';
    } else {
      label = 'neutral';
    }

    const confidence = Math.abs(normalizedScore);

    return {
      score: normalizedScore,
      label,
      confidence
    };
  }

  async analyzeVoice(mediaUrl: string): Promise<SentimentResult> {
    // For now, return a neutral sentiment
    // In production, you would integrate with speech-to-text and sentiment analysis APIs
    try {
      // Placeholder for voice analysis
      // You could integrate with services like:
      // - Google Cloud Speech-to-Text + Natural Language API
      // - AWS Transcribe + Comprehend
      // - Azure Speech Services + Text Analytics
      
      console.log(`Analyzing voice from: ${mediaUrl}`);
      
      // Return neutral sentiment as placeholder
      return {
        score: 0,
        label: 'neutral',
        confidence: 0.5
      };
    } catch (error) {
      console.error('Error analyzing voice sentiment:', error);
      return {
        score: 0,
        label: 'neutral',
        confidence: 0
      };
    }
  }

  async analyzeMood(moodLevel: number, notes?: string): Promise<SentimentResult> {
    let baseScore = (moodLevel - 5.5) / 4.5; // Convert 1-10 scale to -1 to 1
    
    if (notes) {
      const textSentiment = await this.analyzeText(notes);
      // Blend mood level with text sentiment (70% mood, 30% text)
      baseScore = (baseScore * 0.7) + (textSentiment.score * 0.3);
    }

    const normalizedScore = Math.max(-1, Math.min(1, baseScore));
    
    let label: 'positive' | 'negative' | 'neutral';
    if (normalizedScore > 0.1) {
      label = 'positive';
    } else if (normalizedScore < -0.1) {
      label = 'negative';
    } else {
      label = 'neutral';
    }

    return {
      score: normalizedScore,
      label,
      confidence: Math.abs(normalizedScore)
    };
  }
}