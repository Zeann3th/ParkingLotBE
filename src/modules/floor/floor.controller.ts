import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/jwt.guard';

@Controller('floor')
@UseGuards(AuthGuard)
export class FloorController { }
