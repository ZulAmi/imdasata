import { NextApiRequest, NextApiResponse } from 'next';
import ResourcesDirectoryManager, { ResourceFilter } from '../../lib/resources-directory';

// Initialize directory manager
const directoryManager = new ResourcesDirectoryManager();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGetResources(req, res);
      case 'POST':
        return handleCreateResource(req, res);
      case 'PUT':
        return handleUpdateResource(req, res);
      case 'DELETE':
        return handleDeleteResource(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/resources - Search and filter resources
 */
function handleGetResources(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      categories,
      languages,
      cost,
      searchQuery,
      sortBy = 'rating',
      sortOrder = 'desc',
      lat,
      lng,
      maxDistance
    } = req.query;

    // Build filter object
    const filter: ResourceFilter = {
      searchQuery: searchQuery as string || '',
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    };

    // Parse categories
    if (categories) {
      filter.categories = Array.isArray(categories) 
        ? categories as any[]
        : (categories as string).split(',') as any[];
    }

    // Parse languages
    if (languages) {
      filter.languages = Array.isArray(languages)
        ? languages as string[]
        : (languages as string).split(',');
    }

    // Parse cost filters
    if (cost) {
      filter.cost = Array.isArray(cost)
        ? cost as any[]
        : (cost as string).split(',') as any[];
    }

    // Parse location if provided
    if (lat && lng) {
      filter.location = {
        coordinates: {
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string)
        },
        maxDistance: maxDistance ? parseFloat(maxDistance as string) : undefined
      };
    }

    // Perform search
    const results = directoryManager.searchResources(filter, 
      filter.location?.coordinates ? filter.location.coordinates : undefined
    );

    return res.status(200).json({
      success: true,
      data: results,
      count: results.length,
      filter: filter
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      error: 'Failed to search resources',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/resources - Create a new resource
 */
function handleCreateResource(req: NextApiRequest, res: NextApiResponse) {
  try {
    const resourceData = req.body;

    // Validate required fields
    if (!resourceData.name?.en || !resourceData.category) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name.en', 'category']
      });
    }

    // Add the resource
    directoryManager.addResource(resourceData);

    return res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: resourceData
    });

  } catch (error) {
    console.error('Create resource error:', error);
    return res.status(500).json({
      error: 'Failed to create resource',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * PUT /api/resources - Update an existing resource
 */
function handleUpdateResource(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const updates = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'Resource ID is required'
      });
    }

    const success = directoryManager.updateResource(id, updates);

    if (!success) {
      return res.status(404).json({
        error: 'Resource not found',
        id: id
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      id: id
    });

  } catch (error) {
    console.error('Update resource error:', error);
    return res.status(500).json({
      error: 'Failed to update resource',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * DELETE /api/resources - Delete a resource
 */
function handleDeleteResource(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'Resource ID is required'
      });
    }

    // Note: The ResourcesDirectoryManager doesn't have a delete method in the current implementation
    // For now, we'll mark the resource as inactive
    const success = directoryManager.updateResource(id, { status: 'inactive' });

    if (!success) {
      return res.status(404).json({
        error: 'Resource not found',
        id: id
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resource deactivated successfully',
      id: id
    });

  } catch (error) {
    console.error('Delete resource error:', error);
    return res.status(500).json({
      error: 'Failed to delete resource',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
