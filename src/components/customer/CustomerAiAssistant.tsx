import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareCode,
  Send,
  Sparkles,
  Bot,
  User,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Shield,
  CreditCard,
  ChevronRight,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHotel } from '../../context/HotelContext';
import { RealtimeAvailabilityReport, RoomTypeAvailability } from '../../lib/ragKnowledgeService';
import {
  VoiceRecognizer,
  globalSpeaker,
  getBcp47LanguageCode,
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
  queryMicrophonePermission
} from '../../lib/voiceSpeechService';
import {
  VoiceBookingState,
  SupportedLanguage,
  processVoiceBookingInput,
  isBookingIntent,
  detectSpokenLanguage,
  PROMPTS
} from '../../lib/voiceBookingEngine';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  availabilityReport?: RealtimeAvailabilityReport;
  suggestedQuestions?: string[];
  bookingCardState?: VoiceBookingState;
}

interface CustomerAiAssistantProps {
  onNavigateTab?: (tab: string) => void;
  onSelectRoomForBooking?: (roomTypeId: string) => void;
  onTriggerBookingPrefill?: (data: { roomTypeId: string; checkIn: string; checkOut: string; guests: number }) => void;
}

const DEFAULT_QUESTIONS = [
  "I want to book a Deluxe room",
  "Which suites are available for my dates?",
  "Can I cancel or refund my booking?",
  "What ID documents are required for check-in?",
  "What facilities does the hotel provide?"
];

export const CustomerAiAssistant: React.FC<CustomerAiAssistantProps> = ({
  onNavigateTab,
  onSelectRoomForBooking,
  onTriggerBookingPrefill
}) => {
  const { user } = useAuth();
  const { roomTypes } = useHotel();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Date filters
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [guests, setGuests] = useState(2);

  // Voice & Multilingual Controls
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);
  const recognizerRef = useRef<VoiceRecognizer | null>(null);

  // Active Voice Booking State
  const [voiceBookingState, setVoiceBookingState] = useState<VoiceBookingState>({
    isActive: false,
    step: 'ask_room',
    language: 'en'
  });

  useEffect(() => {
    recognizerRef.current = new VoiceRecognizer();
    queryMicrophonePermission().then(status => {
      if (status === 'denied') {
        setMicPermissionDenied(true);
      }
    });
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
      globalSpeaker.stop();
    };
  }, []);

  useEffect(() => {
    globalSpeaker.setMuted(isVoiceMuted);
  }, [isVoiceMuted]);

  // Initialize conversation
  useEffect(() => {
    setMessages([
      {
        id: 'init-msg',
        sender: 'ai',
        text: `Namaste ${user?.fullName || 'Guest'}! Welcome to Naidu Luxury Hotel & Resort.\n\nI am Aura, your personal AI Luxury Concierge with voice-driven booking automation. You can speak or type in English, Telugu (తెలుగు), or Hindi (हिंदी) — I will automatically respond in your language! Say "I want to book a room", "నాకు డీలక్స్ రూమ్ బుక్ చేయాలి", or "मुझे कमरा बुक करना है" to start an automated reservation.`,
        timestamp: 'Just now',
        suggestedQuestions: DEFAULT_QUESTIONS
      }
    ]);
  }, [user?.fullName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleRequestMicPermission = async () => {
    setIsRequestingMic(true);
    try {
      const res = await requestMicrophonePermission();
      if (res.granted) {
        setMicPermissionDenied(false);
        setShowBrowserGuide(false);
        setVoiceNotice('Microphone access enabled! Listening now...');
        setTimeout(() => setVoiceNotice(null), 3000);
        setTimeout(() => {
          handleToggleVoiceInput();
        }, 300);
      } else {
        setMicPermissionDenied(true);
        setShowBrowserGuide(true);
      }
    } catch {
      setMicPermissionDenied(true);
      setShowBrowserGuide(true);
    } finally {
      setIsRequestingMic(false);
    }
  };

  const handleToggleVoiceInput = () => {
    if (!isSpeechRecognitionSupported()) {
      setVoiceNotice('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (micPermissionDenied) {
      handleRequestMicPermission();
      return;
    }

    setVoiceNotice(null);
    const langCode = getBcp47LanguageCode(selectedLanguage);

    recognizerRef.current?.start(
      langCode,
      result => {
        setInputText(result.transcript);
        if (result.isFinal) {
          setIsListening(false);
          handleSendMessage(result.transcript);
        }
      },
      (errorMsg, errorCode) => {
        setIsListening(false);
        if (
          errorCode === 'not-allowed' ||
          errorMsg.toLowerCase().includes('denied') ||
          errorMsg.toLowerCase().includes('permission')
        ) {
          setMicPermissionDenied(true);
          setVoiceNotice('Microphone access was denied. Please allow microphone permission in the prompt above.');
        } else {
          setVoiceNotice(errorMsg);
          setTimeout(() => setVoiceNotice(null), 4000);
        }
      },
      () => {
        setIsListening(false);
      }
    );
    setIsListening(true);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const detectedLang = detectSpokenLanguage(text, selectedLanguage);
    if (detectedLang !== selectedLanguage) {
      setSelectedLanguage(detectedLang);
    }

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // 1. Check Voice Booking intent or active session
    if (voiceBookingState.isActive || isBookingIntent(text)) {
      const activeState = voiceBookingState.isActive
        ? voiceBookingState
        : { isActive: true, step: 'ask_room' as const, language: detectedLang };

      const result = processVoiceBookingInput(text, activeState, roomTypes);
      setVoiceBookingState(result.state);

      if (!isVoiceMuted) {
        globalSpeaker.speak(result.speechText, getBcp47LanguageCode(result.language));
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: result.suggestedPrompts,
        bookingCardState: result.state.isActive ? result.state : undefined
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);

      // Check if all mandatory booking fields have been collected (roomTypeId, checkIn, checkOut, guests)
      const isAllMandatoryCollected = Boolean(
        result.state.roomTypeId &&
        result.state.checkIn &&
        result.state.checkOut &&
        result.state.guests
      );

      if (isAllMandatoryCollected || result.action === 'navigate_to_booking') {
        const prefillPayload = {
          roomTypeId: result.state.roomTypeId || (roomTypes[0] ? roomTypes[0].id : 'deluxe-ocean'),
          checkIn: result.state.checkIn || checkIn,
          checkOut: result.state.checkOut || checkOut,
          guests: Number(result.state.guests || guests)
        };

        if (onTriggerBookingPrefill) {
          onTriggerBookingPrefill(prefillPayload);
        } else if (onSelectRoomForBooking) {
          onSelectRoomForBooking(prefillPayload.roomTypeId);
        } else if (onNavigateTab) {
          onNavigateTab('search-rooms');
        }
      }
      return;
    }

    // 2. Otherwise query RAG knowledge base
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'customer',
          message: text,
          chatHistory: messages.slice(-4),
          checkIn,
          checkOut,
          guests,
          customerId: user?.id,
          customerEmail: user?.email,
          preferredLanguage: detectedLang
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply || 'Here are the details from our hotel system.';

      if (!isVoiceMuted) {
        globalSpeaker.speak(reply, getBcp47LanguageCode(detectedLang));
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        availabilityReport: data.realtimeAvailability,
        suggestedQuestions: data.suggestedQuestions
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Thank you for asking about "${text}". Naidu Hotel offers 100% free cancellation up to 48 hours prior to check-in, complimentary 1Gbps Wi-Fi, and 24/7 guest services. For personalized assistance, you can also reach our Front Desk at +91 98765 43210.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: DEFAULT_QUESTIONS.slice(0, 3)
      };
      setMessages(prev => [...prev, fallbackMsg]);
      if (!isVoiceMuted) {
        globalSpeaker.speak(fallbackMsg.text, getBcp47LanguageCode(detectedLang));
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleBookRoom = (room: RoomTypeAvailability) => {
    if (onTriggerBookingPrefill) {
      onTriggerBookingPrefill({
        roomTypeId: room.roomTypeId,
        checkIn,
        checkOut,
        guests
      });
    } else if (onSelectRoomForBooking) {
      onSelectRoomForBooking(room.roomTypeId);
    } else if (onNavigateTab) {
      onNavigateTab('search-rooms');
    }
  };

  const handleCancelBooking = () => {
    const dict = PROMPTS[selectedLanguage] || PROMPTS.en;
    setVoiceBookingState({
      isActive: false,
      step: 'ask_room',
      language: selectedLanguage
    });
    if (!isVoiceMuted) {
      globalSpeaker.speak(dict.cancelled, getBcp47LanguageCode(selectedLanguage));
    }
    setMessages(prev => [
      ...prev,
      {
        id: `cancel-${Date.now()}`,
        sender: 'ai',
        text: dict.cancelled,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-5xl mx-auto space-y-4">
      {/* Header card with sound toggle and Aura branding */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            Aura — Luxury Concierge & Voice Booking
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personal virtual butler with automated multilingual speech recognition & real-time inventory RAG.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => {
              setIsVoiceMuted(!isVoiceMuted);
              if (!isVoiceMuted) globalSpeaker.stop();
            }}
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              !isVoiceMuted
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
            title={isVoiceMuted ? 'Voice output is muted' : 'Voice output is active'}
          >
            {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline font-medium">{isVoiceMuted ? 'Muted' : 'Audio On'}</span>
          </button>
        </div>
      </div>

      {/* In-Chatbot Microphone Permission Request Card */}
      {micPermissionDenied && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-950 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <MicOff className="w-5 h-5 text-amber-800" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                  Microphone Permission Needed
                </h4>
                <button
                  type="button"
                  onClick={() => setMicPermissionDenied(false)}
                  className="text-amber-700 hover:text-amber-950 text-xs font-semibold"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                Aura needs access to your microphone to enable hands-free voice booking and natural speech conversation.
              </p>

              {showBrowserGuide ? (
                <div className="mt-2.5 p-3 bg-white/95 border border-amber-200 rounded-lg text-xs text-slate-700 space-y-1.5">
                  <p className="font-bold text-amber-950 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-600" /> How to allow microphone access in your browser:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                    <li>Click the <strong>lock/tune icon (🔒)</strong> on the left side of your browser URL bar.</li>
                    <li>Locate <strong>Microphone</strong> and switch it from <em>Block</em> to <strong>Allow</strong>.</li>
                    <li>Click the <strong>Try Again</strong> button below to resume voice reservation.</li>
                  </ol>
                </div>
              ) : null}

              <div className="mt-3 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRequestMicPermission}
                  disabled={isRequestingMic}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60"
                >
                  <Mic className="w-4 h-4" />
                  {isRequestingMic ? 'Checking Permission...' : showBrowserGuide ? 'Try Again' : 'Grant Microphone Access'}
                </button>
                {!showBrowserGuide && (
                  <button
                    type="button"
                    onClick={() => setShowBrowserGuide(true)}
                    className="text-xs text-amber-800 hover:text-amber-950 underline font-medium"
                  >
                    Browser instructions
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice booking progress bar if active */}
      {voiceBookingState.isActive && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-3 text-xs border border-blue-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <Mic className="w-4 h-4 animate-pulse" />
              Guided Voice Booking Session
            </span>
            <button
              onClick={handleCancelBooking}
              className="text-xs text-blue-200 hover:text-white underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Cancel Booking
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className={`p-2 rounded border ${voiceBookingState.roomTypeName ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' : 'bg-white/10 border-white/10 text-slate-300'}`}>
              <span className="block text-[10px] uppercase text-slate-400">Room</span>
              <strong>{voiceBookingState.roomTypeName || 'Awaiting response...'}</strong>
            </div>
            <div className={`p-2 rounded border ${voiceBookingState.checkIn ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' : 'bg-white/10 border-white/10 text-slate-300'}`}>
              <span className="block text-[10px] uppercase text-slate-400">Check-In</span>
              <strong>{voiceBookingState.checkIn || 'Awaiting response...'}</strong>
            </div>
            <div className={`p-2 rounded border ${voiceBookingState.checkOut ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' : 'bg-white/10 border-white/10 text-slate-300'}`}>
              <span className="block text-[10px] uppercase text-slate-400">Check-Out</span>
              <strong>{voiceBookingState.checkOut || 'Awaiting response...'}</strong>
            </div>
            <div className={`p-2 rounded border ${voiceBookingState.guests ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' : 'bg-white/10 border-white/10 text-slate-300'}`}>
              <span className="block text-[10px] uppercase text-slate-400">Guests</span>
              <strong>{voiceBookingState.guests ? `${voiceBookingState.guests} Guests` : 'Awaiting response...'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Listening Banner */}
      {isListening && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-rose-800 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block" />
            <span className="font-semibold">
              Listening in {selectedLanguage === 'te' ? 'Telugu (తెలుగు)' : selectedLanguage === 'hi' ? 'Hindi (हिंदी)' : 'English'}... Speak your booking request or answer now!
            </span>
          </div>
          <button
            onClick={() => {
              recognizerRef.current?.stop();
              setIsListening(false);
            }}
            className="text-xs font-bold underline text-rose-900"
          >
            Stop
          </button>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-amber-300'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[80%] space-y-2 ${msg.sender === 'user' ? 'text-right' : ''}`}>
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed inline-block text-left ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Grounded Room Availability Cards */}
                {msg.availabilityReport && msg.availabilityReport.roomTypes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span>Real-Time Vacancy ({msg.availabilityReport.checkIn} → {msg.availabilityReport.checkOut})</span>
                      <span className="text-emerald-700 font-mono text-[10px]">
                        {msg.availabilityReport.totalAvailableRoomsForDates} rooms free
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.availabilityReport.roomTypes.map(rt => (
                        <div
                          key={rt.roomTypeId}
                          className={`p-2.5 rounded-lg border text-left flex flex-col justify-between ${
                            rt.isAvailable
                              ? 'bg-white border-slate-200 hover:border-blue-300'
                              : 'bg-slate-100 border-slate-200 opacity-60'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-900 text-xs">{rt.name}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                                  rt.isAvailable
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {rt.availabilityStatus}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              ₹{rt.basePricePerNight}/night · {rt.capacity} Guests
                            </p>
                          </div>

                          {rt.isAvailable && (
                            <button
                              onClick={() => handleBookRoom(rt)}
                              className="mt-2 w-full py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition-colors"
                            >
                              Select & Book Now
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-400 px-1">{msg.timestamp}</div>

              {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      disabled={isTyping}
                      className="text-[10px] bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-full px-2.5 py-1 text-left transition-colors font-medium shadow-2xs disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-blue-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2 text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Consulting Supabase inventory & hotel policies...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box with Microphone */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 shrink-0 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs"
      >
        <button
          type="button"
          onClick={handleToggleVoiceInput}
          disabled={isTyping}
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            isListening
              ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse scale-105'
              : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600'
          }`}
          title={isListening ? 'Listening... Click to stop' : 'Click to speak in selected language'}
          aria-label="Microphone button"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={
            isListening
              ? `Listening in ${selectedLanguage.toUpperCase()}...`
              : voiceBookingState.isActive
              ? `Voice booking in progress (${selectedLanguage.toUpperCase()})...`
              : 'Speak or type: "I want to book a Deluxe room" (English, తెలుగు, हिंदी)...'
          }
          className={`flex-1 px-3 py-2 text-xs bg-transparent focus:outline-none text-slate-900 placeholder-slate-400 ${
            isListening ? 'bg-rose-50/40 rounded' : ''
          }`}
          disabled={isTyping}
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors shadow-xs"
          aria-label="Send query"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
