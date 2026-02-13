import type { NextApiRequest, NextApiResponse } from 'next';
import { projectService } from '@/lib/project-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ detail: 'Method not allowed' });
    }

    const { id, tail } = req.query;
    const projectId = parseInt(id as string);
    const tailLines = tail ? parseInt(tail as string) : 100;

    if (isNaN(projectId)) {
      return res.status(400).json({ detail: 'Invalid project ID' });
    }

    const logs = await projectService.getProjectLogs(projectId, tailLines);
    res.status(200).json({ logs });
  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({ detail: error.message || 'Internal server error' });
  }
}
