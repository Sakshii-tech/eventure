import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

// src/events/dto/create-event.dto.ts
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
