import React, { useState } from "react";
import { ProjectCreate } from "@/lib/api";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: ProjectCreate) => Promise<void>;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onCreate,
}: CreateProjectModalProps) {
  const [formData, setFormData] = useState<ProjectCreate>({
    name: "",
    type: "static",
    source_type: "github",
    source_path: "",
    launch_command: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await onCreate(formData);
      setFormData({
        name: "",
        type: "static",
        source_type: "github",
        source_path: "",
        launch_command: "",
        description: "",
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white border-4 border-black shadow-neo-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
            <h2 className="text-3xl font-black italic tracking-tighter">
              NEW PROJECT
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-neo-pink border-2 border-black flex items-center justify-center font-bold text-xl shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              &times;
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-neo-pink border-2 border-black shadow-neo-sm font-bold animate-pulse">
              <p className="text-black">ERROR: {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-black uppercase tracking-wider mb-2">
                Project Name *
              </label>
              <input
                type="text"
                required
                pattern="^[a-z0-9-]+$"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 border-3 border-black font-bold focus:outline-none focus:shadow-neo transition-shadow placeholder-gray-400 bg-gray-50"
                placeholder="my-project"
              />
              <p className="text-xs font-bold text-gray-500 mt-1 uppercase">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black uppercase tracking-wider mb-2">
                  Project Type *
                </label>
                <div className="relative">
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as "static" | "serverside",
                      })
                    }
                    className="w-full px-4 py-3 border-3 border-black font-bold focus:outline-none focus:shadow-neo transition-shadow appearance-none bg-white"
                  >
                    <option value="static">Static (Nginx)</option>
                    <option value="serverside">Serverside (Docker)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black font-bold">
                    ▼
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black uppercase tracking-wider mb-2">
                  Source Type *
                </label>
                <div className="relative">
                  <select
                    value={formData.source_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        source_type: e.target.value as "local" | "github",
                      })
                    }
                    className="w-full px-4 py-3 border-3 border-black font-bold focus:outline-none focus:shadow-neo transition-shadow appearance-none bg-white"
                  >
                    <option value="github">GitHub Repository</option>
                    <option value="local">Local Path</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black font-bold">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-black uppercase tracking-wider mb-2">
                {formData.source_type === "github"
                  ? "GitHub URL *"
                  : "Local Path *"}
              </label>
              <input
                type="text"
                required
                value={formData.source_path}
                onChange={(e) =>
                  setFormData({ ...formData, source_path: e.target.value })
                }
                className="w-full px-4 py-3 border-3 border-black font-bold focus:outline-none focus:shadow-neo transition-shadow placeholder-gray-400 bg-gray-50"
                placeholder={
                  formData.source_type === "github"
                    ? "https://github.com/user/repo.git"
                    : "/path/to/project"
                }
              />
            </div>

            {formData.type === "serverside" && (
              <div>
                <label className="block text-sm font-black uppercase tracking-wider mb-2">
                  Launch Command (Optional)
                </label>
                <input
                  type="text"
                  value={formData.launch_command}
                  onChange={(e) =>
                    setFormData({ ...formData, launch_command: e.target.value })
                  }
                  className="w-full px-4 py-3 border-3 border-black font-bold focus:outline-none focus:shadow-neo transition-shadow placeholder-gray-400 bg-gray-50 font-mono"
                  placeholder='["npm", "start"]'
                />
                <p className="text-xs font-bold text-gray-500 mt-1 uppercase">
                  Leave empty to auto-detect from project structure
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-black uppercase tracking-wider mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 border-3 border-black font-bold focus:outline-none focus:shadow-neo transition-shadow placeholder-gray-400 bg-gray-50"
                placeholder="Brief description of your project"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 border-3 border-black bg-white text-black font-black uppercase tracking-wider shadow-neo hover:shadow-neo-lg hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-4 border-3 border-black bg-neo-green text-black font-black uppercase tracking-wider shadow-neo hover:shadow-neo-lg hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "CREATING..." : "CREATE PROJECT"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
