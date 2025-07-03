import React from 'react';

interface ProjectSelectorProps {
  projects: any[];
  selectedProjectId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  loading?: boolean;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  onSelect,
  onCreate,
  onEdit,
  loading = false,
}) => {
  return (
    <div className="mb-4 flex items-center gap-2">
      <label className="font-semibold mr-2">Current Project:</label>
      <select
        className="border rounded px-2 py-1 min-w-[180px]"
        value={selectedProjectId}
        onChange={e => onSelect(e.target.value)}
        disabled={loading}
      >
        <option value="">No Project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} {p.sut_analysis ? `- ${p.sut_analysis.slice(0, 30)}...` : ''}
          </option>
        ))}
      </select>
      <button
        className="ml-2 px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
        onClick={onCreate}
        type="button"
      >
        New Project
      </button>
      <button
        className="ml-1 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
        onClick={() => onEdit(selectedProjectId)}
        type="button"
        disabled={!selectedProjectId}
      >
        Edit
      </button>
    </div>
  );
};

export default ProjectSelector; 