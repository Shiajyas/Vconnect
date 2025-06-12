import express from 'express';
import { UserController } from '../../controllers/UserController';
import userAuthMiddleware from '../../middleware/userAuthMiddleware';
import { UserService } from '../../../useCase/UserService';
import { UserRepository } from '../../../data/repositories/userRepository';
import { PostRepository } from '../../../data/repositories/PostRepository';
import SubscriptionUseCase from '../../../useCase/SubscriptionUseCase';
import { CallHistoryRepository } from '../../../data/repositories/CallHistoryRepository';
import { upload } from '../../middleware/uploadMiddleware';

const router = express.Router();
const userRepositoryInstance = new UserRepository();
const postRepositoryInstance = new PostRepository();
const callHistoryRepositoryInstance = new CallHistoryRepository();
const subscriptionUseCaseInstance = SubscriptionUseCase;
export function userRoutes() {
  const userServiceInstance = new UserService(
    userRepositoryInstance,
    postRepositoryInstance,
  );
  const userController = new UserController(
    userServiceInstance,
    subscriptionUseCaseInstance,
    callHistoryRepositoryInstance,
  );

  router.get(
    '/suggestions',
    userAuthMiddleware.authenticate,
    userController.getSuggestions.bind(userController),
  );

  router.get(
    '/followers/:id',
    userAuthMiddleware.authenticate,
    userController.getFollowers.bind(userController),
  );

  router.get(
    '/following/:id',
    userAuthMiddleware.authenticate,
    userController.getFollowing.bind(userController),
  );

  router.post(
    '/unfollow/:id',
    userAuthMiddleware.authenticate,
    userController.unfollowUser.bind(userController),
  );

  router.get(
    '/profile/:id',
    userAuthMiddleware.authenticate,
    userController.getProfile.bind(userController),
  );

  router.get(
    '/post/:id',
    userAuthMiddleware.authenticate,
    userController.getUserPost.bind(userController),
  );

  router.put(
    '/profile/:id',
    upload.single('avatar'),
    userAuthMiddleware.authenticate,
    (req, res, next) => {
      userController
        .updateUserprofile(req, res)
        .then(() => next())
        .catch(next);
    },
  );

  router.get(
    '/profile/savedPost/:id',
    userAuthMiddleware.authenticate,
    userController.getUserSavedPost.bind(userController),
  );

  router.get(
    '/subscription/:id',
    userAuthMiddleware.authenticate,
    async (req, res, next) => {
      try {
        await userController.getSubscription(req, res);
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    '/subscribe/:id',
    userAuthMiddleware.authenticate,
    async (req, res, next) => {
      try {
        await userController.subscribe(req, res);
        next();
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    '/confirm-subscription',
    userAuthMiddleware.authenticate,
    async (req, res, next) => {
      try {
        await userController.confirmSubscription(req, res);
        next();
      } catch (error) {
        next(error);
      }
    },
  );

  // subscription history

  router.get(
    '/subscription/history/:id',
    userAuthMiddleware.authenticate,
    async (req, res, next) => {
      try {
        await userController.getSubscriptionHistory(req, res);
        next();
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    '/call_history/:id',
    userAuthMiddleware.authenticate,
    async (req, res, next) => {
      try {
        await userController.getCallHistory(req, res);
        next();
      } catch (error) {
        next(error);
      }
    },
  );

  router.post('/upload', upload.any(), async (req, res, next) => {
    try {
      await userController.uploadMedia(req, res);
      next();
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/search',
    userAuthMiddleware.authenticate,
    async (req, res, next) => {
      try {
        console.log(req.query);
        await userController.searchUsers(req, res);
        next();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
