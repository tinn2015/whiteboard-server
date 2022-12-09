import { IsNotEmpty } from 'class-validator';
export class UpdateCurrentPageDto {
  @IsNotEmpty()
  roomId: string;
  @IsNotEmpty()
  pageId: number;
}
