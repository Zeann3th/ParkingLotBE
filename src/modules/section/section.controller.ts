import { Body, Controller, Get, Patch, Post, Param, Delete, UseGuards, HttpCode, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
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

  @ApiOperation({ summary: "Get reserved slots", description: "Get reserved slots" })
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY")
  @Get(":id/reserved")
  async getReservedSlots(@User() user: UserInterface, @Param("id") id: number) {
    return await this.sectionService.getReservedSlots(user, id);
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
  @ApiResponse({ status: 409, description: "Section name already exists" })
  @ApiResponse({ status: 500, description: "Failed to create section" })
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
  async update(@User() user: UserInterface, @Param("id") id: number, @Body() body: UpdateSectionDto) {
    return await this.sectionService.update(user, id, body);
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

  @ApiOperation({ summary: "Report revenue of a section", description: "Report revenue of a section" })
  @ApiParam({ name: "id", description: "Section id" })
  @ApiQuery({ name: "from", description: "From date", example: "2022-01-01", required: false })
  @ApiQuery({ name: "to", description: "To date", example: "2022-12-31", required: false })
  @ApiResponse({ status: 200, description: "Report generated successfully" })
  @ApiResponse({ status: 403, description: "You are not allowed to view this section report" })
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY")
  @Post(":id/report")
  async report(@User() user: UserInterface, @Param("id") id: number, @Query("from") from: string, @Query("to") to: string) {
    return await this.sectionService.report(user, id, from, to);
  }
}
