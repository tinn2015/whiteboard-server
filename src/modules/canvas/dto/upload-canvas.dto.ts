import { IsString, IsNotEmpty, IsArray, IsNumber } from 'class-validator';
export class UploadCanvasDto {
  // @IsNotEmpty({ message: 'pageId 不能为空' })
  // @IsString()
  // readonly pageId: string;
  @IsNotEmpty({ message: 'roomId 不能为空' })
  @IsString()
  readonly roomId: string;
  @IsNotEmpty({ message: 'userId 不能为空' })
  @IsString()
  readonly userId: string;

  @IsNotEmpty({ message: 'pageId 不能为空' })
  @IsNumber()
  readonly pid: number;

  @IsArray({ message: 'objects 需要为json格式' })
  readonly objects: [];
  // @IsString()
  // readonly pageId: string;
}
