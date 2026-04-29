import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const GEMINI_API_KEY = 'AIzaSyA8MFUPchp3DMkjHoD-SnmRrHc_r21TZsk';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_CONTEXT = `You are a specialized AI assistant for CLV Predictor AI, a Customer Lifetime Value prediction application.
⚠️ IMPORTANT RULES:
1. ONLY answer questions related to CLV (Customer Lifetime Value), the application features, and customer data analysis
2. For ANY question NOT related to CLV Predictor AI, customer lifetime value, or business analytics: REFUSE and say "I can't help with that. I'm specialized to help with CLV (Customer Lifetime Value) predictions and using the CLV Predictor AI application. Please ask me about CLV-related topics!"
3. Do NOT answer general knowledge questions, weather, sports, politics, entertainment, coding help, or any non-CLV topics
4. Be firm but polite when declining off-topic questions

Key features of the application:
1. **Dashboard**: Overview of customer metrics, CLV, churn rates, and segment distribution
2. **Data Upload**: Users can upload their own CSV files or use sample datasets (Amazon, Flipkart, Tata, BMW, Tesla)
3. **CLV Prediction**: Predicts Customer Lifetime Value using Google Gemini AI
4. **Churn Analysis**: Analyzes churn probability and risk factors
5. **Analytics**: Deep dive into customer behavior, demographics, and trends
6. **AI Insights**: AI-generated recommendations and industry benchmarking
7. **User Management**: Role-based access control (Admin, Analyst, Viewer)
8. **Settings**: API configuration, prediction parameters, notifications

Sample datasets available:
- Amazon (100 e-commerce customers)
- Flipkart (100 e-commerce customers)  
- Tata (100 automotive customers)
- BMW (100 luxury automotive customers)
- Tesla (100 electric vehicle customers)

How CLV prediction works:
1. Upload customer data (CSV) or select a sample dataset
2. Click "Run Prediction" to analyze all records
3. Google Gemini AI analyzes each customer and predicts:
   - Customer Lifetime Value (CLV) in dollars
   - Churn probability percentage
   - Customer segment (High Value, Medium Value, Low Value, At Risk)
   - Key factors influencing the prediction
   - Personalized recommendations

User roles:
- Admin: Full access including user management and settings
- Analyst: Can upload data, run predictions, and export results
- Viewer: Can view dashboards and analytics only

Be helpful, concise, and friendly. ALWAYS refuse non-CLV related questions politely.`;

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your CLV Predictor AI assistant. I can help you understand how to use this application, explain features, or answer questions about customer lifetime value predictions. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-6).map(m => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n');

      const prompt = `${SYSTEM_CONTEXT}

Previous conversation:
${conversationHistory}

User: ${userMessage.content}

Provide a helpful, concise response about the CLV Predictor AI application. Keep your response focused and under 200 words unless more detail is specifically requested.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
          }
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const assistantContent = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        "I'm sorry, I couldn't process that request. Please try again.";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getFallbackResponse(userMessage.content),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const getFallbackResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    // CLV-related keywords
    const clvKeywords = ['clv', 'lifetime', 'predict', 'churn', 'customer', 'value', 'revenue', 'segment', 'data', 'upload', 'analytics', 'dashboard', 'insight', 'dataset', 'csv', 'amazon', 'flipkart', 'tata', 'bmw', 'tesla', 'export', 'analysis', 'retention'];
    
    // Check if question is CLV-related
    const isClvRelated = clvKeywords.some(keyword => lowerQuery.includes(keyword));
    
    // List of clearly off-topic patterns
    const offTopicPatterns = [
      /^(what|who|when|where|why|how).*(weather|sports|music|movie|game|recipe|joke|funny|help me|can you help|write|code|program|debug|fix|tutorial|learn|teach|explain python|explain javascript|html|css|math problem)/i,
      /^(tell me|sing|tell a|make me|create|generate).*(joke|song|story|poem|riddle)$/i,
      /^(what is|who is|wikipedia|google|search).*([a-z]+ [a-z]+)$/i,
      /^(thank you|thanks|ok|bye|goodbye|see you|have a nice|good night)$/i,
      /(weather today|temperature|forecast|climate|covid|politics|election|movie review|book recommendation|restaurant)/i
    ];
    
    const isOffTopic = offTopicPatterns.some(pattern => pattern.test(query));
    
    // If it looks off-topic and not CLV-related, refuse
    if (isOffTopic || !isClvRelated) {
      return "I can't help with that. 🛑 I'm specialized to help with CLV (Customer Lifetime Value) predictions and the CLV Predictor AI application. Please ask me about:\n\n• CLV predictions\n• Churn analysis\n• Uploading customer data\n• Using sample datasets\n• Dashboard features\n• Analytics and insights\n• Customer segmentation\n• Exporting results";
    }
    
    if (lowerQuery.includes('upload') || lowerQuery.includes('data')) {
      return "To upload data, go to the 'Data Upload' page from the sidebar. You can either drag and drop a CSV file or choose from our sample datasets (Amazon, Flipkart, Tata, BMW, Tesla). Each sample dataset contains 100 customer records for testing.";
    }
    
    if (lowerQuery.includes('predict') || lowerQuery.includes('clv') || lowerQuery.includes('lifetime')) {
      return "Customer Lifetime Value (CLV) prediction works by analyzing customer data using Google Gemini AI. After uploading or selecting a dataset, click 'Run Prediction' to get predictions including CLV amount, churn probability, customer segment, and personalized recommendations.";
    }
    
    if (lowerQuery.includes('churn')) {
      return "The Churn Analysis page shows customers at risk of leaving. It displays risk distribution, top churn factors, and a list of at-risk customers. You can see churn rates by category and take action with retention offers.";
    }
    
    if (lowerQuery.includes('dashboard') || lowerQuery.includes('home')) {
      return "The Dashboard shows an overview of your prediction results including total customers, average CLV, churn rate, and customer segments. Charts visualize CLV by category, segment distribution, and top high-value customers.";
    }
    
    if (lowerQuery.includes('dark') || lowerQuery.includes('light') || lowerQuery.includes('theme')) {
      return "You can toggle between dark and light mode using the sun/moon icon in the top right corner of the header. Your preference is saved automatically.";
    }
    
    if (lowerQuery.includes('sample') || lowerQuery.includes('dataset')) {
      return "We provide 5 sample datasets for testing: Amazon, Flipkart, Tata, BMW, and Tesla. Each contains 100 synthetic customer records with realistic data. Go to 'Data Upload' and click on any company name to generate and preview the data.";
    }
    
    if (lowerQuery.includes('export') || lowerQuery.includes('download')) {
      return "After running predictions, you can export results to CSV from the Prediction page. Click the 'Export Results' button to download a file containing all customer predictions including CLV, churn probability, and segments.";
    }
    
    return "I can help you with CLV Predictor AI! You can ask me about:\n\n• Uploading customer data\n• Running predictions\n• Understanding CLV and churn analysis\n• Using sample datasets\n• Navigating the dashboard\n• Exporting results\n\nWhat would you like to know more about?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "How do I upload data?",
    "What is CLV?",
    "Show me sample datasets",
    "How does prediction work?"
  ];

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all hover:scale-110"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500 items-center justify-center">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-96 max-h-[80vh] h-[60vh] sm:h-[32rem] flex flex-col bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">CLV AI Assistant</h3>
                  <p className="text-xs text-indigo-100">Powered by Gemini AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800/50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  }`}>
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[60%] rounded-2xl px-4 py-2.5 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-md shadow-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white dark:bg-slate-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions (only show when few messages) */}
            {messages.length <= 2 && !isTyping && (
              <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(q);
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isTyping}
                  className="flex-1 rounded-full border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent dark:bg-slate-800 dark:text-white disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
