import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/jwt.guard';

@Controller('sections')
@UseGuards(AuthGuard)
export class SectionController { }
