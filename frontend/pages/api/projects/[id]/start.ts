import type { NextApiRequest, NextApiResponse } from 'next';
import { projectService } from '@/lib/project-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ detail: 'Method not allowed' });
    }

    const { id } = req.query;
    const projectId = parseInt(id as string);

    if (isNaN(projectId)) {
      return res.status(400).json({ detail: 'Invalid project ID' });
    }

    const project = await projectService.startProject(projectId);
    res.status(200).json({
      message: `Project '${project.name}' started successfully`,
      status: project.status
    });
  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({ detail: error.message || 'Internal server error' });
  }
}
