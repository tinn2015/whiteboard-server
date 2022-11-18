import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
export class DeleteCanvasDto {
  @IsNotEmpty({ message: 'pageId 不能为空' })
  @IsNumber()
  readonly pageId: number;
  @IsNotEmpty({ message: 'roomId 不能为空' })
  @IsString()
  readonly roomId: string;

  @IsNotEmpty({ message: 'userId 不能为空' })
  @IsString()
  readonly userId: string;
}
