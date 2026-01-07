import apiClient from "@/lib/apiClient";

export interface PublicTutor {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  profile_image_url?: string;
  subjects?: string[];
  specializations?: string[];
  qualification?: string;
  experience_years?: number;
  hourly_rate?: number;
  availability?: string;
  bio?: string;
  languages?: string[];
  is_online?: boolean;
  average_rating?: number;
  rating_count?: number;
  sessions_count?: number;
  students_count?: number;
  open_upcoming_sessions_count?: number;
}

export interface TutorReview {
  rating: number;
  review_text?: string;
  is_anonymous: boolean;
  created_at: string;
  student_name?: string;
  student_avatar_url?: string;
}

export interface TutorDetail extends PublicTutor {
  certifications?: string[];
  reviews: TutorReview[];
}

export interface TutorUpcomingSession {
  class: {
    id: string;
    title: string;
    description?: string;
    date: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    max_students: number;
    current_students?: number;
    price_per_session: number;
    status?: string;
    subject?: string | null;
  };
  tutor: {
    id: string;
    full_name: string;
    rating: number;
    total_reviews: number;
  };
  available_slots: number;
  max_students: number;
  is_bookable: boolean;
}

export const tutorService = {
  async getPublicTutors(): Promise<PublicTutor[]> {
    const data = await apiClient.get<any[]>("/api/tutors/explore");
    return (data || []).map((tutor) => ({
      id: tutor._id || tutor.id,
      full_name: tutor.full_name || `${tutor.first_name || ""} ${tutor.last_name || ""}`.trim(),
      first_name: tutor.first_name,
      last_name: tutor.last_name,
      email: tutor.email,
      avatar_url: tutor.avatar_url || tutor.profile_image_url,
      profile_image_url: tutor.profile_image_url || tutor.avatar_url,
      subjects: tutor.subjects || [],
      specializations: tutor.specializations || [],
      qualification: tutor.qualification,
      experience_years: tutor.experience_years,
      hourly_rate: tutor.hourly_rate,
      availability: tutor.availability,
      bio: tutor.bio,
      languages: tutor.languages || [],
      is_online: tutor.isOnline ?? tutor.is_online,
      average_rating: tutor.average_rating ?? 0,
      rating_count: tutor.rating_count ?? 0,
      sessions_count: tutor.sessions_count ?? 0,
      students_count: tutor.students_count ?? 0,
      open_upcoming_sessions_count: tutor.open_upcoming_sessions_count ?? 0,
    }));
  },

  async getTutorDetail(tutorId: string, limit = 20, skip = 0): Promise<TutorDetail> {
    const tutor = await apiClient.get<any>(`/api/tutors/${tutorId}/detail?limit=${limit}&skip=${skip}`);
    return {
      id: tutor._id || tutor.id,
      full_name: tutor.full_name || `${tutor.first_name || ""} ${tutor.last_name || ""}`.trim(),
      first_name: tutor.first_name,
      last_name: tutor.last_name,
      email: tutor.email,
      avatar_url: tutor.avatar_url || tutor.profile_image_url,
      profile_image_url: tutor.profile_image_url || tutor.avatar_url,
      subjects: tutor.subjects || [],
      specializations: tutor.specializations || [],
      qualification: tutor.qualification,
      experience_years: tutor.experience_years,
      hourly_rate: tutor.hourly_rate,
      availability: tutor.availability,
      bio: tutor.bio,
      languages: tutor.languages || [],
      is_online: tutor.is_online ?? false,
      average_rating: tutor.average_rating ?? 0,
      rating_count: tutor.rating_count ?? 0,
      sessions_count: tutor.sessions_count ?? 0,
      students_count: tutor.students_count ?? 0,
      certifications: tutor.certifications || [],
      reviews: (tutor.reviews || []).map((r: any) => ({
        rating: r.rating,
        review_text: r.review_text,
        is_anonymous: !!r.is_anonymous,
        created_at: r.created_at,
        student_name: r.student_name,
        student_avatar_url: r.student_avatar_url,
      })),
    };
  },

  async getTutorUpcomingSessions(tutorId: string, limit = 20): Promise<TutorUpcomingSession[]> {
    const data = await apiClient.get<any[]>(`/api/tutors/${tutorId}/sessions/upcoming?limit=${limit}`);
    return (data || []).map((item) => ({
      class: {
        id: item.class.id,
        title: item.class.title,
        description: item.class.description,
        date: item.class.date ? new Date(item.class.date).toISOString().slice(0, 10) : "",
        start_time: item.class.start_time,
        end_time: item.class.end_time,
        duration_minutes: item.class.duration_minutes,
        max_students: item.class.max_students,
        current_students: item.class.current_students,
        price_per_session: item.class.price_per_session,
        status: item.class.status,
        subject: item.class.subject || null,
      },
      tutor: {
        id: item.tutor.id,
        full_name: item.tutor.full_name,
        rating: item.tutor.rating ?? 0,
        total_reviews: item.tutor.total_reviews ?? 0,
      },
      available_slots: item.available_slots ?? 0,
      max_students: item.max_students ?? item.class.max_students,
      is_bookable: !!item.is_bookable,
    }));
  },
};




