import { IsNotEmpty } from 'class-validator';
export class GetRoomDto {
  @IsNotEmpty()
  roomId: string;
  @IsNotEmpty()
  userId: string;
}
