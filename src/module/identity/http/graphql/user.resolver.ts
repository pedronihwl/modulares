import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './types/user.type';
import { CreateUserInput } from './types/create-user-input.type';
import { UserManagementService } from '@contentIdentity/core/services/user-managment.service';
import { AuthenticatedRequest, AuthGuard } from '../guard/auth.guard';


@Resolver()
export class UserResolver {
  constructor(private readonly userManagementService: UserManagementService) {}
  @Mutation(() => User)
  async createUser(
    @Args('CreateUserInput') createUserInput: CreateUserInput,
  ): Promise<User> {
    const user = await this.userManagementService.create(createUserInput);
    return user;
  }

  @Query(() => User)
  @UseGuards(AuthGuard)
  async getProfile(
    @Context('req')
    req: AuthenticatedRequest,
  ): Promise<User> {
    return req.user;
  }
}