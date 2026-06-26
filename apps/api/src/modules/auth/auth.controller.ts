import { Controller, Post, Body, Get, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'ลงทะเบียนผู้ใช้ใหม่' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'เข้าสู่ระบบด้วย email/password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('line/login')
  @ApiOperation({ summary: 'เริ่มต้น LINE Login OAuth flow — ส่งกลับ URL สำหรับ redirect' })
  async getLineLoginUrl() {
    const { url, state } = this.authService.getLineLoginUrl();
    return { url, state };
  }

  @Get('line/callback')
  @ApiOperation({ summary: 'LINE OAuth callback — แลก code เป็น JWT token' })
  @ApiQuery({ name: 'code', required: true, description: 'Authorization code from LINE' })
  @ApiQuery({ name: 'state', required: true, description: 'CSRF state parameter' })
  async lineCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
  ) {
    // Handle LINE login errors (user denied access, etc.)
    if (error) {
      throw new BadRequestException(
        `LINE Login error: ${error} - ${errorDescription || 'Unknown error'}`,
      );
    }

    if (!code || !state) {
      throw new BadRequestException('Missing code or state parameter');
    }

    return this.authService.handleLineCallback(code, state);
  }

  @Post('line-login')
  @ApiOperation({ summary: 'เข้าสู่ระบบผ่าน LINE (direct — สำหรับ LINE LIFF apps)' })
  async lineLogin(@Body() body: { lineUserId: string; displayName: string }) {
    return this.authService.loginWithLine(body.lineUserId, body.displayName);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูข้อมูลผู้ใช้ปัจจุบัน' })
  async getProfile(@Request() req: any) {
    return req.user;
  }
}
