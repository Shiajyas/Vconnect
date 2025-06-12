import { Request, Response } from 'express';
import { AdminOverviewService } from '../../useCase/AdminOverviewService';
const service = new AdminOverviewService();

export const getAdminOverview = async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as '7d' | '1m' | '1y') || '7d';
    const minLikes = Number(req.query.minLikes ?? 0);
    const maxLikes = Number(req.query.maxLikes ?? Infinity);

    const data = await service.getOverview(range, {
      min: minLikes,
      max: maxLikes,
    });
    res.status(200).json(data);
  } catch (err) {
    console.error('Admin overview fetch error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ✅ Controller for GET /overview/most-liked
export const getMostLikedPosts = async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as '7d' | '1m' | '1y') || '7d';
    const minLikes = Number(req.query.minLikes ?? 0);
    const maxLikes = Number(req.query.maxLikes ?? Infinity);

    const posts = await service.getMostLikedPosts(range, {
      min: minLikes,
      max: maxLikes,
    });

    res.status(200).json(posts);
  } catch (err) {
    console.error('Most liked posts fetch error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getReportedPosts = async (req: Request, res: Response) => {
  try {
    console.log('Reached reported posts endpoint');

    const range = (req.query.range as string) || '7d';
    const validRanges = ['7d', '1m', '1y'];
    if (!validRanges.includes(range)) {
      res.status(400).json({ message: 'Invalid range parameter' });
      return;
    }

    // Parse pagination params with defaults
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Optional: validate page and limit are positive integers
    if (page < 1 || limit < 1) {
      res.status(400).json({ message: 'Invalid pagination parameters' });
      return;
    }

    // Pass range, page, and limit to service method
    const posts = await service.getReportedPosts(
      range as '7d' | '1m' | '1y',
      page,
      limit,
    );

    // console.log("Fetched reported posts:", posts);

    res.status(200).json(posts);
  } catch (err) {
    console.error('Error fetching reported posts:', err);
    res.status(500).json({ message: 'Internal Server Error' });
    return;
  }
};

export const getReportedPostsCount = async (req: Request, res: Response) => {
  try {
    const count = await service.getReportedPostsCount();
    console.log('Fetched reported posts count:', count);
    res.status(200).json({ count: count });
  } catch (err) {
    console.error('Error fetching reported posts count:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
