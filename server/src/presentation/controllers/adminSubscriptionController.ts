import { Request, Response } from 'express';
import { adminSubscriptionService } from '../../useCase/adminSubscriptionService';

export const getSubscriptionsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      search,
      status,
      startDate,
      endDate,
      page = '1',
      limit = '10',
    } = req.query;

    const data = await adminSubscriptionService.getSubscriptions({
      search: String(search || ''),
      status: String(status || 'all'),
      startDate: String(startDate || ''),
      endDate: String(endDate || ''),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('getSubscriptionsController error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
};

export const getAllSubscriptionsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { search, status, startDate, endDate } = req.query;

    const data = await adminSubscriptionService.getAllSubscriptions({
      search: String(search || ''),
      status: String(status || 'all'),
      startDate: String(startDate || ''),
      endDate: String(endDate || ''),
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('getAllSubscriptionsController error:', error);
    res.status(500).json({ error: 'Failed to fetch all subscriptions' });
  }
};

export const updateSubscriptionController = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = req.params.id;
    const result = await adminSubscriptionService.toggleSubscriptionStatus(id);
    res.status(200).json(result);
  } catch (error) {
    console.error('updateSubscriptionController error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
};
