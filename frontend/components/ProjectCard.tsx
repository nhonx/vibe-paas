import React from 'react';
import { Project } from '@/lib/api';

interface ProjectCardProps {
  project: Project;
  onStart: (id: number) => void;
  onStop: (id: number) => void;
  onDelete: (id: number) => void;
  onViewDetails: (id: number) => void;
}

const statusColors = {
  running: 'bg-green-100 text-green-800',
  stopped: 'bg-gray-100 text-gray-800',
  building: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
};

const typeColors = {
  static: 'bg-purple-100 text-purple-800',
  serverside: 'bg-indigo-100 text-indigo-800',
};

export default function ProjectCard({
  project,
  onStart,
  onStop,
  onDelete,
  onViewDetails,
}: ProjectCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {project.subdomain}.launch.me
          </p>
        </div>
        <div className="flex gap-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              statusColors[project.status]
            }`}
          >
            {project.status}
          </span>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              typeColors[project.type]
            }`}
          >
            {project.type}
          </span>
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-gray-600 mb-4">{project.description}</p>
      )}

      {project.error_message && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800">{project.error_message}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>Source: {project.source_type}</span>
        {project.port && <span>Port: {project.port}</span>}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(project.id)}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          Details
        </button>
        {project.status === 'stopped' && (
          <button
            onClick={() => onStart(project.id)}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Start
          </button>
        )}
        {project.status === 'running' && (
          <button
            onClick={() => onStop(project.id)}
            className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            Stop
          </button>
        )}
        <button
          onClick={() => onDelete(project.id)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
