import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (project: any) => void;
  initialData?: any; // If present, modal is in edit mode
}

const defaultFields = {
  name: '',
  description: '',
  sut_analysis: '',
  test_plan: '',
  requirements: '',
  more_context: '',
};

export const ProjectModal: React.FC<ProjectModalProps> = ({ open, onClose, onSuccess, initialData }) => {
  const [fields, setFields] = useState({ ...defaultFields });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFields({ ...defaultFields, ...initialData });
    } else {
      setFields({ ...defaultFields });
    }
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Only send relevant fields, and ensure no empty strings for numbers
      const payload: any = {
        name: fields.name,
        description: fields.description,
        sut_analysis: fields.sut_analysis,
        test_plan: fields.test_plan,
        requirements: fields.requirements,
        more_context: fields.more_context,
      };
      if (initialData && initialData.id) payload.id = initialData.id;
      const method = initialData ? 'PUT' : 'POST';
      const res = await fetch('/api/test-projects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Project ${initialData ? 'updated' : 'created'} successfully!`);
        onSuccess(data.data);
        onClose();
      } else {
        toast.error(data.error || 'Failed to save project');
      }
    } catch (err) {
      toast.error('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 relative flex flex-col items-center border border-gray-200">
        <button className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-6 text-center w-full">{initialData ? 'Edit Project' : 'New Project'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <div>
            <label className="block font-medium mb-1">Project Name *</label>
            <input name="name" value={fields.name} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea name="description" value={fields.description} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block font-medium mb-1">SUT Analysis</label>
            <textarea name="sut_analysis" value={fields.sut_analysis} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block font-medium mb-1">Test Plan</label>
            <textarea name="test_plan" value={fields.test_plan} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block font-medium mb-1">Requirements</label>
            <textarea name="requirements" value={fields.requirements} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block font-medium mb-1">More Context</label>
            <textarea name="more_context" value={fields.more_context} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-md">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal; 