import { Controller, Get, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {

  @Post('register')
  async register() {
    return "";
  }

  @Post('login')
  async login() {
    return "";
  }

  @Get('refresh')
  async refresh() {
    return "";
  }

  @Get('logout')
  async logout() {
    return "";
  }
}
