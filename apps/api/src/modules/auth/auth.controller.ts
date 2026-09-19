import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards, UsePipes } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import { LoginSchema, RegisterSchema, type LoginInput, type RegisterInput } from "@ipp/shared";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthService } from "./auth.service";
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS } from "../../common/auth/refresh-cookie";
import type { GoogleUserPayload } from "./google.strategy";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  register(@Body() body: RegisterInput) {
    return this.authService.register(body);
  }

  @Post("login")
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() body: LoginInput, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(body);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
    return { accessToken };
  }

  @Post("refresh")
  @HttpCode(200)
  refresh(@Req() req: Request) {
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    return this.authService.refresh(refreshToken);
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/auth" });
    return { success: true };
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleAuth() {
    // Corpo vazio: o AuthGuard("google") já intercepta a request e redireciona para o Google.
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as GoogleUserPayload;
    const { refreshToken } = await this.authService.loginWithGoogle(googleUser);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
    res.redirect(process.env.WEB_URL as string);
  }
}
