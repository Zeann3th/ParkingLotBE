import { ExecutionContext, HttpException, Inject, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { users } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB
  ) { super(); }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isValid = await super.canActivate(context);
    if (!isValid) return false;

    const request = context.switchToHttp().getRequest();

    const [user] = await this.db.select().from(users).where(eq(users.id, request.user.sub));

    if (!user.isAuthenticated) {
      throw new HttpException("User is not authenticated, please log in again", 401);
    }

    const { password, ...safeUser } = user;
    request.user = safeUser;

    return true;
  }
}
