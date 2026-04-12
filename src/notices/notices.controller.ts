import { Controller, Get, Param, Query } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';
import { PaginatedNoticesDto } from './dto/paginated-notices.dto';

@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get()
  async getNotices(
    @Query() query: CursorPaginationDto,
  ): Promise<PaginatedNoticesDto> {
    return this.noticesService.findByCursor(query);
  }

  @Get(':id')
  async getNotice(@Param('id') id: string) {
    return this.noticesService.findOne(id);
  }
}
