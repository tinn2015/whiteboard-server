import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteCanvasDto {
  @IsNotEmpty({ message: 'pageId 不能为空' })
  @IsNumber()
  @ApiProperty()
  readonly pageId: number;
  @IsNotEmpty({ message: 'roomId 不能为空' })
  @IsString()
  @ApiProperty()
  readonly roomId: string;

  @IsNotEmpty({ message: 'userId 不能为空' })
  @IsString()
  @ApiProperty()
  readonly userId: string;
}
