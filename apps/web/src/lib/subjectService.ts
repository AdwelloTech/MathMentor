// apps/web/src/lib/subjectService.ts
import { getNoteSubjects } from "./tutorNotes";
export type Subject = { id: string; name: string; display_name?: string; color?: string };
export const subjectService = {
  async getAll(): Promise<Subject[]> {
    return await getNoteSubjects();
  }
};
export default subjectService;