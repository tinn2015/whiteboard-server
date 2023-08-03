import { IsString, IsNotEmpty, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UploadCanvasDto {
  // @IsNotEmpty({ message: 'pageId 不能为空' })
  // @IsString()
  // readonly pageId: string;
  @IsNotEmpty({ message: 'roomId 不能为空' })
  @IsString()
  @ApiProperty()
  readonly roomId: string;
  @IsString()
  @ApiProperty()
  readonly userId?: string;

  @IsNotEmpty({ message: 'pageId 不能为空' })
  @IsNumber()
  @ApiProperty()
  readonly pid: number;

  @IsArray({ message: 'objects 需要为json格式' })
  @ApiProperty()
  readonly objects: [];
  // @IsString()
  // readonly pageId: string;
}
