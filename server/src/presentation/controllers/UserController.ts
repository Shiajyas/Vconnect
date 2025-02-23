import { Request, Response } from "express";
import { IUserService } from "../../useCase/interfaces/IUserService";
import { getErrorMessage } from "../../infrastructure/utils/errorHelper";
import { IUser } from "../../core/domain/interfaces/IUser";

export class UserController {
    private userService: IUserService;

    constructor(userService: IUserService) {
        this.userService = userService;
    }

    async getSuggestions(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as Request & { user?: IUser }).user?.id;

          
            if (!userId) {
                res.status(400).json({ message: "User ID is missing" });
                return;
            }

            const suggestions = await this.userService.getSuggestions(userId);
         
            res.json(suggestions);
        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }


}
