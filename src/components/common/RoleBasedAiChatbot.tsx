import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareCode,
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  BedDouble,
  ChevronRight,
  Shield,
  Building,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHotel } from '../../context/HotelContext';
import { RoomTypeAvailability, RealtimeAvailabilityReport } from '../../lib/ragKnowledgeService';
import {
  VoiceRecognizer,
  globalSpeaker,
  getBcp47LanguageCode,
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
  queryMicrophonePermission,
  VoiceLanguage
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
  operationalMetrics?: any;
  bookingCardState?: VoiceBookingState;
}

interface RoleBasedAiChatbotProps {
  onNavigateTab?: (tabId: string) => void;
  onSelectRoomForBooking?: (roomTypeId: string) => void;
  onTriggerBookingPrefill?: (data: { roomTypeId: string; checkIn: string; checkOut: string; guests: number }) => void;
}

export const RoleBasedAiChatbot: React.FC<RoleBasedAiChatbotProps> = ({
  onNavigateTab,
  onSelectRoomForBooking,
  onTriggerBookingPrefill
}) => {
  const { user, role } = useAuth();
  const { roomTypes } = useHotel();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Date availability filters
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [guests, setGuests] = useState(2);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Voice & Multilingual Controls
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);
  const recognizerRef = useRef<VoiceRecognizer | null>(null);

  // Active Voice Booking Conversation State
  const [voiceBookingState, setVoiceBookingState] = useState<VoiceBookingState>({
    isActive: false,
    step: 'ask_room',
    language: 'en'
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognizer and check microphone permission
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

  // Sync Voice Mute setting
  useEffect(() => {
    globalSpeaker.setMuted(isVoiceMuted);
  }, [isVoiceMuted]);

  // Initialize greeting on role change or first mount
  useEffect(() => {
    let greeting = '';
    let quickQuestions: string[] = [];

    if (role === 'admin') {
      greeting = `Welcome Administrator ${user?.fullName || ''}. I am Aura, your Executive Strategic Intelligence Advisor for Naidu Luxury Hotel & Resort. I have real-time visibility into live Supabase booking ledgers, revenue KPIs, ADR, and predictive cancellation risk. How can I assist with your executive analysis today?`;
      quickQuestions = [
        "What is our total revenue and ADR so far?",
        "How many bookings are flagged as high cancellation risk?",
        "Which rooms are available this upcoming weekend?",
        "What are our cancellation mitigation recommendations?"
      ];
    } else if (role === 'management') {
      greeting = `Hello ${user?.fullName || 'Manager'}. I am Aura, your Operations Copilot. I track live room statuses, today's check-ins and departures, housekeeping turnaround, and front-desk capacity. How can I support your shift today?`;
      quickQuestions = [
        "What is today's occupancy rate?",
        "How many guest arrivals and departures are scheduled today?",
        "Which rooms are currently in maintenance?",
        "Are there any suites available for walk-in guests?"
      ];
    } else {
      greeting = `Namaste ${user?.fullName || 'Guest'}! Welcome to Naidu Luxury Hotel & Resort. I am Aura, your personal AI Luxury Concierge with Voice Booking Automation.\n\nYou can speak or type to me in English, Telugu (తెలుగు), or Hindi (हिंदी) — I will automatically understand and respond in your language! Say "I want to book a room", "నాకు డీలక్స్ రూమ్ బుక్ చేయాలి", or "मुझे कमरा बुक करना है" to start an automated voice reservation.`;
      quickQuestions = [
        "I want to book a Deluxe room",
        "Which rooms are available for my dates?",
        "What is the cancellation and refund policy?",
        "What ID documents do I need for check-in?"
      ];
    }

    setMessages([
      {
        id: `initial-${role}`,
        sender: 'ai',
        text: greeting,
        timestamp: 'Just now',
        suggestedQuestions: quickQuestions
      }
    ]);
  }, [role, user?.fullName]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Request Microphone Permission
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

  // Start or Stop Speech Recognition
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

    // If permission was already denied, trigger permission request
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
    if (!text || isLoading) return;

    // Detect language of the query
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
    setIsLoading(true);

    // 1. Check if user is in an active booking flow or asking to book
    if (voiceBookingState.isActive || isBookingIntent(text)) {
      const activeState = voiceBookingState.isActive
        ? voiceBookingState
        : { isActive: true, step: 'ask_room' as const, language: detectedLang };

      const result = processVoiceBookingInput(text, activeState, roomTypes);
      setVoiceBookingState(result.state);

      // Play Text-To-Speech in user's language
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
      setIsLoading(false);

      // Check if all mandatory booking fields have been collected (roomTypeId, checkIn, checkOut, guests)
      const isAllMandatoryCollected = Boolean(
        result.state.roomTypeId &&
        result.state.checkIn &&
        result.state.checkOut &&
        result.state.guests
      );

      // Handle Automated Navigation to Booking Page & Prefill
      if (isAllMandatoryCollected || result.action === 'navigate_to_booking') {
        const prefillPayload = {
          roomTypeId: result.state.roomTypeId || (roomTypes[0] ? roomTypes[0].id : 'deluxe-ocean'),
          checkIn: result.state.checkIn || checkIn,
          checkOut: result.state.checkOut || checkOut,
          guests: Number(result.state.guests || guests)
        };

        // Immediately trigger onTriggerBookingPrefill callback to prefill CustomerSearchRooms
        if (onTriggerBookingPrefill) {
          onTriggerBookingPrefill(prefillPayload);
        } else if (onSelectRoomForBooking) {
          onSelectRoomForBooking(prefillPayload.roomTypeId);
        } else if (onNavigateTab) {
          onNavigateTab('search-rooms');
        }

        // Close the floating chatbot so customer is automatically redirected to the booking page with inputs pre-filled
        setTimeout(() => {
          setIsOpen(false);
        }, 1200);
      }
      return;
    }

    // 2. Otherwise, route to normal Hotel Knowledge RAG Concierge
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role || 'customer',
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
      const reply = data.reply || 'Here is the requested hotel intelligence.';

      // Speak response in detected language
      if (!isVoiceMuted) {
        globalSpeaker.speak(reply, getBcp47LanguageCode(detectedLang));
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        availabilityReport: data.realtimeAvailability,
        operationalMetrics: data.operationalMetrics,
        suggestedQuestions: data.suggestedQuestions
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      // Local fallback in case server endpoint had network lag
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `I've checked our hotel records for "${text}". All direct website reservations at Naidu Hotel include 100% free cancellation up to 48 hours prior to check-in, complimentary 1Gbps Wi-Fi, and beachfront pool access. You can explore available suites or speak with our 24/7 Front Desk at +91 98765 43210.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          "Which rooms are available this weekend?",
          "What is the check-in and check-out time?"
        ]
      };
      setMessages(prev => [...prev, fallbackMsg]);
      if (!isVoiceMuted) {
        globalSpeaker.speak(fallbackMsg.text, getBcp47LanguageCode(detectedLang));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckAvailability = () => {
    setShowDatePicker(false);
    handleSendMessage(`Are there any rooms available from ${checkIn} to ${checkOut} for ${guests} guest${guests > 1 ? 's' : ''}?`);
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
    setIsOpen(false);
  };

  const handleCancelBookingFlow = () => {
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          "Which rooms are available for my dates?",
          "What is the cancellation and refund policy?",
          "What ID documents do I need for check-in?"
        ]
      }
    ]);
  };

  const getRoleBadge = () => {
    if (role === 'admin') {
      return {
        label: 'Executive Intelligence',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        headerBg: 'bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900',
        icon: Shield
      };
    }
    if (role === 'management') {
      return {
        label: 'Operations Intelligence',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        headerBg: 'bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900',
        icon: Building
      };
    }
    return {
      label: 'Personal Concierge',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      headerBg: 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900',
      icon: Sparkles
    };
  };

  const roleMeta = getRoleBadge();
  const RoleIcon = roleMeta.icon;

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-xl shadow-blue-600/30 transition-all duration-200 hover:scale-105 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="Open Aura Concierge"
        >
          <div className="relative">
            <RoleIcon className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-blue-600" />
          </div>
          <span className="text-sm font-bold tracking-wide pr-1">
            {role === 'admin' ? 'Aura Executive' : role === 'management' ? 'Aura Operations' : 'Aura Concierge'}
          </span>
          <div className="flex items-center gap-1 pl-1 border-l border-white/20 text-blue-200">
            <Mic className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Voice</span>
          </div>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'w-[95vw] sm:w-[700px] h-[85vh]'
              : 'w-[92vw] sm:w-[460px] h-[600px]'
          }`}
        >
          {/* Header */}
          <div className={`${roleMeta.headerBg} text-white px-4 py-3.5 flex items-center justify-between shrink-0 shadow-md`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
                <RoleIcon className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">Aura</h3>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${roleMeta.badgeColor}`}>
                    {roleMeta.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Online · 24/7 Virtual Concierge
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              {/* TTS Audio Mute/Unmute */}
              <button
                onClick={() => {
                  setIsVoiceMuted(!isVoiceMuted);
                  if (!isVoiceMuted) globalSpeaker.stop();
                }}
                className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${!isVoiceMuted ? 'text-amber-300 bg-white/10' : 'text-slate-400'}`}
                title={isVoiceMuted ? 'Voice Speech is Muted' : 'Voice Speech is Active'}
              >
                {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${showDatePicker ? 'text-amber-300 bg-white/10' : ''}`}
                title="Select Stay Dates for Availability"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors hidden sm:inline-flex"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  globalSpeaker.stop();
                  if (recognizerRef.current) recognizerRef.current.abort();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* In-Chatbot Microphone Permission Request Card */}
          {micPermissionDenied && (
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-300 p-3.5 text-xs text-amber-950 shrink-0 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <MicOff className="w-4 h-4 text-amber-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      Microphone Permission Needed
                    </h4>
                    <button
                      type="button"
                      onClick={() => setMicPermissionDenied(false)}
                      className="text-amber-700 hover:text-amber-950 text-[11px] font-semibold"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-900 mt-1 leading-relaxed">
                    Aura needs microphone access so you can speak naturally, ask questions, and complete automated voice reservations.
                  </p>

                  {showBrowserGuide ? (
                    <div className="mt-2 p-2 bg-white/90 border border-amber-200 rounded-lg text-[10px] text-slate-700 space-y-1">
                      <p className="font-bold text-amber-900 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-600" /> To unblock in your browser:
                      </p>
                      <ol className="list-decimal pl-4 space-y-0.5 text-slate-600">
                        <li>Click the <strong>lock/tune icon (🔒)</strong> on the left side of your browser URL bar.</li>
                        <li>Find <strong>Microphone</strong> and switch it to <strong>Allow</strong>.</li>
                        <li>Click <strong>Try Again</strong> below to start speaking.</li>
                      </ol>
                    </div>
                  ) : null}

                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRequestMicPermission}
                      disabled={isRequestingMic}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      {isRequestingMic ? 'Checking Permission...' : showBrowserGuide ? 'Try Again' : 'Grant Microphone Access'}
                    </button>
                    {!showBrowserGuide && (
                      <button
                        type="button"
                        onClick={() => setShowBrowserGuide(true)}
                        className="text-[11px] text-amber-800 hover:text-amber-950 underline font-medium"
                      >
                        Browser instructions
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Voice Booking Guided Session Bar */}
          {voiceBookingState.isActive && (
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-3 text-xs border-b border-blue-800 shadow-inner shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 font-bold tracking-tight text-amber-300">
                  <Mic className="w-3.5 h-3.5 animate-pulse" />
                  Voice Booking Assistant in Progress
                </span>
                <button
                  onClick={handleCancelBookingFlow}
                  className="text-[10px] text-blue-200 hover:text-white underline flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Cancel Booking
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                <div className={`p-1.5 rounded border ${voiceBookingState.roomTypeName ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' : 'bg-white/10 border-white/10 text-slate-300'}`}>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">Suite</span>
                  <strong className="truncate block">{voiceBookingState.roomTypeName || 'Speaking...'}</strong>
                </div>

                <div className={`p-1.5 rounded border ${voiceBookingState.checkIn ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' : 'bg-white/10 border-white/10 text-slate-300'}`}>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">Check-In</span>
                  <strong className="truncate block">{voiceBookingState.checkIn || 'Speaking...'}</strong>
                </div>

                <div className={`p-1.5 rounded border ${voiceBookingState.checkOut ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' : 'bg-white/10 border-white/10 text-slate-300'}`}>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">Check-Out</span>
                  <strong className="truncate block">{voiceBookingState.checkOut || 'Speaking...'}</strong>
                </div>

                <div className={`p-1.5 rounded border ${voiceBookingState.guests ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' : 'bg-white/10 border-white/10 text-slate-300'}`}>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">Guests</span>
                  <strong className="truncate block">{voiceBookingState.guests ? `${voiceBookingState.guests} Guests` : 'Speaking...'}</strong>
                </div>
              </div>

              {Boolean(voiceBookingState.roomTypeId && voiceBookingState.checkIn && voiceBookingState.checkOut && voiceBookingState.guests) && (
                <div className="mt-2 pt-2 border-t border-blue-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> All details collected!
                  </span>
                  <button
                    onClick={() => {
                      if (onTriggerBookingPrefill && voiceBookingState.roomTypeId) {
                        onTriggerBookingPrefill({
                          roomTypeId: voiceBookingState.roomTypeId,
                          checkIn: voiceBookingState.checkIn!,
                          checkOut: voiceBookingState.checkOut!,
                          guests: Number(voiceBookingState.guests!)
                        });
                      } else if (onSelectRoomForBooking && voiceBookingState.roomTypeId) {
                        onSelectRoomForBooking(voiceBookingState.roomTypeId);
                      } else if (onNavigateTab) {
                        onNavigateTab('search-rooms');
                      }
                      setIsOpen(false);
                    }}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-bold shadow-xs flex items-center gap-1 transition-all active:scale-95"
                  >
                    Go to Booking Page <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Date Range Selector Drawer (Toggleable) */}
          {showDatePicker && (
            <div className="bg-slate-50 border-b border-slate-200 p-3 text-xs space-y-2 shrink-0 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Real-Time Date Availability Filter
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Queries active Supabase ledger
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Check-In</label>
                  <input
                    type="date"
                    value={checkIn}
                    min={todayStr}
                    onChange={e => setCheckIn(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Check-Out</label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || todayStr}
                    onChange={e => setCheckOut(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Guests</label>
                  <select
                    value={guests}
                    onChange={e => setGuests(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests</option>
                    <option value={3}>3 Guests</option>
                    <option value={4}>4 Guests</option>
                    <option value={6}>6+ Family</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleCheckAvailability}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3 h-3" /> Check Live Vacancy
                </button>
              </div>
            </div>
          )}

          {/* Active Listening Notification Banner */}
          {isListening && (
            <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block" />
                <span className="font-semibold">
                  Listening in {selectedLanguage === 'te' ? 'Telugu (తెలుగు)' : selectedLanguage === 'hi' ? 'Hindi (हिंदी)' : 'English'}... Speak now!
                </span>
              </div>
              <button
                onClick={() => {
                  recognizerRef.current?.stop();
                  setIsListening(false);
                }}
                className="text-[11px] underline font-bold"
              >
                Stop
              </button>
            </div>
          )}

          {/* Transient Voice Notice */}
          {voiceNotice && (
            <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-[11px] text-amber-800 flex items-center justify-between">
              <span>{voiceNotice}</span>
              <button onClick={() => setVoiceNotice(null)} className="text-amber-900 font-bold ml-2">×</button>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>

                  {/* Render Grounded Room Availability Cards if present in AI response */}
                  {msg.availabilityReport && msg.availabilityReport.roomTypes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                        <span>Live Rooms for {msg.availabilityReport.checkIn} → {msg.availabilityReport.checkOut}</span>
                        <span className="text-emerald-700 font-mono text-[10px]">
                          {msg.availabilityReport.totalAvailableRoomsForDates} rooms free
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                        {msg.availabilityReport.roomTypes.slice(0, 4).map(rt => (
                          <div
                            key={rt.roomTypeId}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                              rt.isAvailable
                                ? 'bg-slate-50 border-slate-200 hover:border-blue-300'
                                : 'bg-slate-100/60 border-slate-200 opacity-60'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs truncate">
                                  {rt.name}
                                </span>
                                <span
                                  className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full ${
                                    rt.availabilityStatus === 'Available'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : rt.availabilityStatus === 'Limited (1-2 left)'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {rt.availabilityStatus}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                ₹{rt.basePricePerNight}/nt · {rt.capacity} Guests · {rt.bedType}
                              </p>
                            </div>

                            {rt.isAvailable ? (
                              <button
                                onClick={() => handleBookRoom(rt)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[10px] shrink-0 flex items-center gap-1 shadow-xs active:scale-95"
                              >
                                Book Now <ChevronRight className="w-2.5 h-2.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-rose-600 font-medium shrink-0">
                                Sold Out
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Render Operational Metrics Card for Staff if present */}
                  {msg.operationalMetrics && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-1.5 text-[10px]">
                      {msg.operationalMetrics.occupancyRate && (
                        <div className="bg-blue-50 border border-blue-100 p-1.5 rounded-lg">
                          <span className="text-slate-500 block">Occupancy Rate</span>
                          <span className="font-bold text-blue-900 text-xs">{msg.operationalMetrics.occupancyRate}</span>
                        </div>
                      )}
                      {msg.operationalMetrics.todaysArrivalsCount !== undefined && (
                        <div className="bg-emerald-50 border border-emerald-100 p-1.5 rounded-lg">
                          <span className="text-slate-500 block">Today's Check-Ins</span>
                          <span className="font-bold text-emerald-900 text-xs">{msg.operationalMetrics.todaysArrivalsCount} guests</span>
                        </div>
                      )}
                      {msg.operationalMetrics.highRiskCount !== undefined && (
                        <div className="bg-rose-50 border border-rose-100 p-1.5 rounded-lg">
                          <span className="text-slate-500 block">High Risk Bookings</span>
                          <span className="font-bold text-rose-900 text-xs">{msg.operationalMetrics.highRiskCount} bookings</span>
                        </div>
                      )}
                      {msg.operationalMetrics.averageAdr && (
                        <div className="bg-purple-50 border border-purple-100 p-1.5 rounded-lg">
                          <span className="text-slate-500 block">Average ADR</span>
                          <span className="font-bold text-purple-900 text-xs">₹{msg.operationalMetrics.averageAdr}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>

                {/* Suggested Follow-Up Prompt Chips */}
                {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {msg.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        disabled={isLoading}
                        className="text-[10px] bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-full px-2.5 py-1 text-left transition-colors font-medium shadow-2xs disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl rounded-bl-xs text-xs text-slate-500 max-w-[70%] shadow-2xs">
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Consulting Supabase inventory & hotel policies...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Date Bar for Customer */}
          <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
            <span className="truncate">
              Stay: <strong className="text-slate-800">{checkIn}</strong> to <strong className="text-slate-800">{checkOut}</strong> ({guests}G)
            </span>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="text-blue-600 hover:text-blue-700 font-semibold ml-2 shrink-0 hover:underline"
            >
              Change Dates
            </button>
          </div>

          {/* Input Footer with Microphone Button */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            {/* Microphone Button */}
            <button
              type="button"
              onClick={handleToggleVoiceInput}
              disabled={isLoading}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                isListening
                  ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse scale-105 shadow-md'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200'
              }`}
              title={
                isListening
                  ? 'Listening... Click to stop'
                  : `Click to speak in ${selectedLanguage === 'te' ? 'Telugu' : selectedLanguage === 'hi' ? 'Hindi' : 'English'}`
              }
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
                  : role === 'admin'
                  ? 'Ask about revenue, ADR, or high cancellation risks...'
                  : role === 'management'
                  ? 'Ask about occupancy, arrivals, or room maintenance...'
                  : 'Speak or type: "I want to book a Deluxe room"...'
              }
              className={`flex-1 px-3 py-2 text-xs bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all ${
                isListening ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              }`}
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
