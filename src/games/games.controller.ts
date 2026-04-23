import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtGuard } from '@src/auth/guards/jwt.guard';
import { CurrentUser } from '@src/auth/decorators/current-user.decorator';
import { GameType } from './enums/game-type.enum';
import { ScoreSubmitReqDto } from './dto/scoreSubmit.dto';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post(':type/scores')
  @UseGuards(JwtGuard)
  async submitScore(
    @CurrentUser('id') userId: string,
    @Param('type', new ParseEnumPipe(GameType)) gameType: GameType,
    @Body() scoreDto: ScoreSubmitReqDto,
  ) {
    await this.gamesService.updateHighestScore(
      userId,
      gameType,
      scoreDto.score,
    );
    await this.gamesService.bufferScoreLog(userId, gameType, scoreDto.score);
    return { message: 'Score submitted successfully' };
  }

  @Get(':type/rankings/global')
  async getRankings(
    @Param('type', new ParseEnumPipe(GameType)) gameType: GameType,
    @Query('limit') limit: number = 10,
  ) {
    return this.gamesService.getTopRankings(gameType, limit);
  }

  @Get(':type/rankings/me')
  @UseGuards(JwtGuard)
  async getMyRank(
    @CurrentUser('id') userId: string,
    @Param('type', new ParseEnumPipe(GameType)) gameType: GameType,
  ) {
    const rank = await this.gamesService.getMyRank(userId, gameType);
    return { rank };
  }

  @Get(':type/rankings/:groupType')
  async getGroupRankings(
    @Param('type', new ParseEnumPipe(GameType)) gameType: GameType,
    @Param('groupType', new ParseEnumPipe(['college', 'department']))
    groupType: 'college' | 'department',
  ) {
    return this.gamesService.getGroupRankings(gameType, groupType);
  }
}
