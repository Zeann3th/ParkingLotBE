import { Body, Controller, Get, Headers, HttpCode, HttpException, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto } from './dto/auth.dto';
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import e, { Request, Response } from 'express';
import env from 'src/common';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetUserPasswordDto, VerifyUserEmailDto } from './dto/verify-user.dto';
import { Throttle } from '@nestjs/throttler';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';

@ApiTags("Authentication")
@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: "Register a new user" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        username: { type: "string", example: "username" },
        name: { type: "string", example: "name" },
        password: { type: "string", example: "password" },
        email: { type: "string", example: "email" },
      },
      required: ["username", "password", "email"]
    }
  })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 409, description: "User already exists" })
  @ApiResponse({ status: 500, description: "Failed to register user" })
  @Post('register')
  async register(@Body() body: RegisterUserDto) {
    return await this.authService.register(body);
  }

  @ApiOperation({ summary: "Login a user" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        username: { type: "string", example: "username" },
        password: { type: "string", example: "password" }
      },
      required: ["password"]
    }
  })
  @ApiResponse({ status: 200, description: "Success" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 401, description: "Invalid password" })
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginUserDto, @Res() response: Response) {
    const { accessToken, refreshToken } = await this.authService.login(body);
    response.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      partitioned: env.NODE_ENV === "production",
    });
    return response.send({ access_token: accessToken });
  }

  @ApiOperation({ summary: "Refresh access token" })
  @ApiCookieAuth("refresh_token")
  @ApiResponse({ status: 200, description: "Success" })
  @ApiResponse({ status: 401, description: "Refresh token is required" })
  @ApiResponse({ status: 401, description: "Refresh token expired" })
  @ApiResponse({ status: 403, description: "Invalid refresh token" })
  @ApiResponse({ status: 500, description: "Failed to refresh user's access token" })
  @Get('refresh')
  async refresh(@Req() request: Request) {
    const refreshToken = request.cookies["refresh_token"];
    return await this.authService.refresh(refreshToken);
  }

  @ApiOperation({ summary: "Logout a user" })
  @ApiCookieAuth("refresh_token")
  @ApiResponse({ status: 204, description: "Refresh token removed from server and database's cookies" })
  @Get('logout')
  @HttpCode(204)
  async logout(@Req() request: Request, @Res() response: Response) {
    const refreshToken = request.cookies["refresh_token"];
    await this.authService.logout(refreshToken);
    response.clearCookie("refresh_token", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      partitioned: env.NODE_ENV === "production",
    });
    return response.status(204).send();
  }

  @ApiOperation({ summary: "Update user credentials and privileges" })
  @ApiParam({ name: "id", description: "User id" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "name" },
        email: { type: "string", example: "email" },
        role: { type: "string", example: "ADMIN" }
      },
      required: []
    }
  })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Patch(":id")
  async update(@Param("id") id: number, @Body() body: UpdateUserDto) {
    return await this.authService.update(id, body);
  }

  @ApiOperation({ summary: "Send forgot password request and mail" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "email" }
      },
      required: ["email"]
    }
  })
  @ApiResponse({ status: 200, description: "Success" })
  @ApiResponse({ status: 400, description: "Email is required" })
  @ApiResponse({ status: 404, description: "User not found" })
  @Throttle({ default: { limit: 3, ttl: 60 } })
  @HttpCode(200)
  @Post('forgot-password')
  async forgotPassword(@Body("email") email: string) {
    return await this.authService.forgotPassword(email);
  }

  @ApiOperation({ summary: "Reset user password" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "email" },
        password: { type: "string", example: "password" },
        pin: { type: "string", example: "token" }
      },
      required: ["email", "password", "pin"]
    }
  })
  @ApiResponse({ status: 200, description: "Success" })
  @ApiResponse({ status: 403, description: "Invalid or expired token" })
  @ApiResponse({ status: 404, description: "User not found" })
  @HttpCode(200)
  @Post('reset-password')
  async resetPassword(@Body() body: ResetUserPasswordDto) {
    return await this.authService.resetPassword(body);
  }

  @ApiOperation({ summary: "Verify user email" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "email" },
        pin: { type: "string", example: "token" }
      },
      required: ["email", "pin"]
    }
  })
  @ApiResponse({ status: 200, description: "Success" })
  @ApiResponse({ status: 403, description: "Invalid or expired token" })
  @ApiResponse({ status: 404, description: "User not found" })
  @HttpCode(200)
  @Post("verify-email")
  async verifyEmail(@Body() body: VerifyUserEmailDto) {
    return await this.authService.verifyEmail(body);
  }

  @ApiOperation({ summary: "Resend email verification" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "email" },
        action: { type: "string", example: "action" }
      },
      required: ["email", "action"]
    }
  })
  @ApiResponse({ status: 200, description: "Success" })
  @ApiResponse({ status: 400, description: "Email and action are required" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 400, description: "Invalid action" })
  @Throttle({ default: { limit: 3, ttl: 60 } })
  @HttpCode(200)
  @Post("resend-email")
  async resendEmail(@Body("email") email: string, @Body("action") action: string) {
    return await this.authService.resendEmail(email, action);
  }

  @ApiOperation({ summary: "Search user by name, email" })
  @ApiBearerAuth()
  @ApiQuery({ name: "name", required: false, type: String })
  @ApiQuery({ name: "email", required: false, type: String })
  @ApiResponse({ status: 200, description: "Success" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SECURITY")
  @Get("search")
  async search(@Query("name") name: string, @Query("email") email: string) {
    return await this.authService.search(name, email);
  }

  @ApiOperation({ summary: "Get user by id" })
  @ApiBearerAuth()
  @ApiParam({ name: "id", description: "User id" })
  @ApiResponse({ status: 200, description: "Success" })
  @ApiResponse({ status: 404, description: "User not found" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SECURITY", "USER")
  @Get(":id")
  async getById(@User() user: UserInterface, @Param("id") id: number) {
    return await this.authService.getById(user, id);
  }
}
