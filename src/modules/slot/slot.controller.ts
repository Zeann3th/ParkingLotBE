import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/jwt.guard';

@Controller('slot')
@UseGuards(AuthGuard)
export class SlotController { }
