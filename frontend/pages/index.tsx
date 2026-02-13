import React, { useState } from 'react';
import useSWR from 'swr';
import Layout from '@/components/Layout';
import ProjectCard from '@/components/ProjectCard';
import CreateProjectModal from '@/components/CreateProjectModal';
import ProjectDetailsModal from '@/components/ProjectDetailsModal';
import { projectsApi, Project, ProjectCreate } from '@/lib/api';

export default function Home() {
  const { data: projects, error, mutate } = useSWR<Project[]>(
    '/api/projects',
    projectsApi.list,
    { refreshInterval: 5000 }
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleCreateProject = async (data: ProjectCreate) => {
    const newProject = await projectsApi.create(data);
    // Automatically deploy the project after creation
    await projectsApi.deploy(newProject.id);
    mutate();
  };

  const handleStartProject = async (id: number) => {
    try {
      await projectsApi.start(id);
      mutate();
    } catch (error) {
      console.error('Failed to start project:', error);
      alert('Failed to start project');
    }
  };

  const handleStopProject = async (id: number) => {
    try {
      await projectsApi.stop(id);
      mutate();
    } catch (error) {
      console.error('Failed to stop project:', error);
      alert('Failed to stop project');
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await projectsApi.delete(id);
      mutate();
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    }
  };

  const handleViewDetails = (id: number) => {
    const project = projects?.find((p) => p.id === id);
    if (project) {
      setSelectedProject(project);
      setIsDetailsModalOpen(true);
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load projects. Is the backend running?</p>
        </div>
      </Layout>
    );
  }

  if (!projects) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading projects...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-600 mt-1">
            Manage your static and serverside deployments
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new project.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Create Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onStart={handleStartProject}
              onStop={handleStopProject}
              onDelete={handleDeleteProject}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />

      <ProjectDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        project={selectedProject}
      />
    </Layout>
  );
}
