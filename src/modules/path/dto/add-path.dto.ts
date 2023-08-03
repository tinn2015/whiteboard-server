import { IsNumber, IsString, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class addPathDto {
  @IsNotEmpty({ message: 'index 不能为空' })
  @IsNumber()
  @ApiProperty({ description: 'path 的编号' })
  readonly index: number;

  @IsNotEmpty({ message: 'pageId 不能为空' })
  @IsNumber()
  @ApiProperty()
  readonly pageId: number;

  @IsNotEmpty({ message: 'pathId 不能为空' })
  @IsString()
  @ApiProperty()
  readonly pathId: string;

  @IsNotEmpty({ message: '轨迹数组不能为空' })
  @IsArray()
  @ApiProperty()
  readonly pathPoint: [];
}
