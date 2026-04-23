import { College } from '../enums/college.enum';
import { Department } from '../enums/department.enum';
import { IsEnum, IsString, MaxLength } from 'class-validator';

export class ProfileUpdateReqDto {
  @IsString()
  @MaxLength(50)
  nickname: string;

  @IsEnum(College)
  college: College;

  @IsEnum(Department)
  department: Department;
}
