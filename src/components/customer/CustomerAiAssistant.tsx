import React, { useState, useRef, useEffect } from 'react';
import { MessageSquareCode, Send, Sparkles, Bot, User, Clock, Check, HelpCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-1',
    sender: 'ai',
    text: "Welcome to Luxery Hotel! I am your AI Virtual Concierge. How may I assist your stay today? You can ask about our available suites, dining options, cancellation policies, or amenities.",
    timestamp: 'Just now'
  }
];

const SUGGESTED_QUESTIONS = [
  "Which rooms are available?",
  "What are the check-in and check-out times?",
  "Can I cancel my booking?",
  "What facilities does the hotel provide?"
];

const MOCK_ANSWERS: Record<string, string> = {
  "Which rooms are available?":
    "We currently have our signature rooms and suites available including Single Sharing Room (₹999/night), Double Sharing Room (₹1,499/night), Triple Sharing Room (₹2,199/night), Deluxe Ocean View (₹2,799/night), Executive Business Suite (₹3,999/night), Premier Garden Villa (₹5,499/night), and the Luxury Presidential Penthouse (₹8,999/night). You can reserve directly from the 'Search Rooms' tab with instant Razorpay confirmation!",
  "What are the check-in and check-out times?":
    "Standard check-in begins at 2:00 PM (14:00) and check-out is until 11:00 AM (11:00). We also offer complimentary early check-in upon request for our direct-booking guests subject to room readiness.",
  "Can I cancel my booking?":
    "Yes, Luxery Hotel offers free flexible cancellation up to 48 hours prior to your scheduled check-in date on standard reservations. You can easily manage or cancel your reservation anytime from your 'My Bookings' tab.",
  "What facilities does the hotel provide?":
    "Luxery Hotel features an infinity oceanview pool, signature Ayurvedic wellness spa, 24/7 fitness gymnasium, executive boardroom lounge, multi-cuisine seaside restaurant 'Coast & Spice', and round-the-clock room service."
};

export const CustomerAiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate intelligent concierge response
    setTimeout(() => {
      let reply = MOCK_ANSWERS[text];
      if (!reply) {
        if (text.toLowerCase().includes('pool') || text.toLowerCase().includes('spa')) {
          reply = "Our heated infinity pool and wellness spa operate daily from 6:00 AM to 10:00 PM on Floor 4 with complimentary cabana towels provided.";
        } else if (text.toLowerCase().includes('dinner') || text.toLowerCase().includes('food') || text.toLowerCase().includes('breakfast')) {
          reply = "Complimentary buffet breakfast is served at our Azure Restaurant between 6:30 AM and 10:30 AM. 24/7 in-room gourmet dining is also available from your room phone.";
        } else if (text.toLowerCase().includes('wifi') || text.toLowerCase().includes('internet')) {
          reply = "High-speed 1Gbps Wi-Fi is complimentary across all rooms and common areas. Connect to 'Luxery_Guest_HighSpeed' and enter your room number and last name.";
        } else {
          reply = `Thank you for asking about "${text}". Our guest services team is on standby 24/7 to assist. For personalized concierge bookings or transport, feel free to visit the Front Desk or dial Ext 0 from your room.`;
        }
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: 'Just now'
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Luxery Hotel AI Concierge
            </h2>
            <p className="text-xs text-slate-500">
              Instant responses regarding amenities, dining, suite features, and booking policies.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Online Concierge
        </span>
      </div>

      {/* Suggested Questions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          Suggested:
        </span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shadow-2xs font-medium"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-blue-400'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
              }`}
            >
              <p>{msg.text}</p>
              <span
                className={`text-[9px] font-mono mt-1.5 block ${
                  msg.sender === 'user' ? 'text-blue-100 text-right' : 'text-slate-400 text-left'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-blue-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 shrink-0 bg-white p-2 rounded-xl border border-slate-200 shadow-xs"
      >
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Ask a question about Luxery Hotel rooms, amenities, or policies..."
          className="flex-1 px-3 py-2 text-xs bg-transparent focus:outline-none text-slate-900 placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors"
          aria-label="Send query"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
