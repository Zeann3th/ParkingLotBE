import { Injectable, CanActivate, ExecutionContext, Inject, HttpException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { sections, userPrivileges } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';

@Injectable()
export class PrivilegeGuard implements CanActivate {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new HttpException("User not found", 403);
    }
    if (user.role !== "ADMIN") {
      const allowedSections = (await this.db.select({ sectionId: userPrivileges.sectionId })
        .from(userPrivileges)
        .where(eq(userPrivileges.userId, user.id))
      )
        .map(({ sectionId }) => sectionId);

      request.user.allowedSections = allowedSections;
    }

    return true;
  }
}
