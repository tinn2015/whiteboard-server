import { IsNotEmpty, IsOptional, IsArray } from 'class-validator';
export class CreateRoomDto {
  @IsNotEmpty()
  roomId: string;
  @IsArray()
  pages: { pid: number; objects: [] }[];
  @IsNotEmpty()
  currentPage: number;
  @IsNotEmpty()
  bg: string;
}
