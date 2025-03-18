import { Body, Controller, Get, Headers, HttpCode, HttpException, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto } from './dto/auth.dto';
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import env from 'src/config';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags("Authentication")
@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: "Register a new user", description: "Register a new user with a username and password" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        username: { type: "string", example: "username" },
        password: { type: "string", example: "password" }
      },
    }
  })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 409, description: "User already exists" })
  @ApiResponse({ status: 500, description: "Failed to register user" })
  @Post('register')
  async register(@Body() body: RegisterUserDto) {
    return this.authService.register(body);
  }

  @ApiOperation({ summary: "Login a user", description: "Login user using username and password" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        username: { type: "string", example: "username" },
        password: { type: "string", example: "password" }
      }
    }
  })
  @ApiResponse({ status: 200, description: "{access_token: ...}" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 401, description: "Invalid password" })
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginUserDto, @Res() response: Response) {
    const { accessToken, refreshToken } = await this.authService.login(body);
    response.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production" ? true : false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/"
    });
    return response.send({ access_token: accessToken });
  }

  @Get('refresh')
  async refresh(@Req() request: Request) {
    const refreshToken = request.cookies["refresh_token"]
    return this.authService.refresh(refreshToken);
  }

  @ApiOperation({ summary: "Logout a user", description: "Logout a user from session, requires login if to enter again" })
  @ApiCookieAuth("refresh_token")
  @ApiResponse({ status: 204, description: "Refresh token removed from server and database's cookies" })
  @Get('logout')
  @HttpCode(204)
  async logout(@Req() request: Request) {
    const refreshToken = request.cookies["refresh_token"]
    return this.authService.logout(refreshToken)
  }

  @ApiOperation({ summary: "Update user credentials and privileges", description: "Update user credentials and privileges" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Patch(":id")
  async update(@Param("id") id: number, @Body() body: UpdateUserDto) {
    return this.authService.update(id, body)
  }
}
