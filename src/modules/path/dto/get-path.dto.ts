import { IsNumber, IsString, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetPathDto {
  @IsNotEmpty({ message: 'pageId 不能为空' })
  @IsNumber()
  @ApiProperty()
  readonly pageId: number;

  @IsNotEmpty({ message: 'pathId 不能为空' })
  @IsString()
  @ApiProperty()
  readonly pathId: string;
}
