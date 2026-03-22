import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Child } from '../types';
import * as api from '../api/client';

interface Props {
  children: Child[];
  onUpdate: () => void;
}

interface ChildFormValues {
  name: string;
  grade: string;
}

export default function ChildManager({ children, onUpdate }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addForm = useForm<ChildFormValues>();
  const editForm = useForm<ChildFormValues>();

  const handleAdd = async (values: ChildFormValues) => {
    setSubmitting(true);
    try {
      await api.createChild(values);
      addForm.reset();
      setAdding(false);
      onUpdate();
    } catch {
      // Error handled silently
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: ChildFormValues) => {
    if (!editingId) return;
    setSubmitting(true);
    try {
      await api.updateChild(editingId, values);
      setEditingId(null);
      onUpdate();
    } catch {
      // Error handled silently
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteChild(id);
      onUpdate();
    } catch {
      // Error handled silently
    }
  };

  const startEdit = (child: Child) => {
    setEditingId(child.id);
    editForm.setValue('name', child.name);
    editForm.setValue('grade', child.grade);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-kindo-gray-800">My Children</h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg bg-kindo-purple px-3 py-1.5 text-xs font-medium text-white transition hover:bg-kindo-purple-dark"
          >
            + Add Child
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={addForm.handleSubmit(handleAdd)} className="mb-4 rounded-lg border border-kindo-gray-200 bg-white p-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                {...addForm.register('name', { required: true })}
                placeholder="Child's name"
                className="w-full rounded-lg border border-kindo-gray-300 px-3 py-1.5 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
              />
            </div>
            <div>
              <input
                {...addForm.register('grade')}
                placeholder="Grade (optional)"
                className="w-full rounded-lg border border-kindo-gray-300 px-3 py-1.5 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
              />
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-kindo-purple px-3 py-1.5 text-xs font-medium text-white transition hover:bg-kindo-purple-dark disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); addForm.reset(); }}
              className="rounded-lg border border-kindo-gray-300 px-3 py-1.5 text-xs font-medium text-kindo-gray-600 transition hover:bg-kindo-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {children.length === 0 && !adding ? (
        <p className="rounded-lg border border-dashed border-kindo-gray-300 p-4 text-center text-sm text-kindo-gray-500">
          No children added yet. Add a child to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {children.map((child) => (
            <li key={child.id} className="rounded-lg border border-kindo-gray-200 bg-white p-3">
              {editingId === child.id ? (
                <form onSubmit={editForm.handleSubmit(handleEdit)}>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      {...editForm.register('name', { required: true })}
                      className="w-full rounded-lg border border-kindo-gray-300 px-3 py-1.5 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
                    />
                    <input
                      {...editForm.register('grade')}
                      className="w-full rounded-lg border border-kindo-gray-300 px-3 py-1.5 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-lg bg-kindo-purple px-3 py-1.5 text-xs font-medium text-white transition hover:bg-kindo-purple-dark disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-kindo-gray-300 px-3 py-1.5 text-xs font-medium text-kindo-gray-600 transition hover:bg-kindo-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-kindo-gray-800">{child.name}</span>
                    {child.grade && (
                      <span className="ml-2 text-xs text-kindo-gray-500">{child.grade}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(child)}
                      className="rounded px-2 py-1 text-xs text-kindo-purple hover:bg-kindo-purple/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(child.id)}
                      className="rounded px-2 py-1 text-xs text-kindo-red hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
