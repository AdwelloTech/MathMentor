import React, { useEffect, useState } from "react";
import SessionList from "../components/SessionList";
import { classSchedulingService } from "../lib/classSchedulingService";
import { ClassSearchResult } from "../types/classScheduling";

const BookConsultationPage: React.FC = () => {
  const [sessions, setSessions] = useState<ClassSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadConsultations();
  }, [filterDate, filterSubject, searchTerm]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const filters: any = { class_type: 'Consultation' };
      if (filterDate) filters.date = filterDate;
      if (filterSubject) filters.subject = filterSubject;
      if (searchTerm) filters.search = searchTerm;
      const allSessions = await classSchedulingService.classes.getAvailableClasses(filters);
      setSessions(allSessions);
    } catch (err: any) {
      setError('Failed to load consultation sessions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        className="mb-6 text-blue-600 hover:underline flex items-center gap-2"
        onClick={() => window.history.back()}
      >
        &larr; Back to Dashboard
      </button>
      <h2 className="text-2xl font-bold mb-4">Book a Consultation</h2>
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Date Filter */}
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
          {/* Subject Filter */}
          <input
            type="text"
            placeholder="e.g., Math, Physics"
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="border rounded px-3 py-2"
          />
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search sessions or tutors..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border rounded px-3 py-2 flex-1 min-w-[200px]"
          />
        </div>
      </div>
      <SessionList
        sessions={sessions}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default BookConsultationPage;
