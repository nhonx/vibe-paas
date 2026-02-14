import React, { useState } from "react";
import useSWR from "swr";
import Layout from "@/components/Layout";
import ProjectCard from "@/components/ProjectCard";
import CreateProjectModal from "@/components/CreateProjectModal";
import ProjectDetailsModal from "@/components/ProjectDetailsModal";
import { projectsApi, Project, ProjectCreate } from "@/lib/api";

export default function Home() {
  const {
    data: projects,
    error,
    mutate,
  } = useSWR<Project[]>("/api/projects", projectsApi.list, {
    refreshInterval: 5000,
  });

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
      console.error("Failed to start project:", error);
      alert("Failed to start project");
    }
  };

  const handleStopProject = async (id: number) => {
    try {
      await projectsApi.stop(id);
      mutate();
    } catch (error) {
      console.error("Failed to stop project:", error);
      alert("Failed to stop project");
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      await projectsApi.delete(id);
      mutate();
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project");
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
        <div className="text-center py-20 bg-neo-pink border-4 border-black shadow-neo-lg">
          <h2 className="text-4xl font-black mb-4">OOPS!</h2>
          <p className="text-xl font-bold">
            Failed to load projects. Is the backend running?
          </p>
        </div>
      </Layout>
    );
  }

  if (!projects) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin w-16 h-16 border-8 border-black border-t-neo-yellow rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-12 flex justify-between items-end border-b-4 border-black pb-6 border-dashed">
        <div>
          <h2 className="text-4xl xs:text-5xl font-black italic tracking-tighter mb-2">
            YOUR{" "}
            <span
              className="text-neo-blue title-stroke text-transparent"
              style={{ WebkitTextStroke: "2px black" }}
            >
              PROJECTS
            </span>
          </h2>
          <p className="font-bold text-lg bg-white inline-block border-2 border-black px-2 shadow-neo-sm transform -rotate-1">
            MANAGE YOUR DEPLOYMENTS WITH STYLE
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-4 bg-neo-yellow text-black font-black text-lg border-3 border-black shadow-neo hover:shadow-neo-lg hover:-translate-y-1 hover:translate-x-1 active:translate-y-0 active:translate-x-0 active:shadow-none transition-all uppercase tracking-wide"
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white border-4 border-black shadow-neo-lg">
          <div className="inline-block p-6 rounded-full bg-neo-bg border-4 border-black mb-6 shadow-neo">
            <svg
              className="h-16 w-16 text-black"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-3xl font-black italic tracking-tight mb-2">
            NO PROJECTS YET
          </h3>
          <p className="text-lg font-bold text-gray-500 mb-8 max-w-md mx-auto">
            Your space is empty. Launch something awesome now!
          </p>
          <div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-4 bg-neo-green text-black font-black text-xl border-3 border-black shadow-neo hover:shadow-neo-lg hover:-translate-y-1 hover:translate-x-1 active:translate-y-0 active:translate-x-0 active:shadow-none transition-all uppercase"
            >
              LAUNCH PROJECT
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
