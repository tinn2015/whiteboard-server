import { IsString, IsNotEmpty } from 'class-validator';
export class CreateCanvasDto {
  // @IsNotEmpty({ message: 'pageId 不能为空' })
  // @IsString()
  // readonly pageId: string;
  @IsNotEmpty({ message: 'roomId 不能为空' })
  @IsString()
  readonly roomId: string;
}