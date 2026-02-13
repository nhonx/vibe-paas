import React, { useState, useEffect } from 'react';
import { Project, projectsApi } from '@/lib/api';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export default function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
}: ProjectDetailsModalProps) {
  const [logs, setLogs] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (isOpen && project && project.type === 'serverside') {
      loadLogs();
    }
  }, [isOpen, project]);

  const loadLogs = async () => {
    if (!project) return;
    
    setLoadingLogs(true);
    try {
      const response = await projectsApi.logs(project.id);
      setLogs(response.logs);
    } catch (error) {
      console.error('Failed to load logs:', error);
      setLogs('Failed to load logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Project Details: {project.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Status
                </label>
                <p className="mt-1 text-lg font-semibold capitalize">
                  {project.status}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Type
                </label>
                <p className="mt-1 text-lg font-semibold capitalize">
                  {project.type}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Subdomain
                </label>
                <p className="mt-1 text-lg">
                  <a
                    href={`http://${project.subdomain}.ivibe.site`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {project.subdomain}.ivibe.site
                  </a>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Source Type
                </label>
                <p className="mt-1 text-lg capitalize">{project.source_type}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Source Path
              </label>
              <p className="mt-1 text-sm bg-gray-50 p-2 rounded break-all">
                {project.source_path}
              </p>
            </div>

            {project.port && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Port
                </label>
                <p className="mt-1 text-lg">{project.port}</p>
              </div>
            )}

            {project.launch_command && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Launch Command
                </label>
                <p className="mt-1 text-sm bg-gray-50 p-2 rounded font-mono">
                  {project.launch_command}
                </p>
              </div>
            )}

            {project.container_id && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Container ID
                </label>
                <p className="mt-1 text-sm bg-gray-50 p-2 rounded font-mono">
                  {project.container_id}
                </p>
              </div>
            )}

            {project.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Description
                </label>
                <p className="mt-1 text-sm">{project.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Created At
                </label>
                <p className="mt-1 text-sm">
                  {new Date(project.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Updated At
                </label>
                <p className="mt-1 text-sm">
                  {new Date(project.updated_at).toLocaleString()}
                </p>
              </div>
            </div>

            {project.type === 'serverside' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-500">
                    Container Logs
                  </label>
                  <button
                    onClick={loadLogs}
                    disabled={loadingLogs}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    {loadingLogs ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                  <pre>{logs || 'No logs available'}</pre>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
