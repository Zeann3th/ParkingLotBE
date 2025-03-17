import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import env from 'src/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_ACCESS_SECRET,
    });
  }

  validate(payload: any) {
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
