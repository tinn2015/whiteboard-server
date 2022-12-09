import { IsNumber, IsString, IsArray, IsNotEmpty } from 'class-validator';
export class GetPathDto {
  @IsNotEmpty({ message: 'pageId 不能为空' })
  @IsNumber()
  readonly pageId: number;

  @IsNotEmpty({ message: 'pathId 不能为空' })
  @IsString()
  readonly pathId: string;
}
