import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { FormFieldType } from '../../../common/enums/form-field-type.enum.js';

export class FormValidationRulesDto {
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  max?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minLength?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxLength?: number;

  @ApiPropertyOptional({ example: '^[0-9]+$' })
  @IsOptional()
  @IsString()
  pattern?: string;
}

export class FormFieldDto {
  @ApiProperty({ example: 'phone', description: 'Unique field key' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
    message: 'key must start with a letter and contain only alphanumeric characters or underscores',
  })
  key: string;

  @ApiProperty({ example: 'Phone Number', description: 'Display label' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label: string;

  @ApiProperty({ enum: FormFieldType, example: FormFieldType.PHONE })
  @IsEnum(FormFieldType)
  type: FormFieldType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ example: '+1 234 567 890' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeholder?: string;

  @ApiPropertyOptional({ example: 'Include country code' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  helpText?: string;

  @ApiPropertyOptional({
    example: ['Beginner', 'Intermediate', 'Expert'],
    description: 'Allowed options for select/radio/checkbox',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => FormValidationRulesDto)
  validation?: FormValidationRulesDto;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
