import React, { useState, useEffect } from "react";
import { Project, projectsApi } from "@/lib/api";

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
  const [logs, setLogs] = useState<string>("");
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (isOpen && project && project.type === "serverside") {
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
      console.error("Failed to load logs:", error);
      setLogs("Failed to load logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white border-4 border-black shadow-neo-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
            <div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase">
                {project.name}
              </h2>
              <p className="font-bold text-gray-500">PROJECT DETAILS</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-neo-pink border-2 border-black flex items-center justify-center font-bold text-xl shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              &times;
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neo-bg border-3 border-black p-4 shadow-neo-sm">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">
                  Status
                </label>
                <p className="text-xl font-black uppercase">{project.status}</p>
              </div>
              <div className="bg-white border-3 border-black p-4 shadow-neo-sm">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">
                  Type
                </label>
                <p className="text-xl font-black uppercase">{project.type}</p>
              </div>
              <div className="bg-white border-3 border-black p-4 shadow-neo-sm">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">
                  Subdomain
                </label>
                <p className="text-lg font-bold truncate">
                  <a
                    href={`http://${project.subdomain}.ivibe.site`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neo-blue hover:bg-black hover:text-white px-1 -ml-1"
                  >
                    {project.subdomain}.ivibe.site
                  </a>
                </p>
              </div>
              <div className="bg-white border-3 border-black p-4 shadow-neo-sm">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">
                  Source Type
                </label>
                <p className="text-xl font-black uppercase">
                  {project.source_type}
                </p>
              </div>
            </div>

            <div className="bg-gray-100 border-3 border-black p-4 shadow-neo-sm">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                Source Path
              </label>
              <p className="text-sm font-mono break-all bg-white border-2 border-black p-2">
                {project.source_path}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.port && (
                <div className="bg-white border-3 border-black p-4 shadow-neo-sm">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">
                    Port
                  </label>
                  <p className="text-lg font-black font-mono">{project.port}</p>
                </div>
              )}

              {project.launch_command && (
                <div className="bg-white border-3 border-black p-4 shadow-neo-sm">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">
                    Launch Command
                  </label>
                  <p className="text-sm font-mono bg-gray-50 border-2 border-black p-2">
                    {project.launch_command}
                  </p>
                </div>
              )}
            </div>

            {project.container_id && (
              <div className="bg-white border-3 border-black p-4 shadow-neo-sm">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">
                  Container ID
                </label>
                <p className="text-sm font-mono bg-gray-50 border-2 border-black p-2">
                  {project.container_id}
                </p>
              </div>
            )}

            {project.description && (
              <div className="bg-white border-3 border-black p-4 shadow-neo-sm">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">
                  Description
                </label>
                <p className="font-medium italic border-l-4 border-neo-yellow pl-4">
                  {project.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-500 uppercase">
              <div>
                Created: {new Date(project.created_at).toLocaleString()}
              </div>
              <div className="text-right">
                Updated: {new Date(project.updated_at).toLocaleString()}
              </div>
            </div>

            {project.type === "serverside" && (
              <div className="border-t-4 border-black pt-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-lg font-black uppercase tracking-wider">
                    Container Logs
                  </label>
                  <button
                    onClick={loadLogs}
                    disabled={loadingLogs}
                    className="px-3 py-1 bg-white border-2 border-black font-bold text-xs uppercase shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                  >
                    {loadingLogs ? "Loading..." : "Refresh Logs"}
                  </button>
                </div>
                <div className="bg-neo-dark text-green-400 p-4 border-3 border-black shadow-neo font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto">
                  <pre>{logs || "No logs available"}</pre>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <button
              onClick={onClose}
              className="w-full px-6 py-4 border-3 border-black bg-white text-black font-black uppercase tracking-wider shadow-neo hover:shadow-neo-lg hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
