import { IUserService } from "./interfaces/IUserService";
import { IUserRepository } from "../data/interfaces/IUserRepository";
import { IUser } from "../core/domain/interfaces/IUser";

export class UserService implements IUserService {
    private userRepository: IUserRepository;

    constructor(userRepository: IUserRepository) {

        this.userRepository = userRepository;
       
     
    }

    async getSuggestions(userId: string): Promise<IUser[]> {
        const currentUser = await this.userRepository.findById(userId);
        if (!currentUser) {
            throw new Error("User not found");
        }

        const excludedUserIds = [...(currentUser.following || []), ...(currentUser.followers || []), userId];
        return this.userRepository.find({ _id: { $nin: excludedUserIds } });
    }


}
