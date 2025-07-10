import React, { useState, useEffect, useRef } from 'react';
import { Heart, Brain, CheckCircle, Play, Pause, RotateCcw, Home, Calendar } from 'lucide-react';

// --- ErrorBoundary Component (Conceptual for Demonstration) ---
// In a full application, you would wrap parts of your component tree
// with this ErrorBoundary to catch JavaScript errors in child components.
// For this single App component, it's illustrative.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-xl text-center my-8">
          <h2 className="text-xl font-bold mb-2">Oops! Something went wrong.</h2>
          <p className="mb-4">We're sorry for the inconvenience. Please try refreshing the page.</p>
          {/* For development, you might show error details: */}
          {/* <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details> */}
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Individual Brain Exercise Components ---

// Renders the original multiple-choice exercises
const LegacyExercise = ({ exercise, onComplete, isCompleted }) => (
  <>
    <h3 className="text-xl font-bold text-gray-800 mb-4">{exercise.title}</h3>
    <p className="text-gray-700 text-lg mb-6">{exercise.instruction}</p>
    <div className="grid grid-cols-1 gap-4">
      {exercise.options.map((option, index) => (
        <button
          key={index}
          onClick={() => {
            const isCorrect = (index === exercise.correct);
            onComplete(isCorrect);
          }}
          disabled={isCompleted}
          className={`w-full px-5 py-3 rounded-xl font-bold text-lg transition-colors ${
            isCompleted
              ? index === exercise.correct
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white opacity-50 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  </>
);

// Renders the Digit Span / Input Sequence exercise
const InputSequenceExercise = ({ exercise, onComplete, isCompleted }) => {
  const [input, setInput] = useState('');
  const [audioPlayed, setAudioPlayed] = useState(false);
  const synth = window.speechSynthesis;
  const utteranceRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount or when exercise changes
    return () => {
      if (synth.speaking) {
        synth.cancel();
      }
    };
  }, [exercise]);

  const speakNumbers = () => {
    if (synth.speaking) {
      synth.cancel(); // Stop any current speech
    }
    const utterance = new SpeechSynthesisUtterance(exercise.targetSequence.split('').join(' ')); // Read numbers with spaces
    utterance.lang = 'en-US'; // Set language
    utteranceRef.current = utterance; // Store ref to cancel later if needed

    utterance.onend = () => {
      setAudioPlayed(true);
    };

    synth.speak(utterance);
  };

  const handleSubmit = () => {
    const isCorrect = (input === exercise.targetSequence);
    onComplete({ isCorrect });
  };

  return (
    <>
      <h3 className="text-xl font-bold text-gray-800 mb-4">{exercise.title}</h3>
      <p className="text-gray-700 text-lg mb-6">{exercise.instruction}</p>

      <div className="flex flex-col items-center space-y-4 mb-6">
        {!audioPlayed && !isCompleted && (
          <button
            onClick={speakNumbers}
            className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-green-600"
            disabled={isCompleted}
          >
            <Play size={20} className="mr-2" /> Listen to Numbers
          </button>
        )}
        {audioPlayed && !isCompleted && (
           <button
             onClick={speakNumbers}
             className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500"
             disabled={isCompleted}
           >
             Re-listen
           </button>
        )}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter sequence"
          className="w-full p-3 border border-gray-300 rounded-lg text-center text-xl"
          disabled={isCompleted || !audioPlayed}
        />
        <button
          onClick={handleSubmit}
          disabled={isCompleted || !audioPlayed || input.length === 0}
          className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors"
        >
          Submit
        </button>
      </div>
    </>
  );
};

// Renders the Animal Naming / List Input exercise
const ListInputExercise = ({ exercise, onComplete, isCompleted }) => {
  const [currentWord, setCurrentWord] = useState('');
  const [submittedWords, setSubmittedWords] = useState(new Set());
  const [timer, setTimer] = useState(exercise.timeLimit);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);

  // Function to stop timer and complete the exercise
  const finishTest = () => {
    clearInterval(intervalRef.current); // Clear any running interval
    setIsActive(false); // Set internal state to inactive
    const validCount = Array.from(submittedWords).filter(word => exercise.validAnswers.includes(word.toLowerCase())).length;
    onComplete({ validCount }); // Notify parent about completion and results
  };

  const startTimer = () => {
    setIsActive(true);
    intervalRef.current = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          finishTest(); // Call the unified finish function when timer runs out
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  const addWord = () => {
    if (currentWord.trim() !== '' && !submittedWords.has(currentWord.trim().toLowerCase())) {
      setSubmittedWords(prev => new Set(prev).add(currentWord.trim().toLowerCase()));
      setCurrentWord('');
    }
  };

  // Effect to clean up the interval on component unmount
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []); // Empty dependency array ensures this runs only once on mount and unmount

  // Effect to react to external completion (e.g., parent changing exercise)
  // If isCompleted becomes true and test is still active, force stop it.
  useEffect(() => {
    if (isCompleted && isActive) {
      finishTest(); // Safely stop and mark as completed if parent dictates
    }
  }, [isCompleted, isActive]); // Depend on isCompleted and isActive to trigger when needed


  return (
    <>
      <h3 className="text-xl font-bold text-gray-800 mb-4">{exercise.title}</h3>
      <p className="text-gray-700 text-lg mb-6">{exercise.instruction}</p>
      <div className="text-2xl font-bold mb-4">Time Left: {timer}s</div>
      {!isActive && !isCompleted && timer === exercise.timeLimit && (
          <button onClick={startTimer} className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 mb-4">
            Start Test
          </button>
      )}
      {isActive && (
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') addWord(); }}
            placeholder="Type animal name"
            className="flex-1 p-3 border border-gray-300 rounded-lg text-xl"
            disabled={!isActive || isCompleted}
          />
          <button
            onClick={addWord}
            className="bg-blue-500 text-white px-5 py-3 rounded-lg font-bold hover:bg-blue-600"
            disabled={!isActive || isCompleted || currentWord.trim() === ''}
          >
            Add
          </button>
        </div>
      )}
      <div className="bg-gray-100 p-4 rounded-lg min-h-[100px] text-left">
        <h4 className="font-semibold text-gray-700 mb-2">Your Animals:</h4>
        {Array.from(submittedWords).length === 0 && <p className="text-gray-500 italic">None yet</p>}
        <div className="flex flex-wrap gap-2">
          {Array.from(submittedWords).map((word, idx) => (
            <span key={idx} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
              {word}
            </span>
          ))}
        </div>
      </div>
      {isCompleted && (
        <p className="mt-4 text-green-600 font-bold text-xl">
          Test Completed! You named {Array.from(submittedWords).filter(word => exercise.validAnswers.includes(word)).length} valid animals.
        </p>
      )}
    </>
  );
};

// Renders the Selective Attention / Stroop-like exercise
const SelectiveAttentionExercise = ({ exercise, onComplete, isCompleted }) => {
  const [errors, setErrors] = useState(0);
  const [correctClicks, setCorrectClicks] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const timeoutRef = useRef(null);

  const currentItem = exercise.items[currentItemIndex];

  const handleItemClick = (clickedColor) => {
    if (!testStarted || isCompleted) return;

    if (clickedColor === currentItem.correctAnswer) {
      setFeedback('Correct! ✅');
      setCorrectClicks(prev => prev + 1);
    } else {
      setFeedback('Incorrect! ❌');
      setErrors(prev => prev + 1);
    }

    // Move to next item after a short delay
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFeedback('');
      if (currentItemIndex < exercise.items.length - 1) {
        setCurrentItemIndex(prev => prev + 1);
      } else {
        // Test finished
        setTestStarted(false);
        onComplete({ errors, correctClicks });
      }
    }, 500); // Short delay for visual feedback
  };

  const startTest = () => {
    setTestStarted(true);
    setErrors(0);
    setCorrectClicks(0);
    setCurrentItemIndex(0);
    setFeedback('');
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <>
      <h3 className="text-xl font-bold text-gray-800 mb-4">{exercise.title}</h3>
      <p className="text-gray-700 text-lg mb-6">{exercise.instruction}</p>

      {!testStarted && !isCompleted && (
        <button
          onClick={startTest}
          className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 mb-4"
        >
          Start Attention Test
        </button>
      )}

      {testStarted && !isCompleted && currentItem && (
        <div className="flex flex-col items-center space-y-6">
          {/* Display the word in its actual color */}
          <div className="text-4xl font-bold p-8 rounded-lg" style={{ color: currentItem.color }}>
            {currentItem.word}
          </div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {/* Buttons show color names */}
            {['red', 'blue', 'green', 'yellow'].map((colorOption) => (
              <button
                key={colorOption}
                onClick={() => handleItemClick(colorOption)}
                style={{ backgroundColor: colorOption }} /* This sets the button background color */
                className={`text-white text-lg font-bold py-4 rounded-xl shadow-md transition-transform transform hover:scale-105
                  ${currentItem.color === colorOption ? 'border-2 border-white' : ''}
                `}
              >
                {colorOption.toUpperCase()}
              </button>
            ))}
          </div>
          {feedback && <p className={`text-xl font-semibold ${feedback.includes('Correct') ? 'text-green-600' : 'text-red-600'}`}>{feedback}</p>}
          <p className="text-gray-600">Item: {currentItemIndex + 1} / {exercise.items.length}</p>
        </div>
      )}
      {isCompleted && (
        <p className="mt-4 text-green-600 font-bold text-xl">
          Test Finished! Errors: {errors}, Correct: {correctClicks}.
        </p>
      )}
    </>
  );
};


// --- Static Data (Exercises, Moods, Chatbot Questions, Resources) ---
// Moved outside the component to prevent re-declarations on re-render.
const brainExercises = [
  // Original basic exercises (type is implicitly 'multiple_choice')
  { title: "Word Match", instruction: "Which word goes with 'Ocean'?", options: ["Water", "Car", "Book", "Phone"], correct: 0, difficulty: "Easy", clinicalNote: "Simple associative reasoning" },
  { title: "Color Memory", instruction: "What color was shown first?", options: ["Red", "Blue", "Green", "Yellow"], correct: 1, difficulty: "Easy", clinicalNote: "Basic visual recall" },
  { title: "Simple Math", instruction: "What is 5 + 3?", options: ["6", "7", "8", "9"], correct: 2, difficulty: "Easy", clinicalNote: "Fundamental arithmetic reasoning" },

  // New MoCA-inspired exercises (Quick Wins)
  {
    title: "Digit Span Forward (3 Digits)",
    instruction: "Listen to these numbers: 4-7-2. Now type them back in the same order.",
    type: "input_sequence",
    targetSequence: "472",
    difficulty: "Medium",
    clinicalNote: "Tests auditory working memory - based on WAIS-IV Digit Span"
  },
  {
    title: "Animal Naming (Fluency)",
    instruction: "Name as many animals as you can in 30 seconds. Type each one and press Enter.",
    type: "list_input",
    category: "animals",
    timeLimit: 30,
    validAnswers: ["dog", "cat", "lion", "tiger", "elephant", "giraffe", "zebra", "horse", "cow", "pig", "chicken", "duck", "bird", "fish", "shark", "whale", "dolphin", "mouse", "rat", "rabbit", "bear", "wolf", "fox", "deer", "sheep", "goat", "monkey", "panda", "koala", "penguin", "octopus", "snake", "lizard", "frog"],
    difficulty: "Medium",
    clinicalNote: "Semantic fluency test - measures language retrieval and executive function"
  },
  {
    title: "Selective Attention (Color-Word)",
    instruction: "Click the COLOR of the word, not what the word says. Start when ready.",
    type: "selective_attention",
    items: [
      { word: "RED", color: "blue", correctAnswer: "blue" },
      { word: "BLUE", color: "red", correctAnswer: "red" },
      { word: "GREEN", color: "green", correctAnswer: "green" },
      { word: "YELLOW", color: "yellow", correctAnswer: "yellow" },
      { word: "RED", color: "red", correctAnswer: "red" },
      { word: "BLUE", color: "green", correctAnswer: "green" }
    ],
    difficulty: "Hard",
    clinicalNote: "Based on Stroop Color-Word Interference Test - measures attention and cognitive flexibility"
  }
  // More advanced MoCA-style exercises could be added here later:
  // Trail Making, Clock Drawing, N-Back, etc., each requiring specific UI/logic
];

const moods = [
  { emoji: "😊", label: "Good", value: "good" },
  { emoji: "😐", label: "Okay", value: "okay" },
  { emoji: "😔", label: "Difficult", value: "difficult" }
];

const chatbotQuestions = [
  { text: "I'm sorry you're having a difficult day. Can you tell me a bit more about how you're feeling right now?", type: "open" },
  { text: "Have you been feeling hopeless or like things won't get better?", type: "choice", options: ["Not at all", "Sometimes", "Often", "Most of the time"] },
  { text: "Are you having thoughts of hurting yourself or ending your life?", type: "choice", options: ["No", "Sometimes cross my mind", "Yes, but I wouldn't act", "Yes, and I might act"] },
  { text: "Do you have someone you can talk to - family, friends, or a counselor?", type: "choice", options: ["Yes, many people", "A few people", "One person", "No one"] }
];

const exerciseCategories = {
  motor: {
    title: "Motor Skills", icon: "🤲", color: "bg-blue-500",
    exercises: [
      { id: "finger-flex-easy", title: "Finger Flexion (Easy)", duration: "5 minutes", difficulty: "Easy", description: "Gently bend and straighten each finger", instructions: ["Sit comfortably with hand on table", "Slowly make a fist, hold for 3 seconds", "Open hand fully, spreading fingers", "Repeat 10 times for each hand"], benefits: "Improves fine motor control and finger strength" },
      { id: "arm-slides-easy", title: "Arm Slides (Easy)", duration: "5 minutes", difficulty: "Easy", description: "Slide arm forward on a table for gentle movement", instructions: ["Sit at a table, place affected arm on a cloth", "Using your good hand, gently slide affected arm forward", "Slide back to starting position", "Repeat 10-15 times"], benefits: "Increases shoulder and elbow mobility gently" },
      { id: "arm-reaches-medium", title: "Arm Reaches (Medium)", duration: "10 minutes", difficulty: "Medium", description: "Controlled reaching exercises for shoulder mobility and coordination", instructions: ["Sit with back straight, feet flat on floor", "Reach affected arm forward as far as comfortable without pain", "Hold for 5 seconds, return slowly", "Reach to each side, then up if possible, maintaining control", "Repeat 5-10 times each direction"], benefits: "Increases shoulder range of motion and coordination" },
      { id: "grasp-release-medium", title: "Grasp & Release (Medium)", duration: "7 minutes", difficulty: "Medium", description: "Practice grasping and releasing small, soft objects", instructions: ["Sit at a table with small, soft objects (e.g., sponge, soft ball)", "Practice grasping an object, lifting it slightly", "Release the object onto the table", "Repeat with different objects, 10-15 times"], benefits: "Improves grip strength and hand-eye coordination" },
      { id: "object-manipulation-hard", title: "Object Manipulation (Hard)", duration: "10 minutes", difficulty: "Hard", description: "Practice picking up and moving smaller, varied objects", instructions: ["Place small objects (coins, buttons) on a table", "Pick up one object using thumb and forefinger", "Move it to another spot or into a container", "Repeat with various objects, focusing on precision"], benefits: "Enhances fine motor dexterity and precision grip" },
      { id: "standing-reach-hard", title: "Standing Arm Reaches (Hard)", duration: "10 minutes", difficulty: "Hard", description: "Dynamic arm reaches while standing for balance and strength", instructions: ["Stand near a sturdy surface for support if needed", "Reach affected arm forward and to the sides", "Add slight trunk rotation or gentle knee bend for increased challenge", "Focus on controlled movements and stability", "Repeat 8-12 times each direction"], benefits: "Improves balance, core strength, and functional arm movement" }
    ]
  },
  speech: {
    title: "Speech & Language", icon: "🗣️", color: "bg-green-500",
    exercises: [
      { id: "tongue-exercises-easy", title: "Tongue Strengthening (Easy)", duration: "5 minutes", difficulty: "Easy", description: "Exercises to improve speech clarity through tongue muscle strengthening", instructions: ["Stick tongue out as far as possible, hold 3 seconds", "Touch tongue to nose, then chin", "Move tongue side to side, touching corners of mouth", "Say 'La-La-La' clearly 10 times", "Repeat sequence 3 times"], benefits: "Strengthens tongue muscles for clearer speech and swallowing" },
      { id: "lip-mobility-easy", title: "Lip Mobility (Easy)", duration: "5 minutes", difficulty: "Easy", description: "Improve lip movement for articulation and facial expression", instructions: ["Pucker lips like kissing, hold 5 seconds", "Smile widely, hold 5 seconds", "Say 'Ooo-Eee-Ooo-Eee' 10 times", "Blow air through pursed lips", "Repeat entire sequence 3 times"], benefits: "Enhances lip coordination for better articulation" },
      { id: "reading-aloud-medium", title: "Reading Practice (Medium)", duration: "10 minutes", difficulty: "Medium", description: "Read simple sentences or short paragraphs aloud, focusing on clarity", instructions: ["Choose a short paragraph or news article", "Read slowly and clearly", "Focus on pronouncing each word fully and maintaining steady breath", "Take breaks between sentences", "Repeat difficult words 3 times"], benefits: "Improves speech fluency, pacing, and cognitive processing for reading aloud" },
      { id: "sentence-completion-medium", title: "Sentence Completion (Medium)", duration: "10 minutes", difficulty: "Medium", description: "Complete sentences using appropriate words to practice word retrieval", instructions: ["Read a sentence aloud with a missing word (e.g., 'The bird flies in the ___')", "Say the word that best completes the sentence (e.g., 'sky')", "Try to think of synonyms or related words", "Repeat with 10-15 different sentences"], benefits: "Enhances word finding, vocabulary, and semantic recall" },
      { id: "story-retell-hard", title: "Story Retelling (Hard)", duration: "15 minutes", difficulty: "Hard", description: "Listen to a short story or news clip and retell it in your own words", instructions: ["Listen to a short story (2-3 minutes) from a podcast or read aloud by someone", "After listening, try to retell the main points and characters in order", "Focus on clear speech, sentence structure, and detail recall", "Record yourself and listen back for self-correction"], benefits: "Improves auditory comprehension, memory, and expressive language organization" },
      { id: "complex-conversation-hard", title: "Complex Conversation (Hard)", duration: "15 minutes", difficulty: "Hard", description: "Engage in a structured conversation on a moderately complex topic", instructions: ["Choose a topic (e.g., a recent event, a hobby, a plan)", "Discuss with a family member or friend for 10-15 minutes", "Focus on contributing ideas, asking questions, and maintaining flow", "Aim for detailed responses and coherent arguments"], benefits: "Develops conversational skills, turn-taking, and complex thought expression" }
    ]
  },
  cognitive: {
    title: "Cognitive Training", icon: "🧠", color: "bg-purple-500",
    exercises: [
      { id: "memory-sequence-easy", title: "Memory Sequences (Easy)", duration: "5 minutes", difficulty: "Easy", description: "Remember and repeat short sequences of numbers or words", instructions: ["Start with 3 numbers: 2-7-4", "Repeat the sequence out loud", "Try with 4 numbers, then 5. Don't push too hard", "Practice with different starting sequences"], benefits: "Strengthens immediate recall and auditory working memory" },
      { id: "matching-pairs-easy", title: "Matching Pairs (Easy)", duration: "7 minutes", difficulty: "Easy", description: "Match simple pictures or cards to improve visual memory and attention", instructions: ["Use 4-6 pairs of matching cards (e.g., fruits, animals)", "Lay them face down and turn over two at a time to find a match", "Remember the location of each card", "Clear the board by finding all pairs"], benefits: "Enhances visual memory, concentration, and pattern recognition" },
      { id: "daily-planning-medium", title: "Daily Planning (Medium)", duration: "15 minutes", difficulty: "Medium", description: "Plan and organize daily activities, improving executive function", instructions: ["Write down 5-7 things you want to do today", "Put them in order of importance and logical sequence", "Estimate time needed for each task and assign specific times", "Create a simple schedule, considering realistic pacing", "Check off completed tasks throughout the day"], benefits: "Improves executive function, organization, and problem-solving skills" },
      { id: "word-finding-medium", title: "Word Finding (Medium)", duration: "10 minutes", difficulty: "Medium", description: "Practice finding words for categories or descriptions to improve language retrieval", instructions: ["Choose a category (colors, animals, food, professions)", "Name as many items as possible in 1 minute for that category", "Write them down if helpful", "Try a new category or describe items without naming them for added challenge"], benefits: "Improves language retrieval, vocabulary access, and semantic fluency" },
      { id: "problem-solving-hard", title: "Simple Problem Solving (Hard)", duration: "15 minutes", difficulty: "Hard", description: "Solve everyday problems or puzzles that require logical thinking", instructions: ["Read a simple scenario (e.g., 'You're out of milk, what do you do?')", "List 3-5 possible solutions and their pros/cons", "Choose the best solution and explain why", "Work on simple logic puzzles or crosswords"], benefits: "Develops critical thinking, logical reasoning, and decision-making skills" },
      { id: "financial-literacy-hard", title: "Basic Financial Literacy (Hard)", duration: "20 minutes", difficulty: "Hard", description: "Review personal finances, such as paying a bill or balancing a small budget", instructions: ["Examine a mock or simple real bill (e.g., utility bill)", "Identify the amount due, due date, and payment method", "Practice balancing a small, hypothetical budget for a week", "Discuss financial terms or concepts (e.g., savings, expenses) with a trusted person"], benefits: "Enhances numerical reasoning, financial management, and daily living skills" }
    ]
  },
  balance: {
    title: "Balance & Coordination", icon: "⚖️", color: "bg-orange-500",
    exercises: [
      { id: "seated-balance-easy", title: "Seated Balance (Easy)", duration: "5 minutes", difficulty: "Easy", description: "Safe balance training while seated to improve core stability", instructions: ["Sit at edge of a sturdy chair with back support nearby", "Place feet flat on floor, hip-width apart", "Slowly lean forward, then back to center, maintaining control", "Lean slightly left, then right, ensuring a secure posture", "Hold each position for 5 seconds, repeat 5-10 times"], benefits: "Improves core stability, postural control, and sitting endurance" },
      { id: "eye-tracking-easy", title: "Eye Movement (Easy)", duration: "5 minutes", difficulty: "Easy", description: "Coordinate eye movements with head position to reduce dizziness and improve visual tracking", instructions: ["Hold finger at arm's length, at eye level", "Follow finger with eyes while keeping head still", "Move finger slowly left to right, then up and down", "Finally, make slow circles with your finger, following with eyes", "Repeat each direction 5-10 times"], benefits: "Improves visual tracking, reduces dizziness, and enhances eye-hand coordination" },
      { id: "standing-balance-medium", title: "Standing Balance (Medium)", duration: "5 minutes", difficulty: "Medium", description: "Standing balance with support to enhance stability and confidence", instructions: ["Stand behind a sturdy chair or counter, holding back for support", "Stand on both feet, eyes open, for 30 seconds", "If stable, try briefly lifting one foot slightly off the ground", "Practice weight shifting side to side, keeping hands near support", "ALWAYS have support available and ensure a clear, non-slip floor"], benefits: "Enhances stability, confidence in standing, and prepares for walking" },
      { id: "weight-shifts-medium", title: "Weight Shifts (Medium)", duration: "7 minutes", difficulty: "Medium", description: "Shift weight side to side while standing with support to improve balance reactions", instructions: ["Stand with feet shoulder-width apart, holding onto support", "Slowly shift your weight to your right leg, then to your left leg", "Keep your trunk upright and controlled", "Repeat 10-15 times each side, focusing on smooth movement"], benefits: "Improves balance reactions, strengthens leg muscles, and increases stability" },
      { id: "tandem-stand-hard", title: "Tandem Stand (Hard)", duration: "5 minutes", difficulty: "Hard", description: "Stand with one foot directly in front of the other to challenge balance", instructions: ["Stand with sturdy support nearby, but try not to hold on", "Place the heel of one foot directly in front of the toes of the other foot", "Hold this position for as long as comfortable (aim for 10-20 seconds)", "Switch feet and repeat. Keep eyes open and focus on a fixed point", "Only attempt if confident with medium-level standing balance exercises" ], benefits: "Significantly improves static balance and proprioception" },
      { id: "obstacle-course-hard", title: "Simple Obstacle Course (Hard)", duration: "10 minutes", difficulty: "Hard", description: "Navigate a small, safe indoor obstacle course to improve dynamic balance and coordination", instructions: ["Set up a simple course with soft objects (e.g., pillows, towels) to step over or around", "Walk slowly through the course, focusing on controlled steps and lifting feet", "Ensure a clear path and supervision if necessary", "Increase complexity gradually by adding more turns or small steps"], benefits: "Enhances dynamic balance, agility, and real-world functional mobility" }
    ]
  }
};

const resourceCategories = {
  emergency: {
    title: "Emergency & Crisis", icon: "🚨", color: "bg-red-500",
    resources: [
      { title: "Emergency Services", phone: "999", description: "Call immediately for medical emergencies (ambulance, fire, police)", available: "24/7", type: "emergency" },
      { title: "Befrienders Kuala Lumpur", phone: "03-76272929", website: "befrienders.org.my", description: "Emotional support for those in distress or contemplating suicide", available: "24/7", type: "crisis" },
      { title: "Talian Kasih", phone: "15999", description: "Child protection, domestic violence, elderly, and disability support", available: "24/7", type: "crisis" },
      { title: "Stroke Emergency Signs (FAST)", description: "F.A.S.T. - Face drooping, Arm weakness, Speech difficulty, Time to call 999", type: "info" }
    ]
  },
  medical: {
    title: "Medical Support", icon: "🏥", color: "bg-blue-500",
    resources: [
      { title: "National Stroke Association of Malaysia (NASAM)", phone: "03-7956 4840", website: "nasam.org", description: "Dedicated to helping stroke survivors regain their lives", available: "Mon-Fri, Business hours" },
      { title: "Malaysian Stroke Council", website: "malaysianstrokecouncil.org", description: "Advocacy, awareness, and support for stroke in Malaysia", type: "organization" },
      { title: "Hospital Finder (Ministry of Health)", website: "www.moh.gov.my/index.php/pages/view/hospitals", description: "Directory of public hospitals in Malaysia", type: "directory" }
    ]
  },
  therapy: {
    title: "Therapy & Rehabilitation", icon: "🏃‍♂️", color: "bg-green-500",
    resources: [
      { title: "Malaysian Association of Physiotherapy (MAP)", website: "www.physiotherapy.org.my", description: "Find certified physiotherapists in Malaysia", phone: "03-7956 4840" },
      { title: "Malaysian Association of Speech-Language Pathologists & Audiologists (MASLPA)", website: "www.maslpa.org.my", description: "Directory of speech-language pathologists and audiologists", type: "organization" },
      { title: "Malaysian Occupational Therapy Association (MOTA)", website: "www.mota.org.my", description: "Resources and referrals for occupational therapy services", type: "organization" },
      { title: "Tele-Rehab Services (Private Clinics)", description: "Online rehabilitation sessions from certified providers in Malaysia", type: "service" }
    ]
  },
  support: {
    title: "Support Groups", icon: "👥", color: "bg-purple-500",
    resources: [
      { title: "NASAM Stroke Support Groups", website: "nasam.org/our-centres", description: "Find local stroke support groups and rehabilitation centers by NASAM", type: "community" },
      { title: "Online Malaysian Stroke Communities", description: "Facebook groups and forums for stroke survivors and caregivers in Malaysia", type: "online" },
      { title: "Caregiver Support Malaysia", description: "Resources and support for family caregivers of stroke survivors", type: "family" }
    ]
  },
  financial: {
    title: "Financial Assistance", icon: "💰", color: "bg-yellow-500",
    resources: [
      { title: "Malaysian Social Welfare Department (JKM)", phone: "03-8323 1000", website: "www.jkm.gov.my", description: "Provides financial aid and welfare services for eligible individuals, including disabled and elderly", available: "Business hours" },
      { title: "SOCSO (PERKESO) Disability Scheme", phone: "1-300-22-8000", website: "www.perkeso.gov.my", description: "Social Security Organisation - provides invalidity pension for contributors with permanent disability", available: "Business hours" },
      { title: "Disability Benefits (OKU Card)", website: "www.jkm.gov.my/jkm/index.php?r=portal/oku", description: "Information on Persons with Disabilities (OKU) registration and benefits", type: "government" }
    ]
  },
  tools: {
    title: "Tools & Equipment", icon: "🛠️", color: "bg-indigo-500",
    resources: [
      { title: "Medical Equipment Suppliers (General)", description: "Search online or local directories for medical equipment stores in Malaysia (e.g., wheelchairs, walkers, commodes)", type: "equipment" },
      { title: "Assistive Technology Providers", description: "Companies offering assistive devices for daily living, communication, and mobility in Malaysia", type: "equipment" },
      { title: "Home Renovation for Accessibility", description: "Contractors specializing in home modifications for disabled access (ramps, grab bars, bathroom aids)", type: "home" }
    ]
  }
};


const StrokeRecoveryMVP = () => {
  // --- State Variables ---
  const [currentSection, setCurrentSection] = useState('home');
  const [todayCompleted, setTodayCompleted] = useState(() => {
    // Load from localStorage on initial render, or default
    const saved = localStorage.getItem('todayCompleted');
    return saved ? JSON.parse(saved) : { exercise: false, mood: false, breathing: false };
  });
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingCount, setBreathingCount] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState('ready');
  const [selectedMood, setSelectedMood] = useState(() => {
    const saved = localStorage.getItem('selectedMood');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentExercise, setCurrentExercise] = useState(0);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [riskLevel, setRiskLevel] = useState('low');
  const [selectedExerciseCategory, setSelectedExerciseCategory] = useState('motor');
  const [completedExercises, setCompletedExercises] = useState(() => {
    const saved = localStorage.getItem('completedHomeExercises');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [selectedResourceCategory, setSelectedResourceCategory] = useState('emergency');
  const [personalizedAffirmation, setPersonalizedAffirmation] = useState("");
  const [isAffirmationLoading, setIsAffirmationLoading] = useState(false);
  const [isChatbotResponding, setIsChatbotResponding] = useState(false); // New loading state for chatbot

  // New state for cognitive scores
  const [cognitiveScores, setCognitiveScores] = useState(() => {
    const saved = localStorage.getItem('cognitiveScores');
    return saved ? JSON.parse(saved) : {
      attention: [],
      memory: [],
      executive: [],
      language: [],
      visuospatial: [], // For clock drawing
      overall: []
    };
  });

  // New state for daily journal
  const [journalEntry, setJournalEntry] = useState('');
  const [journalEntries, setJournalEntries] = useState(() => {
    const savedEntries = localStorage.getItem('dailyJournalEntries');
    return savedEntries ? JSON.parse(savedEntries) : [];
  });

  // --- API Configuration ---
  // IMPORTANT: For Canvas environment, the API key is automatically injected.
  // In a production environment, you would use environment variables (e.g., process.env.REACT_APP_GEMINI_API_KEY)
  // and manage them securely (e.g., with a backend proxy, cloud secrets manager).
  const apiKey = ""; // Empty string for Canvas runtime
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // --- Data Persistence Effects ---
  // Save todayCompleted state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('todayCompleted', JSON.stringify(todayCompleted));
  }, [todayCompleted]);

  // Save selectedMood state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedMood', JSON.stringify(selectedMood));
  }, [selectedMood]);

  // Save completedHomeExercises state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('completedHomeExercises', JSON.stringify(Array.from(completedExercises)));
  }, [completedExercises]);

  // Save cognitiveScores state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cognitiveScores', JSON.stringify(cognitiveScores));
  }, [cognitiveScores]);

  // Save journalEntries to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dailyJournalEntries', JSON.stringify(journalEntries));
  }, [journalEntries]);


  // --- Breathing Timer Logic ---
  useEffect(() => {
    let interval;
    if (breathingActive) {
      interval = setInterval(() => {
        setBreathingCount(prev => {
          if (prev >= 4) {
            if (breathingPhase === 'inhale') {
              setBreathingPhase('exhale');
              return 0;
            } else {
              setBreathingPhase('inhale');
              return 0;
            }
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breathingActive, breathingPhase]);

  // --- Cognitive Scoring Function ---
  const calculateCognitiveScore = (exerciseType, performance) => {
    let score = 0;
    switch (exerciseType) {
      case 'multiple_choice':
        score = performance.correct ? 5 : 0; // Simple binary for now
        break;
      case 'input_sequence':
        score = performance.isCorrect ? 10 : 0; // Full score if sequence is correct
        break;
      case 'list_input':
        score = Math.min(performance.validCount * 2, 20); // Max 20 points, 2 points per valid animal
        break;
      case 'selective_attention':
        score = Math.max(0, 10 - performance.errors * 2); // Start at 10, lose 2 points per error
        break;
      // Add cases for 'sequence', 'memory_sequence', 'clock_drawing', 'n_back', 'stroop' if fully implemented
      default:
        score = 0; // Unknown exercise type
    }
    return score;
  };

  const updateCognitiveScores = (domain, score) => {
    setCognitiveScores(prevScores => {
      const newScores = { ...prevScores };
      if (!newScores[domain]) {
        newScores[domain] = [];
      }
      newScores[domain].push({ date: new Date().toISOString(), score: score });
      // You could also calculate an 'overall' score based on all domains here
      return newScores;
    });
  };

  // --- Handlers ---
  const handleBrainExerciseCompletion = (result) => {
    // Determine the cognitive domain for scoring
    const exerciseMeta = brainExercises[currentExercise];
    let domain = 'overall'; // Default domain

    if (exerciseMeta) {
        switch(exerciseMeta.type) {
            case 'input_sequence': domain = 'memory'; break;
            case 'list_input': domain = 'language'; break;
            case 'selective_attention': domain = 'attention'; break;
            // Add more specific domain mappings for other types
            default: domain = 'overall'; // For multiple choice etc.
        }
    }

    const score = calculateCognitiveScore(exerciseMeta?.type || 'multiple_choice', result);
    updateCognitiveScores(domain, score);
    setExerciseCompleted(true);
    setTodayCompleted(prev => ({ ...prev, exercise: true }));
  };

  const nextExercise = () => {
    if (currentExercise < brainExercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setExerciseCompleted(false);
    } else {
      setPersonalizedAffirmation("You've completed all brain exercises for today!");
      setCurrentSection('home');
      setExerciseCompleted(false);
      setCurrentExercise(0);
    }
  };

  const startBreathing = () => {
    setBreathingActive(true);
    setBreathingPhase('inhale');
    setBreathingCount(0);
  };

  const stopBreathing = () => {
    setBreathingActive(false);
    setBreathingPhase('ready');
    setBreathingCount(0);
    setTodayCompleted(prev => ({ ...prev, breathing: true }));
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    setTodayCompleted(prev => ({ ...prev, mood: true }));
    if (mood.value === 'difficult') {
      setShowChatbot(true);
      setChatMessages([{ sender: 'bot', text: chatbotQuestions[0].text, timestamp: new Date() }]);
    }
  };

  const handleChatResponse = async (response, questionIndex) => {
    let newChatHistory = [...chatMessages, { sender: 'user', text: response, timestamp: new Date() }];
    setChatMessages(newChatHistory);
    setIsChatbotResponding(true); // Set chatbot loading state

    let newRiskLevel = riskLevel;
    if (questionIndex === 1) {
      if (response === "Often" || response === "Most of the time") { newRiskLevel = 'medium'; }
    }
    if (questionIndex === 2) {
      if (response === "Sometimes cross my mind") { newRiskLevel = 'medium'; }
      else if (response === "Yes, but I wouldn't act" || response === "Yes, and I might act") { newRiskLevel = 'high'; }
    }
    if (questionIndex === 3) {
      if (response === "No one" && newRiskLevel !== 'low') { newRiskLevel = 'high'; }
    }
    setRiskLevel(newRiskLevel);

    if (chatbotQuestions[questionIndex].type === 'open') {
      const prompt = `The user is a stroke patient. They just said: '${response}'. Respond compassionately and briefly as a supportive listener, encouraging them to elaborate further if they wish, or acknowledge their feelings. Do not give medical advice. Keep the response to 1-2 sentences.`;
      try {
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        const responseLLM = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await responseLLM.json();

        let botResponseText = "I hear you. Thank you for sharing.";
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
          botResponseText = result.candidates[0].content.parts[0].text;
        } else {
          botResponseText = "I'm having trouble generating a response right now. Please try again or focus on the next question.";
          console.error("Gemini API returned an unexpected structure for chatbot response:", result);
        }
        newChatHistory = [...newChatHistory, { sender: 'bot', text: botResponseText, timestamp: new Date() }];
        setChatMessages(newChatHistory);

        if (questionIndex < chatbotQuestions.length - 1) {
          setCurrentQuestion(questionIndex + 1);
          setTimeout(() => {
            setChatMessages(prev => [...prev, { sender: 'bot', text: chatbotQuestions[questionIndex + 1].text, timestamp: new Date() }]);
          }, 500);
        } else {
          handleFinalChatAssessment(newRiskLevel);
        }
      } catch (error) {
        console.error("Error calling Gemini API for chatbot:", error);
        newChatHistory = [...newChatHistory, { sender: 'bot', text: "I'm having trouble connecting right now. Please try again or use the emergency contacts if you need immediate help.", timestamp: new Date() }];
        setChatMessages(newChatHistory);
        if (questionIndex < chatbotQuestions.length - 1) { setCurrentQuestion(questionIndex + 1); }
        else { handleFinalChatAssessment(newRiskLevel); }
      } finally {
        setIsChatbotResponding(false);
      }
    } else {
      if (questionIndex < chatbotQuestions.length - 1) {
        setCurrentQuestion(questionIndex + 1);
        setTimeout(() => {
          setChatMessages(prev => [...prev, { sender: 'bot', text: chatbotQuestions[questionIndex + 1].text, timestamp: new Date() }]);
        }, 500);
      } else {
        handleFinalChatAssessment(newRiskLevel);
      }
      setIsChatbotResponding(false);
    }
  };

  const handleFinalChatAssessment = (finalRiskLevel) => {
    let finalMessage = "";
    if (finalRiskLevel === 'high') {
      finalMessage = "I'm very concerned about you right now. Your safety is important, and I think it would be helpful to talk to a professional immediately. Would you like me to connect you to a crisis counselor right now?";
    } else if (finalRiskLevel === 'medium') {
      finalMessage = "It sounds like you're going through a really tough time. While these feelings are part of recovery, it might help to talk to someone who specializes in supporting stroke survivors. Would you like to connect with a counselor?";
    } else {
      finalMessage = "Thank you for sharing with me. Having difficult days is normal in recovery. Remember that you're stronger than you know, and tomorrow can be different. Is there anything specific that might help you feel a little better today?";
    }
    setChatMessages(prev => [...prev, { sender: 'bot', text: finalMessage, timestamp: new Date() }]);
  };

  const connectToHotline = () => {
    setChatMessages(prev => [...prev, {
      sender: 'bot',
      text: "I'm connecting you to professional support right now. Here are immediate resources:\n\n🔴 CRISIS HOTLINE: 999 (Emergency Services Malaysia)\n📱 Befrienders Kuala Lumpur: 03-76272929\n\n(These are Malaysian hotlines based on your resource directory. A counselor will be with you shortly. You're not alone in this.)",
      timestamp: new Date(),
      isEmergency: true
    }]);
  };

  const toggleExerciseComplete = (exerciseId) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const completedCount = Object.values(todayCompleted).filter(Boolean).length;

  const generateAffirmation = async () => {
    setIsAffirmationLoading(true);
    const prompt = "Generate a short, empowering daily affirmation (one sentence) for a stroke survivor, focusing on themes of strength, progress, and patience. Avoid medical jargon. Make it suitable for a Malaysian context if possible.";

    try {
      const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        setPersonalizedAffirmation(result.candidates[0].content.parts[0].text);
      } else {
        setPersonalizedAffirmation("Stay strong and keep moving forward!"); // Fallback affirmation
        console.error("Gemini API returned an unexpected structure for affirmation:", result);
      }
    } catch (error) {
      console.error("Error generating affirmation:", error);
      setPersonalizedAffirmation("You are stronger than you think! (Failed to load new affirmation)"); // Fallback on network/API error
    } finally {
      setIsAffirmationLoading(false);
    }
  };

  // --- Journal Handlers ---
  const handleSaveJournalEntry = () => {
    if (journalEntry.trim() === '' || !selectedMood) {
      // Potentially show a user message if entry or mood is missing
      return;
    }
    const newEntry = {
      date: new Date().toISOString(),
      mood: selectedMood.label,
      emoji: selectedMood.emoji,
      text: journalEntry.trim()
    };
    setJournalEntries(prevEntries => [newEntry, ...prevEntries]); // Add new entry to the top
    setJournalEntry(''); // Clear input field
  };


  // Main Brain Exercise Renderer
  const renderBrainExercise = () => {
    const currentEx = brainExercises[currentExercise];

    const renderContent = () => {
      switch (currentEx.type) {
        case 'input_sequence':
          return <InputSequenceExercise exercise={currentEx} onComplete={handleBrainExerciseCompletion} isCompleted={exerciseCompleted} />;
        case 'list_input':
          return <ListInputExercise exercise={currentEx} onComplete={handleBrainExerciseCompletion} isCompleted={exerciseCompleted} />;
        case 'selective_attention':
            return <SelectiveAttentionExercise exercise={currentEx} onComplete={handleBrainExerciseCompletion} isCompleted={exerciseCompleted} />;
        case undefined: // Default for old exercises which don't have a 'type' property
        default: // Fallback for any unknown or basic types
          return <LegacyExercise exercise={currentEx} onComplete={handleBrainExerciseCompletion} isCompleted={exerciseCompleted} />;
      }
    };

    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Brain Exercise</h2>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          {/* Clinical Context and Difficulty */}
          {currentEx.clinicalNote && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-left">
              <h4 className="text-sm font-semibold text-blue-800">Clinical Background:</h4>
              <p className="text-xs text-blue-600">{currentEx.clinicalNote}</p>
            </div>
          )}
          <div className="text-sm text-gray-500 flex justify-between mb-4">
            <span>Difficulty: {currentEx.difficulty || 'Standard'}</span>
            <span>Exercise {currentExercise + 1} of {brainExercises.length}</span>
          </div>

          {renderContent()}

          {/* Next Exercise button after completion */}
          {exerciseCompleted && (
            <div className="mt-6">
              <p className="text-green-600 font-bold text-xl mb-4">Great job!</p>
              <button
                onClick={nextExercise}
                className="bg-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-600 transition-colors"
              >
                Next Exercise
              </button>
            </div>
          )}
        </div>
        {!exerciseCompleted && (
          <p className="text-gray-500 text-sm mt-4">
            Complete the exercise to move to the next one.
          </p>
        )}
      </div>
    );
  };


  // Standard render functions (unchanged from previous version for brevity)
  const renderHome = () => (
    <div className="space-y-6">
      <div className="bg-blue-500 rounded-xl p-6 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
        <p className="text-blue-100">Let's work on your recovery today</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Today's Goals</h3>
        <div className="space-y-3">
          <div className={`flex items-center p-3 rounded-lg ${todayCompleted.exercise ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${todayCompleted.exercise ? 'bg-green-500' : 'bg-gray-300'}`}>
              {todayCompleted.exercise && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
            <span className="font-medium">Brain Exercise</span>
          </div>

          <div className={`flex items-center p-3 rounded-lg ${todayCompleted.mood ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${todayCompleted.mood ? 'bg-green-500' : 'bg-gray-300'}`}>
              {todayCompleted.mood && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
            <span className="font-medium">Check Your Mood</span>
          </div>

          <div className={`flex items-center p-3 rounded-lg ${todayCompleted.breathing ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${todayCompleted.breathing ? 'bg-green-500' : 'bg-gray-300'}`}>
              {todayCompleted.breathing && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
            <span className="font-medium">Breathing Exercise</span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{completedCount}/3</div>
          <div className="text-gray-600">Goals completed</div>
        </div>
      </div>

      {completedCount === 3 && (
        <div className="bg-green-500 rounded-xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Great Job Today! 🎉</h3>
          <p className="text-green-100">You've completed all your daily goals!</p>
        </div>
      )}

      {/* Personalized Affirmation Feature */}
      <div className="bg-white rounded-xl p-6 shadow-lg text-center">
        <h3 className="text-xl font-bold mb-3 text-gray-800">Daily Affirmation ✨</h3>
        <p className="text-gray-700 italic mb-4">
          {isAffirmationLoading ? "Generating your affirmation..." : personalizedAffirmation || "Click below for a new affirmation!"}
        </p>
        <button
          onClick={generateAffirmation}
          disabled={isAffirmationLoading}
          className="bg-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-600 transition-colors flex items-center justify-center mx-auto"
        >
          {isAffirmationLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            "Get Personalized Affirmation ✨"
          )}
        </button>
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Resources Directory</h2>
        <p className="text-gray-600">Support and assistance when you need it</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-lg">
        <h3 className="text-lg font-bold mb-3 text-gray-800">Choose Category:</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(resourceCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedResourceCategory(key)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedResourceCategory === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{category.icon}</div>
                <div className="text-sm font-medium text-gray-800">{category.title}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">
          {resourceCategories[selectedResourceCategory].title}
        </h3>

        {resourceCategories[selectedResourceCategory].resources.map((resource, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
            <div className="mb-4">
              <h4 className="text-lg font-bold text-gray-800 mb-2">{resource.title}</h4>
              <p className="text-gray-600 mb-3">{resource.description}</p>

              <div className="space-y-2">
                {resource.phone && (
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📞</span>
                    <div>
                      <a href={`tel:${resource.phone}`} className="text-blue-600 font-medium hover:underline">
                        {resource.phone}
                      </a>
                      {resource.available && (
                        <span className="text-sm text-gray-500 ml-2">({resource.available})</span>
                      )}
                    </div>
                  </div>
                )}

                {resource.website && (
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🌐</span>
                    <a href={`https://${resource.website}`} target="_blank" rel="noopener noreferrer"
                       className="text-blue-600 font-medium hover:underline">
                      {resource.website}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {resource.type && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    resource.type === 'emergency' ? 'bg-red-100 text-red-800' :
                    resource.type === 'crisis' ? 'bg-orange-100 text-orange-800' :
                    resource.type === 'organization' ? 'bg-blue-100 text-blue-800' :
                    resource.type === 'community' ? 'bg-purple-100 text-purple-800' :
                    resource.type === 'government' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                  </span>
                )}

                {resource.available && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {resource.available}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {resource.phone && (
                <a href={`tel:${resource.phone}`}
                   className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                  📞 Call Now
                </a>
              )}

              {resource.website && (
                <a href={`https://${resource.website}`} target="_blank" rel="noopener noreferrer"
                   className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                  🌐 Visit Website
                </a>
              )}

              {resource.type === 'emergency' && (
                <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  🚨 Emergency Only
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
        <h3 className="text-lg font-bold text-yellow-800 mb-2">Important Notice:</h3>
        <p className="text-yellow-700 text-sm">
          This directory provides general information. Please verify current contact information and
          availability. For medical emergencies, always call 999 immediately. Resources may vary by
          location and insurance coverage.
        </p>
      </div>

      {selectedResourceCategory !== 'emergency' && (
        <div className="bg-red-500 rounded-xl p-6 text-white">
          <h3 className="text-lg font-bold mb-2">Need Emergency Help?</h3>
          <div className="flex flex-wrap gap-3">
            <a href="tel:999" className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              🚨 Call 999
            </a>
            <a href="tel:03-76272929" className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              💬 Befrienders KL
            </a>
          </div>
        </div>
      )}
    </div>
  );

  const renderExercises = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Home Exercises</h2>
        <p className="text-gray-600">Safe exercises you can do at your own pace</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-lg">
        <h3 className="text-lg font-bold mb-3 text-gray-800">Choose Exercise Type:</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(exerciseCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedExerciseCategory(key)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedExerciseCategory === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{category.icon}</div>
                <div className="text-sm font-medium text-gray-800">{category.title}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">
          {exerciseCategories[selectedExerciseCategory].title} Exercises
        </h3>

        {exerciseCategories[selectedExerciseCategory].exercises.map((exercise) => (
          <div key={exercise.id} className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-800 mb-2">{exercise.title}</h4>
                <p className="text-gray-600 mb-3">{exercise.description}</p>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {exercise.duration}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    exercise.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    exercise.difficulty === 'Medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {exercise.difficulty}
                  </span>
                </div>

                <h5 className="text-md font-bold text-gray-700 mt-4 mb-2">Instructions:</h5>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                  {exercise.instructions.map((step, stepIndex) => (
                    <li key={stepIndex}>{step}</li>
                  ))}
                </ul>

                <h5 className="text-md font-bold text-gray-700 mb-2">Benefits:</h5>
                <p className="text-gray-600">{exercise.benefits}</p>
              </div>

              <button
                onClick={() => toggleExerciseComplete(exercise.id)}
                className={`flex-shrink-0 mt-4 ml-4 px-5 py-3 rounded-xl font-bold flex items-center justify-center transition-all duration-300 ${
                  completedExercises.has(exercise.id) ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {completedExercises.has(exercise.id) ? (
                  <>
                    <CheckCircle size={20} className="mr-2" /> Completed
                  </>
                ) : (
                  'Mark as Complete'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
        <h3 className="text-lg font-bold text-yellow-800 mb-2">Important Safety Note:</h3>
        <p className="text-yellow-700 text-sm">
          Always consult with your doctor or therapist before starting any new exercise program. Stop
          immediately if you experience pain or discomfort. Ensure you have proper support (e.g., a
          sturdy chair, a helper) for exercises requiring balance.
        </p>
      </div>
    </div>
  );

  const renderMood = () => (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">How are you feeling today?</h2>
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex justify-around mb-6">
          {moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => handleMoodSelect(mood)}
              className={`p-4 rounded-xl flex flex-col items-center justify-center transition-transform transform ${
                selectedMood && selectedMood.value === mood.value
                  ? 'scale-110 border-2 border-blue-500'
                  : 'hover:scale-105'
              } ${mood.value === 'difficult' ? 'bg-red-50 text-red-700' : 'bg-gray-50'}`}
            >
              <span className="text-5xl mb-2">{mood.emoji}</span>
              <span className="text-lg font-medium">{mood.label}</span>
            </button>
          ))}
        </div>
        {selectedMood && (
          <p className="text-xl font-medium text-gray-700">
            You selected: <span className="font-bold text-blue-600">{selectedMood.label}</span>
          </p>
        )}
      </div>

      {/* Daily Journal Section */}
      <div className="bg-white rounded-xl p-6 shadow-lg text-left space-y-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Daily Journal</h3>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] resize-y"
          placeholder="Write about your day, your feelings, or any recovery milestones..."
          value={journalEntry}
          onChange={(e) => setJournalEntry(e.target.value)}
          disabled={!selectedMood} // Disable if no mood is selected
        ></textarea>
        <button
          onClick={handleSaveJournalEntry}
          className="w-full bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-600 transition-colors"
          disabled={journalEntry.trim() === '' || !selectedMood} // Disable if empty or no mood
        >
          Save Journal Entry
        </button>

        <h4 className="text-lg font-bold text-gray-800 mt-6">Past Entries:</h4>
        {journalEntries.length === 0 ? (
          <p className="text-gray-500 italic">No journal entries yet.</p>
        ) : (
          <div className="space-y-4">
            {journalEntries.map((entry, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">
                  {new Date(entry.date).toLocaleDateString()} - {entry.emoji} {entry.mood}
                </p>
                <p className="text-gray-700">{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>


      {showChatbot && (
        <div className="bg-white rounded-xl p-6 shadow-lg max-h-96 overflow-y-auto flex flex-col-reverse">
          <div className="flex flex-col space-y-4">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs p-3 rounded-lg ${
                  msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                } ${msg.isEmergency ? 'bg-red-600 text-white' : ''}`}>
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                  <span className="block text-right text-xs text-gray-400 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isChatbotResponding && (
              <div className="flex justify-start">
                <div className="max-w-xs p-3 rounded-lg bg-gray-200 text-gray-800">
                  <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!chatMessages.some(msg => msg.isEmergency) && currentQuestion < chatbotQuestions.length && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {chatbotQuestions[currentQuestion].type === 'open' ? (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your feelings..."
                    className="flex-1 p-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isChatbotResponding}
                  />
                  <button
                    onClick={() => {
                      handleChatResponse(userInput, currentQuestion);
                      setUserInput('');
                    }}
                    className="bg-blue-500 text-white px-5 py-3 rounded-lg font-bold hover:bg-blue-600"
                    disabled={!userInput.trim() || isChatbotResponding}
                  >
                    Send
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {chatbotQuestions[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleChatResponse(option, currentQuestion)}
                      className="bg-gray-100 text-gray-800 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      disabled={isChatbotResponding}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentQuestion >= chatbotQuestions.length && !chatMessages.some(msg => msg.isEmergency) && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col space-y-3">
              {riskLevel === 'high' && (
                <>
                  <button
                    onClick={connectToHotline}
                    className="bg-red-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-red-700 shadow-md"
                  >
                    📞 Connect to Crisis Hotline (999)
                  </button>
                  <button
                    onClick={() => {
                      setChatMessages(prev => [...prev, { sender: 'bot', text: "Remember, you can also contact Befrienders Kuala Lumpur at 03-76272929.", timestamp: new Date() }]);
                    }}
                    className="bg-orange-500 text-white px-5 py-3 rounded-lg font-bold hover:bg-orange-600"
                  >
                    📱 Call Befrienders KL
                  </button>
                </>
              )}
              {riskLevel === 'medium' && (
                <button
                  onClick={() => {
                    setChatMessages(prev => [...prev, { sender: 'bot', text: "Connecting you with resources for a professional counselor. Please visit the 'Resources' tab for more options.", timestamp: new Date() }]);
                    setCurrentSection('resources');
                  }}
                  className="bg-blue-500 text-white px-5 py-3 rounded-lg font-bold hover:bg-blue-600"
                >
                  💬 Talk to a Counselor
                </button>
              )}
               {riskLevel === 'low' && (
                  <button
                      onClick={() => {
                          setChatMessages(prev => [...prev, { sender: 'bot', text: "Remember to take care of yourself. Perhaps a breathing exercise would help? Or check out the 'Exercises' tab.", timestamp: new Date() }]);
                          setShowChatbot(false);
                          setCurrentSection('home');
                      }}
                      className="bg-gray-200 text-gray-800 px-5 py-3 rounded-lg font-bold hover:bg-gray-300"
                  >
                      Done Chatting
                  </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderBreathing = () => (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Breathing Exercise</h2>
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="text-center mb-6">
          <p className="text-xl font-bold text-blue-600 mb-4">
            {breathingPhase === 'ready' ? 'Get Ready to Breathe' :
             breathingPhase === 'inhale' ? `Inhale... ${breathingCount}` :
             breathingPhase === 'exhale' ? `Exhale... ${breathingCount}` :
             ''}
          </p>
          <div className={`relative mx-auto w-32 h-32 rounded-full flex items-center justify-center transition-all duration-1000 ease-in-out ${
            breathingActive ? 'bg-blue-400' : 'bg-gray-300'
          } ${breathingPhase === 'inhale' ? 'scale-125' : breathingPhase === 'exhale' ? 'scale-75' : ''}`}>
            <span className="text-4xl font-bold text-white">
              {breathingActive ? (breathingPhase === 'ready' ? '' : breathingCount) : '🧘‍♀️'}
            </span>
          </div>
        </div>
        <div className="flex justify-center space-x-4 mt-6">
          {!breathingActive ? (
            <button
              onClick={startBreathing}
              className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-green-600"
            >
              <Play size={20} className="mr-2" /> Start
            </button>
          ) : (
            <button
              onClick={stopBreathing}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-red-600"
            >
              <Pause size={20} className="mr-2" /> Stop
            </button>
          )}
          <button
            onClick={() => {
              setBreathingActive(false);
              setBreathingPhase('ready');
              setBreathingCount(0);
            }}
            className="bg-gray-400 text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-gray-500"
          >
            <RotateCcw size={20} className="mr-2" /> Reset
          </button>
        </div>
      </div>
      <p className="text-gray-500 text-sm mt-4">
        This exercise helps calm your mind and improve focus. Breathe in for 4 counts, hold for a moment, and breathe out for 4 counts.
      </p>
    </div>
  );

  return (
    <ErrorBoundary> {/* Wrap the main application content with the ErrorBoundary */}
      <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
        <div className="flex-1 p-6 pb-20 overflow-y-auto">
          {currentSection === 'home' && renderHome()}
          {currentSection === 'brain-exercise' && renderBrainExercise()}
          {currentSection === 'mood' && renderMood()}
          {currentSection === 'breathing' && renderBreathing()}
          {currentSection === 'home-exercises' && renderExercises()}
          {currentSection === 'resources' && renderResources()}
        </div>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
          <div className="flex justify-around items-center h-16">
            <button
              onClick={() => setCurrentSection('home')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${currentSection === 'home' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-400'}`}
            >
              <Home size={24} />
              <span className="text-xs mt-1">Home</span>
            </button>
            <button
              onClick={() => setCurrentSection('brain-exercise')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${currentSection === 'brain-exercise' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-400'}`}
            >
              <Brain size={24} />
              <span className="text-xs mt-1">Brain</span>
            </button>
            <button
              onClick={() => setCurrentSection('mood')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${currentSection === 'mood' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-400'}`}
            >
              <Heart size={24} />
              <span className="text-xs mt-1">Mood</span>
            </button>
            <button
              onClick={() => setCurrentSection('breathing')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${currentSection === 'breathing' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-400'}`}
            >
              <Play size={24} />
              <span className="text-xs mt-1">Breathe</span>
            </button>
            <button
              onClick={() => setCurrentSection('home-exercises')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${currentSection === 'home-exercises' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-400'}`}
            >
              <Calendar size={24} />
              <span className="text-xs mt-1">Exercises</span>
            </button>
            <button
              onClick={() => setCurrentSection('resources')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${currentSection === 'resources' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open-text"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 0 0 1 3-3h7z"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>
              <span className="text-xs mt-1">Resources</span>
            </button>
          </div>
        </nav>
      </div>
    </ErrorBoundary>
  );
};

export default StrokeRecoveryMVP;
