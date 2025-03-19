import { Body, Controller, Get, Patch, Post, Param, Delete, UseGuards, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { SectionService } from './section.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';

@Controller('sections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SectionController {
  constructor(private readonly sectionService: SectionService) { }

  @ApiOperation({ summary: "Get all sections", description: "Get all sections" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return all sections" })
  @ApiResponse({ status: 403, description: "You are not allowed to view any sections" })
  @Roles("ADMIN", "SECURITY")
  @Get()
  async getAll(@User() user: UserInterface) {
    return await this.sectionService.getAll(user);
  }

  @ApiOperation({ summary: "Get section by id", description: "Get section by id" })
  @ApiParam({ name: "id", description: "Section id" })
  @ApiResponse({ status: 200, description: "Return section" })
  @ApiResponse({ status: 403, description: "You are not allowed to view this section" })
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY")
  @Get(":id")
  async getById(@User() user: UserInterface, @Param("id") id: number) {
    return await this.sectionService.getById(user, id);
  }

  @ApiOperation({ summary: "Create a new section", description: "Create a new section" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "B1" },
        capacity: { type: "number", example: 100 }
      }
    }
  })
  @ApiResponse({ status: 201, description: "Section created successfully" })
  @ApiBearerAuth()
  @Roles("ADMIN")
  @Post()
  async create(@Body() body: CreateSectionDto) {
    return await this.sectionService.create(body);
  }

  @ApiOperation({ summary: "Update a section", description: "Update a section" })
  @ApiParam({ name: "id", description: "Section id" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "B1" },
        capacity: { type: "number", example: 100 }
      }
    }
  })
  @ApiResponse({ status: 200, description: "Section updated successfully" })
  @ApiResponse({ status: 409, description: "Section name already exists" })
  @ApiResponse({ status: 500, description: "Failed to update section" })
  @ApiBearerAuth()
  @Roles("ADMIN")
  @Patch(":id")
  async update(@Param("id") id: number, @Body() body: UpdateSectionDto) {
    return await this.sectionService.update(id, body);
  }

  @ApiOperation({ summary: "Delete a section", description: "Delete a section" })
  @ApiParam({ name: "id", description: "Section id" })
  @ApiResponse({ status: 204, description: "Section deleted successfully" })
  @HttpCode(204)
  @ApiBearerAuth()
  @Roles("ADMIN")
  @Delete(":id")
  async delete(@Param("id") id: number) {
    return await this.sectionService.delete(id);
  }

  @ApiOperation({ summary: "Get all slots of a section", description: "Get all slots of a section" })
  @ApiParam({ name: "id", description: "Section id" })
  @ApiResponse({ status: 200, description: "Return all slots" })
  @ApiResponse({ status: 403, description: "You are not allowed to view this section" })
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY")
  @Get(":id/slots")
  async getAllSlots(@User() user: UserInterface, @Param("id") id: number) {
    return await this.sectionService.getAllSlots(user, id);
  }

  @ApiOperation({ summary: "Get slot by id", description: "Get slot by id" })
  @ApiParam({ name: "id", description: "Section id" })
  @ApiParam({ name: "slotId", description: "Slot id" })
  @ApiResponse({ status: 200, description: "Return slot" })
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY")
  @Get(":id/slots/:slotId")
  async getSlotById(@User() user: UserInterface, @Param("id") id: number, @Param("slotId") slotId: number) {
    return await this.sectionService.getSlotById(user, id, slotId);
  }
}
