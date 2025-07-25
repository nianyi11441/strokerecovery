import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, Award, Smile, Frown, Meh, Loader, Send, MessageSquare } from 'lucide-react';

const App = () => { // Renamed from StrokeRecoveryMVP to App as per Railway's suggestion
  // Environment variable for demo mode
  // During local development, `process.env.REACT_APP_DEMO_MODE` will be undefined or "false" unless explicitly set.
  // On platforms like Railway/Render, it will pick up the environment variable.
  const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true';

  const [score, setScore] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseType, setExerciseType] = useState(null);
  const [digitSpanSequence, setDigitSpanSequence] = useState([]);
  const [userInputDigitSpan, setUserInputDigitSpan] = useState('');
  const [feedback, setFeedback] = useState('');
  const [animalCount, setAnimalCount] = useState(0);
  const [animalInput, setAnimalInput] = useState('');
  const [animalList, setAnimalList] = useState(new Set());
  const [selectiveAttentionTargets, setSelectiveAttentionTargets] = useState([]);
  const [selectiveAttentionInput, setSelectiveAttentionInput] = useState('');
  const [selectiveAttentionScore, setSelectiveAttentionScore] = useState(0);
  const [mood, setMood] = useState(null);
  const [crisisChatInput, setCrisisChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesEndRef = useRef(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  // Load data from localStorage on initial render
  useEffect(() => {
    if (!isDemoMode) {
      const savedScore = localStorage.getItem('recoveryScore');
      const savedSessionCount = localStorage.getItem('recoverySessionCount');
      const savedMood = localStorage.getItem('userMood');

      if (savedScore) setScore(parseInt(savedScore));
      if (savedSessionCount) setSessionCount(parseInt(savedSessionCount));
      if (savedMood) setMood(savedMood);
    } else {
      // Demo mode pre-filled data
      setScore(1500);
      setSessionCount(25);
      setMood('positive');
      setChatHistory([
        { sender: 'AI', text: "Hello! I'm here to support you. How are you feeling today?" },
        { sender: 'You', text: "I'm feeling a bit down after my last check-up." },
        { sender: 'AI', text: "It's completely normal to feel that way. Remember, progress isn't always linear, and every small step counts. What's on your mind right now?" }
      ]);
    }
    setShowWelcomeModal(true); // Always show welcome modal on app start
  }, [isDemoMode]);

  // Save data to localStorage whenever score or sessionCount changes
  useEffect(() => {
    if (!isDemoMode) {
      localStorage.setItem('recoveryScore', score);
      localStorage.setItem('recoverySessionCount', sessionCount);
      localStorage.setItem('userMood', mood);
    }
  }, [score, sessionCount, mood, isDemoMode]);

  // Scroll to the bottom of the chat history
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleStartExercise = (type) => {
    setExerciseType(type);
    setExerciseStarted(true);
    setFeedback('');
    if (type === 'digitSpan') {
      startDigitSpan();
    } else if (type === 'animalNaming') {
      startAnimalNaming();
    } else if (type === 'selectiveAttention') {
      startSelectiveAttention();
    }
  };

  const startDigitSpan = () => {
    let sequence = [];
    for (let i = 0; i < 5; i++) {
      sequence.push(Math.floor(Math.random() * 10));
    }
    setDigitSpanSequence(sequence);
    setUserInputDigitSpan('');
    setFeedback('Memorize the sequence...');
    setTimeout(() => {
      setFeedback(`Sequence: ${sequence.join(' ')}`);
      setTimeout(() => {
        setFeedback('Enter the sequence:');
        setUserInputDigitSpan('');
      }, 3000); // Display sequence for 3 seconds
    }, 1000); // Give a moment before showing sequence
  };

  const checkDigitSpan = () => {
    if (userInputDigitSpan.trim() === digitSpanSequence.join('')) {
      setFeedback('Correct! +50 points');
      setScore(prev => prev + 50);
    } else {
      setFeedback(`Incorrect. Correct was: ${digitSpanSequence.join(' ')}`);
      setScore(prev => Math.max(0, prev - 20)); // Don't go below 0
    }
    endExercise();
  };

  const startAnimalNaming = () => {
    setAnimalCount(0);
    setAnimalInput('');
    setAnimalList(new Set());
    setFeedback('Name as many animals as you can in 60 seconds. Press Enter after each animal.');
    setTimeout(() => {
      setFeedback('Time is up! You named ' + animalCount + ' animals. + ' + (animalCount * 10) + ' points.');
      setScore(prev => prev + (animalCount * 10));
      endExercise();
    }, 60000); // 60 seconds
  };

  const handleAnimalInput = (e) => {
    if (e.key === 'Enter' && animalInput.trim() !== '') {
      const animal = animalInput.trim().toLowerCase();
      if (!animalList.has(animal)) {
        setAnimalList(prev => new Set(prev).add(animal));
        setAnimalCount(prev => prev + 1);
        setFeedback(`Named: ${animal}. Total: ${animalCount + 1}`);
      } else {
        setFeedback(`"${animal}" already named.`);
      }
      setAnimalInput('');
    }
  };

  const startSelectiveAttention = () => {
    const symbols = ['O', 'X', 'A', 'B'];
    let targets = [];
    let display = [];
    for (let i = 0; i < 20; i++) {
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      display.push(randomSymbol);
      if (randomSymbol === 'X') {
        targets.push(i); // Store index of 'X'
      }
    }
    setSelectiveAttentionTargets(targets);
    setSelectiveAttentionInput('');
    setSelectiveAttentionScore(0);
    setFeedback(`Find all 'X's. Enter their positions (1-20) separated by spaces. Sequence: ${display.join(' ')}`);
  };

  const checkSelectiveAttention = () => {
    const correctTargets = selectiveAttentionTargets.map(index => index + 1).sort((a, b) => a - b);
    const userNumbers = selectiveAttentionInput.split(' ').map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);

    if (JSON.stringify(correctTargets) === JSON.stringify(userNumbers)) {
      setFeedback('Perfect! +75 points');
      setScore(prev => prev + 75);
    } else {
      setFeedback(`Incorrect. Correct positions: ${correctTargets.join(', ')}`);
      setScore(prev => Math.max(0, prev - 30));
    }
    endExercise();
  };

  const endExercise = () => {
    setExerciseStarted(false);
    setSessionCount(prev => prev + 1);
    setDigitSpanSequence([]);
    setUserInputDigitSpan('');
    setAnimalInput('');
    setAnimalList(new Set());
    setSelectiveAttentionTargets([]);
    setSelectiveAttentionInput('');
    setSelectiveAttentionScore(0);
    setTimeout(() => setFeedback(''), 2000); // Clear feedback after 2 seconds
  };

  const handleMoodSelection = (selectedMood) => {
    setMood(selectedMood);
    setFeedback(`You selected: ${selectedMood}. Thanks for sharing.`);
    // Optionally trigger AI response based on mood for advanced integration
  };

  const handleCrisisChat = async () => {
    if (crisisChatInput.trim() === '') return;

    const userMessage = { sender: 'You', text: crisisChatInput };
    setChatHistory(prev => [...prev, userMessage]);
    setCrisisChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.REACT_APP_GEMINI_API_KEY, // Use environment variable
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a supportive, empathetic, and encouraging AI assistant for stroke recovery patients. Provide positive reinforcement, practical advice (if applicable and safe), and emotional support. Avoid medical advice. Keep responses concise and focused. Respond to the following user message: "${crisisChatInput}"`
            }]
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I\'m sorry, I could not generate a response at this time.';
      setChatHistory(prev => [...prev, { sender: 'AI', text: aiResponseText }]);

    } catch (error) {
      console.error("Error communicating with Gemini API:", error);
      setChatHistory(prev => [...prev, { sender: 'AI', text: 'I apologize, something went wrong. Please try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white flex flex-col items-center justify-center p-4">

      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-800 p-8 rounded-lg shadow-xl max-w-lg w-full text-center">
            <h2 className="text-3xl font-bold mb-4 text-blue-700">Welcome to Your Stroke Recovery App!</h2>
            <p className="mb-4">
              This app is designed to help you with your cognitive recovery through engaging exercises and provide emotional support.
            </p>
            <p className="mb-6">
              **Note: If you are seeing pre-filled data or example chat messages, you are in DEMO MODE.**
              This is for demonstration purposes. For your personal recovery tracking, please ensure the app is not in demo mode.
              (If you are a beta tester, your progress will be saved in your browser.)
            </p>
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg transition duration-300"
            >
              Start My Recovery Journey
            </button>
          </div>
        </div>
      )}

      <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-center drop-shadow-lg">
        Stroke Recovery Companion
      </h1>

      <div className="bg-white text-gray-800 rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Progress & Stats */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4 text-purple-700">My Progress</h2>
          <div className="flex items-center space-x-4 mb-4">
            <Award className="text-yellow-500" size={36} />
            <p className="text-4xl font-bold text-green-600">{score} <span className="text-xl font-normal text-gray-600">points</span></p>
          </div>
          <p className="text-lg text-gray-700 mb-4">
            Total Sessions Completed: <span className="font-bold text-blue-600">{sessionCount}</span>
          </p>
          <div className="mt-4 w-full">
            <h3 className="text-xl font-semibold mb-3 text-purple-700">How are you feeling today?</h3>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleMoodSelection('positive')}
                className={`p-3 rounded-full ${mood === 'positive' ? 'bg-green-200' : 'bg-gray-200'} hover:bg-green-100 transition`}
                title="Positive"
              >
                <Smile className="text-green-500" size={32} />
              </button>
              <button
                onClick={() => handleMoodSelection('neutral')}
                className={`p-3 rounded-full ${mood === 'neutral' ? 'bg-yellow-200' : 'bg-gray-200'} hover:bg-yellow-100 transition`}
                title="Neutral"
              >
                <Meh className="text-yellow-500" size={32} />
              </button>
              <button
                onClick={() => handleMoodSelection('negative')}
                className={`p-3 rounded-full ${mood === 'red-500' ? 'bg-red-200' : 'bg-gray-200'} hover:bg-red-100 transition`}
                title="Negative"
              >
                <Frown className="text-red-500" size={32} />
              </button>
            </div>
            {feedback && <p className="text-sm mt-3 text-center text-gray-600">{feedback}</p>}
          </div>
        </div>

        {/* Cognitive Exercises */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4 text-purple-700">Cognitive Exercises</h2>
          {!exerciseStarted ? (
            <div className="grid grid-cols-1 gap-4 w-full">
              <button
                onClick={() => handleStartExercise('digitSpan')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center space-x-2"
              >
                <Lightbulb size={20} />
                <span>Digit Span Test</span>
              </button>
              <button
                onClick={() => handleStartExercise('animalNaming')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center space-x-2"
              >
                <Lightbulb size={20} />
                <span>Animal Naming</span>
              </button>
              <button
                onClick={() => handleStartExercise('selectiveAttention')}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center space-x-2"
              >
                <Lightbulb size={20} />
                <span>Selective Attention</span>
              </button>
            </div>
          ) : (
            <div className="w-full text-center">
              <p className="text-xl font-bold mb-4 text-blue-700">{feedback}</p>
              {exerciseType === 'digitSpan' && feedback.includes('Enter the sequence:') && (
                <>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={userInputDigitSpan}
                    onChange={(e) => setUserInputDigitSpan(e.target.value)}
                    placeholder="e.g., 1 2 3 4 5"
                    autoFocus
                  />
                  <button
                    onClick={checkDigitSpan}
                    className="mt-4 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-5 rounded-lg transition duration-300"
                  >
                    Check
                  </button>
                </>
              )}
              {exerciseType === 'animalNaming' && (
                <>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={animalInput}
                    onChange={(e) => setAnimalInput(e.target.value)}
                    onKeyPress={handleAnimalInput}
                    placeholder="Type animal name and press Enter"
                    autoFocus
                  />
                  <p className="mt-3 text-lg">Animals Named: <span className="font-bold">{animalCount}</span></p>
                  <ul className="text-sm text-gray-600 mt-2 list-disc list-inside">
                    {Array.from(animalList).map((animal, index) => (
                      <li key={index}>{animal}</li>
                    ))}
                  </ul>
                </>
              )}
              {exerciseType === 'selectiveAttention' && feedback.includes('Enter their positions:') && (
                <>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={selectiveAttentionInput}
                    onChange={(e) => setSelectiveAttentionInput(e.target.value)}
                    placeholder="e.g., 2 5 10 18"
                    autoFocus
                  />
                  <button
                    onClick={checkSelectiveAttention}
                    className="mt-4 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-5 rounded-lg transition duration-300"
                  >
                    Check
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Crisis Management Chatbot */}
        <div className="col-span-1 md:col-span-2 bg-gray-50 p-6 rounded-lg shadow-md flex flex-col">
          <h2 className="text-2xl font-semibold mb-4 text-purple-700 flex items-center space-x-2">
            <MessageSquare size={24} />
            <span>Crisis Management Chatbot</span>
          </h2>
          <div className="flex-grow bg-white border border-gray-200 rounded-md p-4 overflow-y-auto mb-4 h-64">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`mb-2 ${msg.sender === 'You' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block px-3 py-1 rounded-lg ${msg.sender === 'You' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  <strong>{msg.sender}:</strong> {msg.text}
                </span>
              </div>
            ))}
            {isTyping && (
              <div className="mb-2 text-left">
                <span className="inline-block px-3 py-1 rounded-lg bg-gray-100 text-gray-800">
                  <Loader className="inline animate-spin mr-2" size={16} />AI is typing...
                </span>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>
          <div className="flex">
            <input
              type="text"
              className="flex-grow p-3 border border-gray-300 rounded-l-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Type your message..."
              value={crisisChatInput}
              onChange={(e) => setCrisisChatInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCrisisChat();
              }}
            />
            <button
              onClick={handleCrisisChat}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-r-md transition duration-300 flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;