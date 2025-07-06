import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  X, 
  Save, 
  FolderPlus, 
  Edit3, 
  FileText, 
  Target, 
  CheckCircle, 
  Lightbulb,
  Sparkles
} from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-indigo-600/90"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                {initialData ? <Edit3 className="w-6 h-6" /> : <FolderPlus className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {initialData ? 'Edit Project' : 'Create New Project'}
                  <Sparkles className="w-5 h-5 opacity-80" />
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {initialData ? 'Update your project details and configuration' : 'Set up a new testing project with comprehensive details'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="name" 
                    value={fields.name} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter a descriptive project name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea 
                    name="description" 
                    value={fields.description} 
                    onChange={handleChange} 
                    placeholder="Brief description of the project scope and objectives"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Testing Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SUT Analysis */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">SUT Analysis</h3>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System Under Test Analysis</label>
                <textarea 
                  name="sut_analysis" 
                  value={fields.sut_analysis} 
                  onChange={handleChange} 
                  placeholder="Analyze the system architecture, components, and testing scope..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Test Plan */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Test Plan</h3>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Testing Strategy & Plan</label>
                <textarea 
                  name="test_plan" 
                  value={fields.test_plan} 
                  onChange={handleChange} 
                  placeholder="Define testing approach, methodologies, and execution strategy..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Requirements & Context */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Requirements */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Requirements</h3>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Requirements</label>
                <textarea 
                  name="requirements" 
                  value={fields.requirements} 
                  onChange={handleChange} 
                  placeholder="List functional and non-functional requirements to be tested..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Additional Context */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Additional Context</h3>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">More Context & Notes</label>
                <textarea 
                  name="more_context" 
                  value={fields.more_context} 
                  onChange={handleChange} 
                  placeholder="Add any additional context, constraints, or important notes..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Always Visible */}
        <div className="border-t border-gray-200 bg-gray-50 p-6 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              <span className="font-medium">Tip:</span> Detailed project information helps AI provide better bug analysis and suggestions
            </div>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                onClick={handleSubmit}
                disabled={loading || !fields.name.trim()}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {initialData ? 'Update Project' : 'Create Project'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal; 