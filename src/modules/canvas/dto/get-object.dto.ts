import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
} from 'class-validator';
export class GetObjectsDto {
  @IsNotEmpty({ message: 'pageId 不能为空' })
  @IsNumber()
  readonly pageId: number;
  @IsNotEmpty({ message: 'oids 不能为空' })
  @IsArray({ message: 'oids 需要为json格式' })
  readonly oids: string[];
  @IsOptional()
  @IsString()
  readonly userId: string;
}
