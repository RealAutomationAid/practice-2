import React from 'react';

interface ProjectContextBoxProps {
  project: any | null;
  onEdit: () => void;
}

export const ProjectContextBox: React.FC<ProjectContextBoxProps> = ({ project, onEdit }) => {
  if (!project) return null;
  return (
    <div className="mb-4 p-4 border rounded bg-gray-50 relative">
      <button
        className="absolute top-2 right-2 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
        onClick={onEdit}
        type="button"
      >
        Edit
      </button>
      <h3 className="font-bold text-lg mb-2">Project Context</h3>
      <div className="text-sm space-y-1">
        <div><span className="font-semibold">Name:</span> {project.name}</div>
        {project.sut_analysis && <div><span className="font-semibold">SUT Analysis:</span> {project.sut_analysis}</div>}
        {project.test_plan && <div><span className="font-semibold">Test Plan:</span> {project.test_plan}</div>}
        {project.requirements && <div><span className="font-semibold">Requirements:</span> {project.requirements}</div>}
        {project.testing_types && <div><span className="font-semibold">Testing Types:</span> {typeof project.testing_types === 'string' ? project.testing_types : JSON.stringify(project.testing_types)}</div>}
        {project.tools_frameworks && <div><span className="font-semibold">Tools/Frameworks:</span> {project.tools_frameworks}</div>}
        {project.more_context && <div><span className="font-semibold">More Context:</span> {project.more_context}</div>}
        {project.allocated_hours && <div><span className="font-semibold">Allocated Hours:</span> {project.allocated_hours}</div>}
        {project.number_of_test_cases && <div><span className="font-semibold"># Test Cases:</span> {project.number_of_test_cases}</div>}
        {project.risk_matrix_generation && <div><span className="font-semibold">Risk Matrix Generation:</span> Yes</div>}
      </div>
    </div>
  );
};

export default ProjectContextBox; 