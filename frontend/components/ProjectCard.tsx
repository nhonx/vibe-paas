import React from "react";
import { Project } from "@/lib/api";

interface ProjectCardProps {
  project: Project;
  onStart: (id: number) => void;
  onStop: (id: number) => void;
  onDelete: (id: number) => void;
  onViewDetails: (id: number) => void;
}

const statusColors: Record<string, string> = {
  running: "bg-neo-green text-black",
  stopped: "bg-gray-300 text-black",
  building: "bg-neo-blue text-white",
  failed: "bg-neo-pink text-black",
};

const typeColors: Record<string, string> = {
  static: "bg-purple-300 text-black",
  serverside: "bg-orange-300 text-black",
};

export default function ProjectCard({
  project,
  onStart,
  onStop,
  onDelete,
  onViewDetails,
}: ProjectCardProps) {
  return (
    <div className="bg-white border-3 border-black shadow-neo hover:shadow-neo-lg hover:-translate-y-1 transition-all duration-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-black text-black tracking-tight">
            {project.name}
          </h3>
          <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-wider">
            {project.subdomain}.ivibe.site
          </p>
        </div>
        <div className="flex gap-2 flex-col items-end">
          <span
            className={`px-3 py-1 text-xs font-bold border-2 border-black shadow-neo-sm ${
              statusColors[project.status] || "bg-gray-200 text-black"
            }`}
          >
            {project.status.toUpperCase()}
          </span>
          <span
            className={`px-3 py-1 text-xs font-bold border-2 border-black shadow-neo-sm ${
              typeColors[project.type] || "bg-gray-200 text-black"
            }`}
          >
            {project.type.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex-grow">
        {project.description && (
          <p className="text-sm font-medium border-l-4 border-black pl-3 py-1 mb-4 bg-gray-100">
            {project.description}
          </p>
        )}

        {project.error_message && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-black text-red-700 font-bold text-sm shadow-neo-sm">
            ERROR: {project.error_message}
          </div>
        )}

        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 border-t-2 border-black pt-4 border-dashed">
          <span>{project.source_type}</span>
          {project.port && (
            <span className="bg-black text-white px-2 py-0.5">
              {project.port}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto">
        <button
          onClick={() => onViewDetails(project.id)}
          className="col-span-2 px-4 py-2 bg-white border-2 border-black font-bold shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
        >
          VIEW DETAILS
        </button>
        {project.status === "stopped" && (
          <button
            onClick={() => onStart(project.id)}
            className="px-4 py-2 bg-neo-green border-2 border-black font-bold shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
          >
            START
          </button>
        )}
        {project.status === "running" && (
          <button
            onClick={() => onStop(project.id)}
            className="px-4 py-2 bg-neo-yellow border-2 border-black font-bold shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
          >
            STOP
          </button>
        )}
        <button
          onClick={() => onDelete(project.id)}
          className="px-4 py-2 bg-neo-pink border-2 border-black font-bold shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
        >
          DELETE
        </button>
      </div>
    </div>
  );
}
