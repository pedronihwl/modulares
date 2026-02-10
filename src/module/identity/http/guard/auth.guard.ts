import {
    CanActivate,
    ContextType,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { GqlExecutionContext } from '@nestjs/graphql';
  import { JwtService } from '@nestjs/jwt';

  import { Request } from 'express';
import { UserModel } from '@contentIdentity/core/user.model';
import { UserManagementService } from '@contentIdentity/core/services/user-managment.service';
import { jwtConstants } from '@contentIdentity/core/services/authentication.service';
  
  export interface AuthenticatedRequest extends Request {
    user: UserModel;
  }
  @Injectable()
  export class AuthGuard implements CanActivate {
    constructor(
      private readonly jwtService: JwtService,
      private readonly userManagementService: UserManagementService,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = await this.getRequest(context);
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException();
      }
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: jwtConstants.secret,
        });
  
        const user = await this.userManagementService.getUserById(payload.sub);
        if (!user) {
          throw new UnauthorizedException();
        }
        request.user = user;
      } catch {
        throw new UnauthorizedException();
      }
      return true;
    }
    private async getRequest(
      context: ExecutionContext,
    ): Promise<AuthenticatedRequest> {
      try {
        if (context.getType<ContextType | 'graphql'>() === 'graphql') {
          const ctx = GqlExecutionContext.create(context);
          const req = ctx.getContext().req;
          return req as AuthenticatedRequest;
        }
        const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
  
        return req;
      } catch {
        throw new UnauthorizedException();
      }
    }
  
    private extractTokenFromHeader(request: Request): string | undefined {
      const [type, token] = request.get('Authorization')?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }
  }