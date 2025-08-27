import React, { useEffect, useMemo, useState } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { subjectsService } from "@/lib/subjects";
import type { Subject } from "@/types/subject";

const ManageSubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newColor, setNewColor] = useState<string | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string | "">("");
  const [editActive, setEditActive] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const data = await subjectsService.listAll();
      setSubjects(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load subjects");
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return subjects;
    const term = search.toLowerCase();
    return subjects.filter(
      (s) =>
        s.display_name.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term)
    );
  }, [subjects, search]);

  const startCreate = () => {
    setCreating(true);
    setNewName("");
    setNewDisplayName("");
    setNewColor("");
  };

  const cancelCreate = () => {
    setCreating(false);
  };

  const submitCreate = async () => {
    if (!newDisplayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    const nameKey = newName.trim() || newDisplayName.trim().toLowerCase();

    // Check for duplicate names using the same normalization as backend
    if (subjects.some(s => s.name === nameKey)) {
      toast.error(`A subject with the key "${nameKey}" already exists`);
      return;
    }

    try {
      const created = await subjectsService.create({
        name: nameKey,
        display_name: newDisplayName.trim(),
        color: newColor || null,
      });
      setSubjects((prev) => [...prev, created]);
      toast.success("Subject created");
      setCreating(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to create subject");
    }
  };

  const startEdit = (s: Subject) => {
    setEditingId(s.id);
    setEditDisplayName(s.display_name);
    setEditName(s.name);
    setEditColor(s.color || "");
    setEditActive(s.is_active);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const submitEdit = async () => {
    if (!editingId) return;
    try {
      const updated = await subjectsService.update(editingId, {
        name: editName,
        display_name: editDisplayName,
        color: editColor || null,
        is_active: editActive,
      });
      setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      toast.success("Subject updated");
      setEditingId(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to update subject");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    try {
      await subjectsService.remove(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      toast.success("Subject deleted");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to delete subject");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
        {!creating ? (
          <button
            onClick={startCreate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            <PlusIcon className="h-5 w-5 mr-2" /> New Subject
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              placeholder="Display Name"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="border rounded-md p-2"
            />
            <input
              placeholder="Key (optional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="border rounded-md p-2"
            />
            <input
              placeholder="#Color (optional)"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="border rounded-md p-2 w-40"
            />
            <button onClick={submitCreate} className="px-3 py-2 bg-green-600 text-white rounded-md">
              <CheckIcon className="h-5 w-5" />
            </button>
            <button onClick={cancelCreate} className="px-3 py-2 bg-gray-200 rounded-md">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md p-2 w-64"
          />
        </div>

        <div className="divide-y">
          {loadError ? (
            <div className="p-6 text-center">
              <div className="text-red-600 mb-4">Failed to load subjects</div>
              <button
                onClick={loadSubjects}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Retrying...
                  </>
                ) : (
                  'Retry Loading'
                )}
              </button>
            </div>
          ) : loading ? (
            <div className="p-6 text-center text-gray-600">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No subjects</div>
          ) : (
            filtered.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between">
                {editingId === s.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 pr-4">
                    <input
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      className="border rounded-md p-2"
                    />
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border rounded-md p-2"
                    />
                    <input
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="border rounded-md p-2"
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={editActive}
                        onChange={(e) => setEditActive(e.target.checked)}
                        className="rounded"
                      />
                      Active
                    </label>
                  </div>
                ) : (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 pr-4">
                    <div>
                      <div className="font-medium">{s.display_name}</div>
                      <div className="text-xs text-gray-500">{s.name}</div>
                    </div>
                    <div className="text-sm">
                      {s.color || "-"}
                    </div>
                    <div className="text-sm">
                      {s.is_active ? (
                        <span className="text-green-700">Active</span>
                      ) : (
                        <span className="text-gray-500">Inactive</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(s.updated_at || s.created_at).toLocaleString()}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {editingId === s.id ? (
                    <>
                      <button
                        onClick={submitEdit}
                        className="px-2 py-2 bg-green-600 text-white rounded-md"
                        title="Save"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-2 py-2 bg-gray-200 rounded-md"
                        title="Cancel"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(s)}
                        className="px-2 py-2 bg-blue-50 text-blue-700 rounded-md"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => remove(s.id)}
                        className="px-2 py-2 bg-red-50 text-red-700 rounded-md"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageSubjectsPage;


