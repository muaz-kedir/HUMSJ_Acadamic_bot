/**
 * ================================
 * AI Service (Day 12-13)
 * ================================
 * 
 * AI-powered features using Groq/Llama-3
 * - Document summarization
 * - Flashcard generation
 * - Quiz generation
 * - Mind map concepts
 */

const axios = require('axios');
const { log } = require('./logger');

// AI Configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';
const MAX_TEXT_LENGTH = 20000;
const MAX_TOKENS = 4096;

/**
 * Call Groq API
 */
async function callGroqAPI(prompt, systemPrompt, maxTokens = MAX_TOKENS) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }
  
  try {
    const response = await axios.post(GROQ_API_URL, {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    
    return response.data.choices[0].message.content;
    
  } catch (error) {
    log.error('Groq API error', { error: error.message });
    throw new Error(`AI service error: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Trim text to max length
 */
function trimText(text, maxLength = MAX_TEXT_LENGTH) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '\n\n[Content trimmed for processing...]';
}

/**
 * Generate document summary
 */
async function generateSummary(text, title = 'Document') {
  const trimmedText = trimText(text);
  
  const systemPrompt = `You are an academic assistant helping university students understand study materials. 
You provide clear, well-structured summaries that help students learn effectively.
Always respond in clean plaintext format.`;

  const prompt = `Please summarize the following academic document titled "${title}":

${trimmedText}

Provide:
1. A SHORT SUMMARY (3-5 sentences that capture the main points)
2. A DETAILED SUMMARY with:
   - Key concepts and definitions
   - Main topics covered (use bullet points)
   - Important relationships between concepts
   - Practical applications if mentioned

Format your response clearly with headers.`;

  const result = await callGroqAPI(prompt, systemPrompt);
  
  // Parse the result into short and long summaries
  // Look for sections separated by headers like **Short Summary:** or ## Short Summary
  const shortMatch = result.match(/\*{0,2}(short|brief|quick)\s*summary\*{0,2}:?\s*\n?([\s\S]*?)(?=\*{0,2}(detailed|long|key|main|\n\n\*{2})|$)/i);
  const longMatch = result.match(/\*{0,2}(detailed|long)\s*summary\*{0,2}:?\s*\n?([\s\S]*?)$/i);
  
  let shortSummary = '';
  let longSummary = '';
  
  if (shortMatch && shortMatch[2]) {
    shortSummary = shortMatch[2].replace(/\*{2,}/g, '').trim();
  }
  
  if (longMatch && longMatch[2]) {
    longSummary = longMatch[2].replace(/\*{2,}/g, '').trim();
  }
  
  // Fallback: split by double newlines if no sections found
  if (!shortSummary && !longSummary) {
    const sections = result.split(/\n\n+/);
    if (sections.length >= 2) {
      // First paragraph is short, rest is long
      shortSummary = sections[0].replace(/^\*{2}[^*]+\*{2}\s*/, '').trim();
      longSummary = sections.slice(1).join('\n\n').trim();
    } else {
      // Just use the whole thing
      shortSummary = result.substring(0, 500).trim();
      longSummary = result.trim();
    }
  }
  
  // Clean up markdown formatting
  shortSummary = shortSummary.replace(/^\*{2}[^*]+\*{2}\s*/gm, '').trim();
  longSummary = longSummary.replace(/^\*{2}[^*]+\*{2}\s*/gm, '').trim();
  
  return {
    short: shortSummary || 'Summary generated. See detailed view.',
    long: longSummary || result.trim(),
    raw: result
  };
}

/**
 * Generate flashcards
 */
async function generateFlashcards(text, title = 'Document', count = 25) {
  const trimmedText = trimText(text);
  
  const systemPrompt = `You are an academic assistant creating study flashcards for university students.
Create clear, educational flashcards that test understanding of key concepts.
Return ONLY valid JSON array, no other text.`;

  const prompt = `Create ${count} academic flashcards from this document titled "${title}":

${trimmedText}

Return a JSON array with this exact format:
[
  {"front": "Question about concept?", "back": "Clear answer explaining the concept"},
  {"front": "Define term X", "back": "Definition of term X"}
]

Include:
- Definition questions
- Concept explanation questions
- Application questions
- Comparison questions

Return ONLY the JSON array, no other text.`;

  const result = await callGroqAPI(prompt, systemPrompt);
  
  // Parse JSON from response
  try {
    // Find JSON array in response
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const flashcards = JSON.parse(jsonMatch[0]);
      return flashcards.filter(f => f.front && f.back);
    }
  } catch (e) {
    log.error('Flashcard JSON parse error', { error: e.message });
  }
  
  // Fallback: create basic flashcards from text
  return [
    { front: `What is the main topic of "${title}"?`, back: 'Please review the document for details.' }
  ];
}

/**
 * Generate quiz questions
 */
async function generateQuiz(text, title = 'Document') {
  const trimmedText = trimText(text);
  
  const systemPrompt = `You are an academic assistant creating university-level quizzes.
Create challenging but fair questions that test understanding.
Format questions clearly with numbers and proper spacing.`;

  const prompt = `Create a 30-question university-level quiz from this document titled "${title}":

${trimmedText}

Include exactly:
- 10 Multiple Choice Questions (MCQ) with options A, B, C, D
- 5 True/False Questions
- 10 Fill-in-the-blank Questions
- 5 Conceptual Short Answer Questions

Format:
MULTIPLE CHOICE (10 questions)
1. Question text?
   A) Option A
   B) Option B
   C) Option C
   D) Option D
   Answer: X

TRUE/FALSE (5 questions)
11. Statement here.
    Answer: True/False

FILL IN THE BLANK (10 questions)
16. The _____ is responsible for...
    Answer: term

SHORT ANSWER (5 questions)
26. Explain the concept of...
    Answer: Brief explanation

Make questions educational and test real understanding.`;

  const result = await callGroqAPI(prompt, systemPrompt, 6000);
  return result;
}

/**
 * Generate mind map concepts (text-based)
 */
async function generateMindMapConcepts(text, title = 'Document') {
  const trimmedText = trimText(text, 10000);
  
  const systemPrompt = `You are an academic assistant creating visual mind map structures.
Organize information hierarchically with clear relationships.`;

  const prompt = `Create a text-based mind map structure for this document titled "${title}":

${trimmedText}

Format as a hierarchical structure:
🎯 MAIN TOPIC: [Title]
├── 📌 Subtopic 1
│   ├── • Key point 1.1
│   ├── • Key point 1.2
│   └── • Key point 1.3
├── 📌 Subtopic 2
│   ├── • Key point 2.1
│   └── • Key point 2.2
└── 📌 Subtopic 3
    ├── • Key point 3.1
    └── • Key point 3.2

Include 4-6 main subtopics with 2-4 key points each.
Use emojis to make it visually appealing.`;

  const result = await callGroqAPI(prompt, systemPrompt);
  return result;
}

/**
 * Check if AI service is available
 */
function isAIAvailable() {
  return !!process.env.GROQ_API_KEY;
}

module.exports = {
  generateSummary,
  generateFlashcards,
  generateQuiz,
  generateMindMapConcepts,
  isAIAvailable,
  trimText
};
