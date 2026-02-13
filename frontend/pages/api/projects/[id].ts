import type { NextApiRequest, NextApiResponse } from 'next';
import { projectDb } from '@/lib/db';
import { projectService } from '@/lib/project-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const projectId = parseInt(id as string);

    if (isNaN(projectId)) {
      return res.status(400).json({ detail: 'Invalid project ID' });
    }

    if (req.method === 'GET') {
      // Get project by ID
      const project = projectDb.getById(projectId);
      if (!project) {
        return res.status(404).json({ detail: 'Project not found' });
      }
      res.status(200).json(project);
    } else if (req.method === 'PUT') {
      // Update project
      const { description, launch_command } = req.body;
      const updates: any = {};
      if (description !== undefined) updates.description = description;
      if (launch_command !== undefined) updates.launch_command = launch_command;

      const project = projectDb.update(projectId, updates);
      if (!project) {
        return res.status(404).json({ detail: 'Project not found' });
      }
      res.status(200).json(project);
    } else if (req.method === 'DELETE') {
      // Delete project
      await projectService.deleteProject(projectId);
      res.status(204).end();
    } else {
      res.status(405).json({ detail: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({ detail: error.message || 'Internal server error' });
  }
}
