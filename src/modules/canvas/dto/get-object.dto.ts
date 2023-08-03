import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetObjectsDto {
  @IsNotEmpty({ message: 'pageId 不能为空' })
  @IsNumber()
  @ApiProperty()
  readonly pageId: number;
  @IsNotEmpty({ message: 'oids 不能为空' })
  @IsArray({ message: 'oids 需要为json格式' })
  @ApiProperty()
  readonly oids: string[];
  @IsOptional()
  @IsString()
  @ApiProperty()
  readonly userId: string;
}
