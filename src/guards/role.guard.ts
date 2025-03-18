import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { userPrivileges } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        message: 'You do not have permission to access this resource',
      });
    }

    if (user.role === "ADMIN") return true;

    const allowedSections = (await this.db.select({ sectionId: userPrivileges.sectionId })
      .from(userPrivileges)
      .where(eq(userPrivileges.userId, user.id))
    )
      .map(({ sectionId }) => sectionId);

    request.user.allowedSections = allowedSections;

    return true;
  }
}
