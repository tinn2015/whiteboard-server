import { IsNumber, IsString, IsArray, IsNotEmpty } from 'class-validator';
export class addPathDto {
  @IsNotEmpty({ message: 'index 不能为空' })
  @IsNumber()
  readonly index: number;

  @IsNotEmpty({ message: 'pageId 不能为空' })
  @IsNumber()
  readonly pageId: number;

  @IsNotEmpty({ message: 'pathId 不能为空' })
  @IsString()
  readonly pathId: string;

  @IsNotEmpty({ message: '轨迹数组不能为空' })
  @IsArray()
  readonly pathPoint: [];
}
