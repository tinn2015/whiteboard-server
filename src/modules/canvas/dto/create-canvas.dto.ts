import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCanvasDto {
  // @IsNotEmpty({ message: 'pageId 不能为空' })
  // @IsString()
  // readonly pageId: string;
  @IsNotEmpty({ message: 'roomId 不能为空' })
  @IsString()
  @ApiProperty({ description: 'roomId 必选' })
  readonly roomId: string;
  @IsNotEmpty({ message: 'userId 不能为空' })
  @IsString()
  @ApiProperty()
  readonly userId: string;
  // @IsString()
  // readonly pageId: string;
}
