import { Injectable, CanActivate, ExecutionContext, Inject, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';
import { users } from 'src/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new HttpException("Authorization header missing", 401);
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new HttpException("Invalid token format", 401);
    }

    try {
      const payload = this.jwtService.verify(token);
      const [user] = await this.db.select().from(users).where(eq(users.id, payload.sub));

      if (!user) {
        throw new HttpException("User not found", 401);
      }
      if (!user.isAuthenticated) {
        throw new HttpException("User not authenticated", 401);
      }

      const { password, ...safeUser } = user

      request.user = safeUser;
      return true;
    } catch (error) {
      throw new HttpException("Invalid or expired token", 401);
    }
  }
}
