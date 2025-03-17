import { Body, Controller, Get, Patch, Post, Param, Delete, UseGuards } from '@nestjs/common';
import { FloorService } from './floor.service';
import { AuthGuard } from 'src/guards/jwt.guard';

@Controller('floors')
@UseGuards(AuthGuard)
export class FloorController {
  constructor(private readonly floorService: FloorService) { }

  // Floors
  @Get()
  async getAll() {

  }

  @Get(":id")
  async getById() {

  }

  @Post()
  async create(@Body() body: any) {

  }

  @Patch(":id")
  async update(@Param("id") id: number, @Body() body: any) {

  }

  @Delete(":id")
  async delete(@Param("id") id: number) {

  }

  // Sections

  @Get(":floorId/sections")
  async getSections(@Param("floorId") floorId: number) {

  }

  @Get(":floorId/sections/:id")
  async getSectionById(@Param("id") id: number) {

  }

  @Post(":floorId/sections")
  async createSection(@Param("floorId") floorId: number, @Body() body: any) {

  }

  @Patch(":floorId/sections/:id")
  async updateSection(@Param("id") id: number, @Body() body: any) {

  }

  @Delete(":floorId/sections/:id")
  async deleteSection(@Param("id") id: number) {

  }

  // Slots

  @Get(":floorId/sections/:sectionId/slots")
  async getSlots(@Param("floorId") floorId: number, @Param("sectionId") sectionId: number) {

  }

  @Get(":floorId/sections/:sectionId/slots/:id")
  async getSlotById(
    @Param("floorId") floorId: number,
    @Param("sectionId") sectionId: number,
    @Param("id") id: number) {

  }

  @Post(":floorId/sections/:sectionId/slots")
  async createSlot(
    @Param("floorId") floorId: number,
    @Param("sectionId") sectionId: number,
    @Body() body: any) {

  }

  @Patch(":floorId/sections/:sectionId/slots/:id")
  async updateSlot(
    @Param("floorId") floorId: number,
    @Param("sectionId") sectionId: number,
    @Param("id") id: number,
    @Body() body: any) {

  }

  @Delete(":floorId/sections/:sectionId/slots/:id")
  async deleteSlot(
    @Param("floorId") floorId: number,
    @Param("sectionId") sectionId: number,
    @Param("id") id: number) {

  }
}
