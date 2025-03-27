import { HttpException, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';
import { LoginUserDto, RegisterUserDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { userPrivileges, users } from 'src/database/schema';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';
import env from 'src/common';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private readonly jwtService: JwtService,
  ) { }

  async register({ username, email, password, name }: RegisterUserDto) {
    password = await bcrypt.hash(password, 10);
    try {
      await this.db.insert(users).values({ username, email, password, name });
      return { message: "User registered successfully" };
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT') {
        throw new HttpException("User already exists", 409);
      }
      throw new HttpException("Failed to register user", 500);
    }
  }

  async login({ username, email, password }: LoginUserDto) {
    let user: any;
    if (username) {
      [user] = await this.db.select().from(users)
        .where(eq(users.username, username));
    } else if (email) {
      [user] = await this.db.select().from(users)
        .where(eq(users.email, email));
    }

    if (!user) {
      throw new HttpException("User not found", 404);
    }

    if (!await bcrypt.compare(password, user.password)) {
      throw new HttpException("Invalid password", 401);
    }

    const payload = { sub: user.id, username: user.username, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: "15m"
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: env.JWT_REFRESH_SECRET,
      expiresIn: "7d"
    });

    await this.db.update(users)
      .set({ refreshToken })
      .where(eq(users.id, user.id))

    return { accessToken, refreshToken, user: payload };
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      await this.db.update(users)
        .set({ refreshToken: null })
        .where(eq(users.refreshToken, refreshToken))
    }
    return {};
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new HttpException("Refresh token is required", 401);

    try {
      const decoded = this.jwtService.verify(refreshToken, { secret: env.JWT_REFRESH_SECRET })

      const [user] = await this.db.select().from(users).where(eq(users.refreshToken, refreshToken))
      if (!user) throw new HttpException("Invalid refresh token", 403);

      const payload = { sub: user.id, username: user.username, role: user.role }

      const accessToken = this.jwtService.sign(payload, {
        secret: env.JWT_ACCESS_SECRET,
        expiresIn: "15m"
      })
      return { access_token: accessToken };
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new HttpException("Refresh token expired", 401);
      }
      if (e.name === 'JsonWebTokenError') {
        throw new HttpException("Invalid refresh token", 403);
      }

      throw new HttpException("Failed to refresh user's access token", 500);
    }
  }

  async update(id: number, { role, name, email }: UpdateUserDto) {
    const [existingUser] = await this.db.select().from(users).where(eq(users.id, id));
    if (!existingUser) {
      throw new HttpException("User not found", 404);
    }

    try {
      const updateData = {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role: role }),
        updatedAt: new Date().toISOString()
      };

      const [res] = await this.db.update(users)
        .set(updateData)
        .where(eq(users.id, id)).returning();

      const { password: pwd, refreshToken, ...safeUser } = res;
      return safeUser;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new HttpException("User already exists", 409);
      }
      throw new HttpException("Failed to update user", 500);
    }
  }

  async forgotPassword(email: string) {
  }

  async resetPassword(token: string, password: string) {
  }

  async verifyEmail(token: string) {
  }

  async resendEmail(email: string, action: string) {
  }
}
