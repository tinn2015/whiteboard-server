import { IsNotEmpty, IsOptional } from 'class-validator';
export class DeleteRoomDto {
  @IsNotEmpty()
  roomId: string;
  @IsOptional()
  all: boolean;
}
