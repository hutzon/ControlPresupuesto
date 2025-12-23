import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { AccessTokenGuard } from '../common/guards/access-token.guard';

@UseGuards(AccessTokenGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Req() req: any, @Body() createCategoryDto: CreateCategoryDto) {
    const userId = req.user['sub'];
    return this.categoriesService.create(userId, createCategoryDto);
  }

  @Get()
  findAll(@Req() req: any) {
    const userId = req.user['sub'];
    return this.categoriesService.findAll(userId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user['sub'];
    return this.categoriesService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
     const userId = req.user['sub'];
    return this.categoriesService.update(id, userId, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user['sub'];
    return this.categoriesService.remove(id, userId);
  }
}
