import type { NextApiRequest, NextApiResponse } from 'next';
import { projectDb, ProjectCreate } from '@/lib/db';
import { projectService } from '@/lib/project-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // List all projects
      const projects = projectDb.getAll();
      res.status(200).json(projects);
    } else if (req.method === 'POST') {
      // Create new project
      const data: ProjectCreate = req.body;

      // Validate
      if (!data.name || !data.type || !data.source_type || !data.source_path) {
        return res.status(400).json({ detail: 'Missing required fields' });
      }

      if (!/^[a-z0-9-]+$/.test(data.name)) {
        return res.status(400).json({ detail: 'Project name must be lowercase alphanumeric with hyphens only' });
      }

      const project = await projectService.createProject(data);
      res.status(201).json(project);
    } else {
      res.status(405).json({ detail: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({ detail: error.message || 'Internal server error' });
  }
}
