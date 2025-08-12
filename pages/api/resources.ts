/**
 * Mental Health Resources API Endpoint
 * Handles CRUD operations for mental health resources
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

interface ResourceRequestBody {
  id?: string;
  title: Record<string, string>;
  description: Record<string, string>;
  category: string;
  resourceType: string;
  contactInfo?: Record<string, any>;
  availability?: Record<string, any>;
  targetAudience?: string[];
  languages?: string[];
  isFree?: boolean;
  isEmergency?: boolean;
  isActive?: boolean;
  priority?: number;
}

interface ResourceResponseData {
  resources?: any[];
  resource?: any;
  error?: string;
  success?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResourceResponseData>
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Resources API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse<ResourceResponseData>) {
  const { category, language = 'en', isEmergency } = req.query;

  const where: any = { isActive: true };
  
  if (category) {
    where.category = category;
  }
  
  if (isEmergency !== undefined) {
    where.isEmergency = isEmergency === 'true';
  }

  const resources = await prisma.mentalHealthResource.findMany({
    where,
    orderBy: [
      { isEmergency: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return res.status(200).json({ resources });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse<ResourceResponseData>) {
  // Check admin authorization
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - admin authorization required' });
  }

  const {
    title,
    description,
    category,
    resourceType,
    contactInfo,
    availability,
    targetAudience = [],
    languages = ['en'],
    isFree = true,
    isEmergency = false,
    isActive = true,
    priority = 0
  }: ResourceRequestBody = req.body;

  // Validate required fields
  if (!title || !description || !category || !resourceType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const resource = await prisma.mentalHealthResource.create({
    data: {
      title,
      description,
      category,
      resourceType,
      contactInfo,
      availability,
      targetAudience,
      languages,
      isFree,
      isEmergency,
      isActive,
      priority
    }
  });

  return res.status(201).json({ resource });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse<ResourceResponseData>) {
  // Check admin authorization
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - admin authorization required' });
  }

  const { id, ...updateData }: ResourceRequestBody = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Resource ID is required' });
  }

  const resource = await prisma.mentalHealthResource.update({
    where: { id },
    data: updateData
  });

  return res.status(200).json({ resource });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse<ResourceResponseData>) {
  // Check admin authorization
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - admin authorization required' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Resource ID is required' });
  }

  await prisma.mentalHealthResource.delete({
    where: { id }
  });

  return res.status(200).json({ success: true });
}
