import { useState, useEffect, useMemo } from "react";
import { instantSessionService } from "../../lib/instantSessionService";
import { sessionRatingService } from "../../lib/sessionRatingService";
import { useAuth } from "../../contexts/AuthContext";
import StudentPageWrapper from "../../components/ui/StudentPageWrapper";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  PlayIcon,
  MagnifyingGlassIcon,
  SignalIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { subjectsService } from "@/lib/subjects";
import type { Subject } from "@/types/subject";
import toast from "react-hot-toast";

type NoteSubject = Subject;

// Mock online tutors data
interface MockTutor {
  id: string;
  subject: string;
  color: string;
  initials: string;
  imageUrl: string;
}

const mockTutors: MockTutor[] = [
  { 
    id: "1", 
    subject: "Mathematics", 
    color: "from-blue-500 to-blue-600", 
    initials: "MA",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mathematics&backgroundColor=b6e3f4"
  },
  { 
    id: "2", 
    subject: "Physics", 
    color: "from-purple-500 to-purple-600", 
    initials: "PH",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Physics&backgroundColor=c0aede"
  },
  { 
    id: "3", 
    subject: "Chemistry", 
    color: "from-green-500 to-green-600", 
    initials: "CH",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chemistry&backgroundColor=b7e4c7"
  },
  { 
    id: "4", 
    subject: "Biology", 
    color: "from-emerald-500 to-emerald-600", 
    initials: "BI",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Biology&backgroundColor=a7f3d0"
  },
  { 
    id: "5", 
    subject: "English", 
    color: "from-red-500 to-red-600", 
    initials: "EN",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=English&backgroundColor=fecaca"
  },
  { 
    id: "6", 
    subject: "History", 
    color: "from-amber-500 to-amber-600", 
    initials: "HI",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=History&backgroundColor=fde68a"
  },
  { 
    id: "7", 
    subject: "Geography", 
    color: "from-cyan-500 to-cyan-600", 
    initials: "GE",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Geography&backgroundColor=a5f3fc"
  },
];

// Function to generate evenly distributed positions in a circular pattern
const generateTutorPositions = (count: number) => {
  const positions: { x: number; y: number; angle: number }[] = [];
  const minDistanceFromCenter = 150; // Minimum distance from center icon
  const maxDistanceFromCenter = 220; // Maximum distance for nice spread
  
  // Create evenly spaced angles with some randomness
  const baseAngleStep = (Math.PI * 2) / count;
  const angleRandomness = baseAngleStep * 0.3; // 30% randomness
  
  for (let i = 0; i < count; i++) {
    // Base angle evenly distributed
    const baseAngle = i * baseAngleStep;
    // Add some randomness but keep general distribution
    const angle = baseAngle + (Math.random() - 0.5) * angleRandomness;
    
    // Vary the distance for a more organic feel
    const distance = minDistanceFromCenter + Math.random() * (maxDistanceFromCenter - minDistanceFromCenter);
    
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    positions.push({ x, y, angle });
  }

  return positions;
};

export default function InstantSessionPage() {
  const { user } = useAuth();
  const [subjectId, setSubjectId] = useState("");
  const [subjects, setSubjects] = useState<NoteSubject[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "waiting" | "accepted" | "cancelled" | "expired" | "completed"
  >("idle");
  const [jitsiUrl, setJitsiUrl] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [acceptedAt, setAcceptedAt] = useState<Date | null>(null);
  const [isMockSession, setIsMockSession] = useState(false);
  const [tutorJoined, setTutorJoined] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [tutorId, setTutorId] = useState<string | null>(null);

  // Generate random tutor positions (memoized to avoid recalculating on every render)
  const tutorPositions = useMemo(() => generateTutorPositions(5), []);

  // Load available subjects from database (subjects with online tutors)
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await subjectsService.listAvailable();
        setSubjects(data || []);
      } catch (error) {
        console.error("Error loading available subjects:", error);
      }
    };

    loadSubjects();
  }, []);

  // Restore session state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("instantSessionState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.requestId && parsed.status && parsed.status !== "idle") {
          setRequestId(parsed.requestId);
          setStatus(parsed.status);
          setJitsiUrl(parsed.jitsiUrl);
          setSubjectId(parsed.subjectId);

          if (parsed.acceptedAt) {
            const acceptedAtDate = new Date(parsed.acceptedAt);
            setAcceptedAt(acceptedAtDate);

            // Check if session has expired
            const now = new Date();
            const elapsed = now.getTime() - acceptedAtDate.getTime();
            const remaining = 15 * 60 * 1000 - elapsed;

            if (remaining <= 0) {
              setStatus("expired");
              setTimeLeft(0);
              localStorage.removeItem("instantSessionState");
            }
          }
        }
      } catch (error) {
        console.error("Error restoring session state:", error);
        localStorage.removeItem("instantSessionState");
      }
    }
  }, []);

  // Save session state to localStorage whenever it changes (but NOT for mock sessions)
  useEffect(() => {
    if (requestId && status !== "idle" && !isMockSession) {
      // Only save real sessions, not mock test sessions
      const stateToSave = {
        requestId,
        status,
        jitsiUrl,
        subjectId,
        acceptedAt: acceptedAt?.toISOString(),
      };
      localStorage.setItem("instantSessionState", JSON.stringify(stateToSave));
    } else if (
      status === "idle" ||
      status === "expired" ||
      status === "cancelled" ||
      isMockSession
    ) {
      // Clear localStorage for idle, expired, cancelled, or mock sessions
      localStorage.removeItem("instantSessionState");
    }
  }, [requestId, status, jitsiUrl, subjectId, acceptedAt, isMockSession]);

  const handleRequest = async () => {
    if (!user?.id || !subjectId) return;

    try {
      console.log("[Student] Creating instant session request...");
      const request = await instantSessionService.createRequest(
        user.id,
        subjectId
      );
      console.log("[Student] Request created:", request.id || request._id);
      setRequestId(request.id || request._id);
      setStatus("waiting");
      setIsMockSession(false);
      setTutorJoined(false);
    } catch (error) {
      console.error("Error creating request:", error);
      alert("Failed to create instant session request. Please try again.");
    }
  };

  const handleCancel = async () => {
    if (!requestId || !user?.id) return;

    try {
      setCancelling(true);
      console.log("[Student] Cancelling request:", requestId);
      await instantSessionService.cancelRequest(requestId, user.id);
      console.log("[Student] Request cancelled successfully");
      setStatus("cancelled");
      setRequestId(null);
    } catch (error) {
      console.error("Error cancelling request:", error);
      // Fallback handling: check the latest status to decide what to do
      try {
        const latest = await instantSessionService.getRequestStatus(requestId);
        if (!latest || latest.status === "cancelled" || latest.status === "expired") {
          // Treat as cancelled locally to avoid getting stuck in waiting state
          console.warn("[Student] Treating as cancelled locally due to server response");
          setStatus("cancelled");
          setRequestId(null);
        } else if (latest.status === "accepted") {
          // Session already accepted before cancellation; transition to accepted flow
          console.warn("[Student] Request already accepted; switching to accepted state");
          setStatus("accepted");
          setJitsiUrl(latest.jitsiMeetingUrl || null);
          setAcceptedAt(latest.acceptedAt ? new Date(latest.acceptedAt) : new Date());
          setTutorJoined(!!latest.tutorJoinedAt);
        } else {
          // Still pending but cancel failed; optimistically cancel locally
          console.warn("[Student] Cancel failed but request still pending; cancelling locally");
          setStatus("cancelled");
          setRequestId(null);
        }
      } catch (statusErr) {
        console.error("[Student] Also failed to fetch latest status:", statusErr);
        // Last resort: cancel locally
        setStatus("cancelled");
        setRequestId(null);
      }
    } finally {
      setCancelling(false);
    }
  };

  // Poll for session status updates when waiting
  useEffect(() => {
    if (status !== "waiting" || !requestId) return;

    console.log("[Student] Starting to poll for session status:", requestId);
    
    const pollInterval = setInterval(async () => {
      try {
        const session = await instantSessionService.getRequestStatus(requestId);
        
        if (!session) {
          console.log("[Student] Session not found, may have been cancelled");
          setStatus("cancelled");
          clearInterval(pollInterval);
          return;
        }

        console.log("[Student] Session status:", session.status);

        if (session.status === "accepted") {
          console.log("[Student] Session accepted! URL:", session.jitsiMeetingUrl);
          setJitsiUrl(session.jitsiMeetingUrl || null);
          setStatus("accepted");
          setAcceptedAt(session.acceptedAt ? new Date(session.acceptedAt) : new Date());
          setTutorJoined(!!session.tutorJoinedAt);
          // Store tutor ID for rating later
          if (typeof session.tutorId === 'string') {
            setTutorId(session.tutorId);
          } else if (session.tutorId && typeof session.tutorId === 'object' && '_id' in session.tutorId) {
            setTutorId(session.tutorId._id);
          }
          clearInterval(pollInterval);
        } else if (session.status === "cancelled" || session.status === "expired") {
          console.log("[Student] Session cancelled or expired");
          setStatus(session.status);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("[Student] Error polling session status:", error);
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      console.log("[Student] Cleaning up polling interval");
      clearInterval(pollInterval);
    };
  }, [status, requestId]);

  // Poll for tutor joined status and session completion when session is accepted
  useEffect(() => {
    if (status !== "accepted" || !requestId) return;

    console.log("[Student] Polling for tutor joined status and session completion");

    const pollInterval = setInterval(async () => {
      try {
        const session = await instantSessionService.getRequestStatus(requestId);
        
        if (!session) {
          console.log("[Student] Session not found");
          clearInterval(pollInterval);
          return;
        }

        // Check if session is completed
        if (session.status === 'completed') {
          console.log("[Student] Session has been completed by tutor");
          setStatus("completed");
          clearInterval(pollInterval);
          return;
        }
        
        // Check if tutor has joined
        if (session.tutorJoinedAt && !tutorJoined) {
          console.log("[Student] Tutor has joined! Student can now join.");
          setTutorJoined(true);
        }
      } catch (error) {
        console.error("[Student] Error checking session status:", error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [status, requestId, tutorJoined]);


  // Reset function to clear state and localStorage
  const resetSession = () => {
    setStatus("idle");
    setRequestId(null);
    setJitsiUrl(null);
    setTimeLeft(null);
    setAcceptedAt(null);
    setSubjectId("");
    setIsMockSession(false);
    setTutorJoined(false);
    localStorage.removeItem("instantSessionState");
  };

  // Timer effect
  useEffect(() => {
    if (status !== "accepted" || !acceptedAt) {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = now.getTime() - acceptedAt.getTime();
      const remaining = 15 * 60 * 1000 - elapsed; // 15 minutes in milliseconds

      if (remaining <= 0) {
        setTimeLeft(0);
        setStatus("expired");
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, [status, acceptedAt]);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleJoin = async () => {
    if (jitsiUrl && timeLeft && timeLeft > 0 && tutorJoined && requestId) {
      // Mark student as joined
      try {
        await instantSessionService.markStudentJoined(requestId);
      } catch (error) {
        console.error("[Student] Error marking as joined:", error);
      }
      
      window.open(jitsiUrl, "_blank");
    }
  };

  const getSubjectName = (id: string) => {
    const subject = subjects.find((s) => s.id === id);
    return subject?.display_name || subject?.name || id;
  };

  const handleSubmitRating = async () => {
    if (!requestId || !tutorId || !user?.id || rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmittingRating(true);
      
      await sessionRatingService.create({
        sessionId: requestId,
        tutorId: tutorId,
        rating: rating,
        reviewText: ratingComment || undefined,
        isAnonymous: false,
      });

      setRatingSubmitted(true);
      toast.success("Thank you for your feedback!");
      
      // Reset after 3 seconds
      setTimeout(() => {
        resetSession();
      }, 3000);
    } catch (error: any) {
      console.error("[Student] Error submitting rating:", error);
      toast.error(error.message || "Failed to submit rating. Please try again.");
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <StudentPageWrapper backgroundClass="bg-background">
      <div className="relative overflow-hidden min-h-screen">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5"></div>

        <div className="max-w-4xl mx-auto relative z-10 px-4 py-8">
          <AnimatePresence mode="wait">
            {/* IDLE STATE - Subject Selection */}
            {status === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full mb-6 shadow-lg shadow-primary/20"
                  >
                    <SparklesIcon className="w-10 h-10 text-white" />
                  </motion.div>
                  <h1 className="text-5xl font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Instant Session
                  </h1>
                  <p className="text-xl text-muted-foreground flex items-center justify-center gap-2">
                    <ClockIcon className="w-6 h-6 text-primary" />
                    <span>15 minutes • Connect instantly</span>
                  </p>
                </div>

                {/* Main Selection Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-primary/5 to-transparent p-8 md:p-12">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                        <AcademicCapIcon className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        Need help right now?
                      </h2>
                      <p className="text-muted-foreground text-lg">
                        Choose your subject and we'll find an available tutor
                      </p>
                    </div>

                    <div className="space-y-6 max-w-md mx-auto">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                          Select Subject
                        </label>
                        <Select value={subjectId} onValueChange={setSubjectId}>
                          <SelectTrigger className="w-full p-5 border-2 border-border rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 text-lg bg-background/80 backdrop-blur hover:border-primary/50 focus:outline-none h-auto shadow-lg">
                            <SelectValue placeholder="Choose a subject..." />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-2 border-border rounded-2xl shadow-2xl backdrop-blur-xl">
                            {subjects.map((subject) => (
                              <SelectItem
                                key={subject.id}
                                value={subject.id}
                                className="py-4 px-5 text-lg hover:bg-primary/10 focus:bg-primary/10 cursor-pointer rounded-xl my-1 mx-1"
                              >
                                {subject.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <motion.button
                        onClick={handleRequest}
                        disabled={!subjectId}
                        whileHover={{ scale: subjectId ? 1.02 : 1 }}
                        whileTap={{ scale: subjectId ? 0.98 : 1 }}
                        className="w-full bg-gradient-to-r from-primary to-primary/90 text-white py-5 px-8 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-lg disabled:from-gray-400 disabled:to-gray-500"
                      >
                        <SignalIcon className="w-6 h-6" />
                        Find Tutor Now
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      icon: ClockIcon,
                      title: "15-Min Sessions",
                      desc: "Quick help when you need it",
                      color: "from-blue-500/10 to-blue-600/10",
                    },
                    {
                      icon: UserGroupIcon,
                      title: "Expert Tutors",
                      desc: "Qualified & ready to help",
                      color: "from-primary/10 to-emerald-600/10",
                    },
                    {
                      icon: SparklesIcon,
                      title: "Instant Match",
                      desc: "No waiting, start learning",
                      color: "from-yellow-500/10 to-orange-600/10",
                    },
                  ].map((feature, idx) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="bg-card/30 backdrop-blur rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 group"
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* WAITING STATE - Uber-like Search Animation */}
            {status === "waiting" && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-center py-8 min-h-[calc(100vh-200px)]"
              >
                <div className="w-full max-w-[1600px] px-8">
                  {/* Horizontal Layout: Animation Left, Content Right */}
                  <div className="flex lg:flex-row flex-col gap-16 items-center min-h-[600px]">

                    {/* LEFT COLUMN - Animated Search Container */}
                    <div className="relative h-[600px] flex items-center justify-center lg:flex-1">
                      {/* Animated circular waves - More visible Uber style */}
                      <div className="absolute inset-0 flex items-center justify-center z-0">
                        {[...Array(4)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-56 h-56 rounded-full border-4 border-primary shadow-lg shadow-primary/20"
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{
                              scale: [0, 2.2, 2.2],
                              opacity: [1, 0.4, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.375,
                              ease: "easeOut",
                            }}
                          />
                        ))}
                      </div>

                      {/* Mock Tutor Profiles - Randomly positioned */}
                      {tutorPositions.map((pos, idx) => {
                        const tutor = mockTutors[idx % mockTutors.length];
                        return (
                          <motion.div
                            key={tutor.id + idx}
                            className="absolute z-10"
                            style={{
                              left: `calc(50% + ${pos.x * 0.75}px)`,
                              top: `calc(50% + ${pos.y * 0.75}px)`,
                              transform: 'translate(-50%, -50%)',
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ 
                              scale: [0, 1.1, 1],
                              opacity: 1,
                            }}
                            transition={{
                              duration: 0.5,
                              delay: 0.8 + idx * 0.15,
                              type: "spring",
                              stiffness: 200,
                              damping: 15,
                            }}
                          >
                            <motion.div
                              className="relative"
                              animate={{
                                y: [0, -8, 0],
                              }}
                              transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                delay: idx * 0.3,
                                ease: "easeInOut",
                              }}
                            >
                              {/* Tutor Card */}
                              <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-xl border-2 border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
                                <div className="p-3 flex flex-col items-center gap-2 min-w-[90px]">
                                  {/* Avatar with image */}
                                  <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-lg ring-2 ring-background">
                                    <img 
                                      src={tutor.imageUrl} 
                                      alt={tutor.subject}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback to gradient with initials if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${tutor.color} flex items-center justify-center">
                                            <span class="text-white font-bold text-sm">${tutor.initials}</span>
                                          </div>`;
                                        }
                                      }}
                                    />
                                  </div>
                                  {/* Subject Name */}
                                  <div className="text-center">
                                    <p className="text-xs font-bold text-foreground leading-tight">{tutor.subject}</p>
                                    <div className="flex items-center gap-1 justify-center mt-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                      <span className="text-[10px] text-green-600 font-semibold">Online</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        );
                      })}

                      {/* Center Icon with Pulse */}
                      <motion.div
                        className="relative z-20 mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-2xl shadow-primary/30"
                        animate={{
                          scale: [1, 1.08, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.8, 1, 0.8],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <MagnifyingGlassIcon className="w-10 h-10 text-white" />
                        </motion.div>
                      </motion.div>
                    </div>

                    {/* RIGHT COLUMN - Text Content & Actions */}
                    <motion.div
                      className="space-y-6 flex flex-col items-center justify-center h-full lg:flex-1 lg:ml-32"
                    >
                      <div className="text-center w-full max-w-lg">
                        <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                          Finding your tutor...
                        </h2>
                        <p className="text-xl text-muted-foreground">
                          Searching for available tutors in{" "}
                          <span className="text-primary font-semibold">
                            {getSubjectName(subjectId)}
                          </span>
                        </p>
                      </div>

                      {/* Animated Status Dots */}
                      <div className="flex items-center justify-center space-x-3 py-2">
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-3 h-3 bg-primary rounded-full"
                            animate={{
                              y: [0, -12, 0],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </div>

                      {/* Info Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-card/50 backdrop-blur-xl rounded-2xl p-6 border border-border/50 w-full max-w-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <SignalIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-foreground mb-1">
                              Ready to connect
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Your request is active. Click "Connect to Session" when you're ready to start.
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-4 pt-4 w-full max-w-md">

                        {/* Cancel Button */}
                        <motion.button
                          onClick={handleCancel}
                          disabled={cancelling}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-destructive/10 text-destructive border-2 border-destructive/30 px-8 py-3 rounded-xl hover:bg-destructive/20 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                        >
                          <XCircleIcon className="w-5 h-5" />
                          {cancelling ? "Cancelling..." : "Cancel Request"}
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ACCEPTED STATE - Tutor Found */}
            {status === "accepted" && (
              <motion.div
                key="accepted"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-2xl mx-auto"
              >
                {/* Success Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="text-center mb-8"
                >
                  <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary to-emerald-600 rounded-full mb-6 shadow-2xl shadow-primary/30">
                    <CheckCircleIcon className="w-16 h-16 text-white" />
                  </div>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-bold text-foreground mb-3"
                  >
                    Tutor Found!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl text-muted-foreground"
                  >
                    {tutorJoined 
                      ? "Your tutor is in the meeting room - you can join now!"
                      : "A tutor has accepted your request. Waiting for them to enter the meeting room..."
                    }
                  </motion.p>
                </motion.div>

                {/* Session Details Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-card/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden"
                >
                  <div className="p-8">
                    {timeLeft !== null && (
                      <div className="bg-gradient-to-br from-primary/10 to-emerald-500/10 rounded-2xl p-6 mb-6 border border-primary/20">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <ClockIcon className="w-6 h-6 text-primary" />
                          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                            Session Time Remaining
                          </span>
                        </div>
                        <div
                          className={`text-5xl font-bold text-center ${
                            timeLeft < 5 * 60 * 1000 ? "text-destructive" : "text-primary"
                          }`}
                        >
                          {formatTime(timeLeft)}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {jitsiUrl && timeLeft && timeLeft > 0 && (
                        <>
                          {!tutorJoined ? (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 text-center"
                            >
                              <motion.div
                                animate={{
                                  rotate: 360,
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                              >
                                <ClockIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                              </motion.div>
                              <p className="text-base font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                Waiting for tutor to enter the meeting room
                              </p>
                              <p className="text-sm text-blue-600 dark:text-blue-400">
                                The join button will appear once your tutor has joined
                              </p>
                            </motion.div>
                          ) : (
                            <>
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 text-center"
                              >
                                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                   Tutor is ready! You can join now
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  Click the button below to enter the meeting
                                </p>
                              </motion.div>
                              
                              <motion.button
                                onClick={handleJoin}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-primary to-emerald-600 text-white py-5 px-8 rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-3"
                              >
                                <PlayIcon className="w-6 h-6" />
                                Join Session Now
                              </motion.button>
                            </>
                          )}
                        </>
                      )}

                      <button
                        onClick={resetSession}
                        className="w-full bg-destructive/10 text-destructive border-2 border-destructive/30 py-4 px-6 rounded-2xl font-semibold text-lg hover:bg-destructive/20 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <XCircleIcon className="w-5 h-5" />
                        End Session
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* EXPIRED STATE */}
            {status === "expired" && (
              <motion.div
                key="expired"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto text-center"
              >
                <div className="bg-card/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-12">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-destructive/10 rounded-full mb-6">
                    <ExclamationTriangleIcon className="w-12 h-12 text-destructive" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-3">Session Expired</h2>
                  <p className="text-muted-foreground text-lg mb-8">
                    The 15-minute time limit has passed
                  </p>
                  <button
                    onClick={resetSession}
                    className="bg-primary text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary/90 transition-all duration-200 shadow-lg"
                  >
                    Request New Session
                  </button>
                </div>
              </motion.div>
            )}

            {/* CANCELLED STATE */}
            {status === "cancelled" && (
              <motion.div
                key="cancelled"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto text-center"
              >
                <div className="bg-card/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-12">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-muted/50 rounded-full mb-6">
                    <XCircleIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-3">Request Cancelled</h2>
                  <p className="text-muted-foreground text-lg mb-8">
                    Your instant session request has been cancelled
                  </p>
                  <button
                    onClick={resetSession}
                    className="bg-primary text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary/90 transition-all duration-200 shadow-lg"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}

            {/* COMPLETED STATE - Rate Your Tutor */}
            {status === "completed" && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-card/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary to-emerald-600 p-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <CheckCircleIcon className="w-20 h-20 text-white mx-auto mb-4" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Session Completed!
                    </h2>
                    <p className="text-white/90 text-lg">
                      Thank you for using Math Mentor
                    </p>
                  </div>

                  {/* Rating Form */}
                  {!ratingSubmitted ? (
                    <div className="p-8 space-y-6">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          How was your session?
                        </h3>
                        <p className="text-muted-foreground">
                          Rate your tutor and help us improve
                        </p>
                      </div>

                      {/* Star Rating */}
                      <div className="flex items-center justify-center gap-3 py-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            onClick={() => setRating(star)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="focus:outline-none"
                          >
                            {rating >= star ? (
                              <StarIconSolid className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
                            ) : (
                              <StarIcon className="w-12 h-12 text-gray-300 hover:text-yellow-400 transition-colors" />
                            )}
                          </motion.button>
                        ))}
                      </div>

                      {rating > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center"
                        >
                          <p className="text-lg font-semibold text-primary">
                            {rating === 5 && "⭐ Excellent!"}
                            {rating === 4 && "😊 Great!"}
                            {rating === 3 && "👍 Good"}
                            {rating === 2 && "😐 Fair"}
                            {rating === 1 && "😞 Needs Improvement"}
                          </p>
                        </motion.div>
                      )}

                      {/* Comment */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Share your thoughts (optional)
                        </label>
                        <textarea
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          placeholder="Tell us about your experience..."
                          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 resize-none"
                          rows={4}
                        />
                      </div>

                      {/* Submit Button */}
                      <motion.button
                        onClick={handleSubmitRating}
                        disabled={rating === 0 || submittingRating}
                        whileHover={{ scale: rating > 0 ? 1.02 : 1 }}
                        whileTap={{ scale: rating > 0 ? 0.98 : 1 }}
                        className={`w-full py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                          rating > 0
                            ? 'bg-gradient-to-r from-primary to-emerald-600 text-white hover:shadow-2xl hover:shadow-primary/30'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {submittingRating ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                            />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-6 h-6" />
                            <span>Submit Rating</span>
                          </>
                        )}
                      </motion.button>

                      {/* Skip Button */}
                      <button
                        onClick={resetSession}
                        className="w-full text-muted-foreground hover:text-foreground transition-colors text-sm"
                      >
                        Skip for now
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-12 text-center"
                    >
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                        <CheckCircleIcon className="w-12 h-12 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        Thank you for your feedback!
                      </h3>
                      <p className="text-muted-foreground text-lg">
                        Redirecting you to the home page...
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </StudentPageWrapper>
  );
}
